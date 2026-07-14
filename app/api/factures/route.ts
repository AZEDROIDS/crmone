import { NextRequest } from "next/server"
import { db } from "@/db"
import { factures, cra, craJours, consultants } from "@/db/schema"
import { requireAdmin } from "@/lib/auth"
import { apiError, apiOk, nextNumeroFacture, moisLabel } from "@/lib/utils"
import { sendFacture } from "@/lib/email"
import { eq, and, inArray } from "drizzle-orm"

// GET /api/factures
export async function GET() {
  await requireAdmin().catch(() => { throw new Response("", { status: 401 }) })

  const rows = await db.query.factures.findMany({
    with: { consultant: true, partenaire: true, cra: true },
    orderBy: (f, { desc }) => [desc(f.createdAt)],
  })
  return apiOk(rows)
}

// POST /api/factures — générer une facture à partir d'un CRA validé
export async function POST(req: NextRequest) {
  await requireAdmin().catch(() => { throw new Response("", { status: 401 }) })

  const { craId } = await req.json()
  if (!craId) return apiError("craId requis")

  // Vérifier que le CRA est validé et qu'il n'y a pas déjà une facture
  const craRecord = await db.query.cra.findFirst({
    where: eq(cra.id, craId),
    with: { consultant: { with: { partenaire: true, client: true } }, jours: true },
  })
  if (!craRecord)          return apiError("CRA introuvable", 404)
  if (craRecord.statut !== "valide") return apiError("CRA non validé", 400)

  const existing = await db.query.factures.findFirst({
    where: eq(factures.craId, craId),
  })
  if (existing) return apiError("Facture déjà générée pour ce CRA", 409)

  // Calcul des jours facturables
  const joursFact = craRecord.jours.filter(j =>
    ["travail", "tele", "demi"].includes(j.type)
  )
  const joursCount = joursFact.reduce((s, j) => s + (j.type === "demi" ? 0.5 : 1), 0)

  const k   = craRecord.consultant
  const tjm = Number(k.tjmVente)
  const ht  = joursCount * tjm
  const tva = ht * 0.2

  const numero = await nextNumeroFacture()

  const [facture] = await db.insert(factures).values({
    craId,
    consultantId: k.id,
    partenaireId: k.partenaireId,
    numero,
    date:       new Date().toISOString().slice(0, 10),
    mois:       craRecord.mois,
    jours:      joursCount.toString(),
    tjm:        tjm.toString(),
    montantHt:  ht.toString(),
    tva:        tva.toString(),
    montantTtc: (ht + tva).toString(),
    statut:     "emise",
  }).returning()

  return apiOk(facture, 201)
}

// PATCH /api/factures — envoyer par email ou marquer payée
export async function PATCH(req: NextRequest) {
  await requireAdmin().catch(() => { throw new Response("", { status: 401 }) })

  const { id, action } = await req.json()
  if (!id || !action) return apiError("id et action requis")

  const facture = await db.query.factures.findFirst({
    where: eq(factures.id, id),
    with: { consultant: true, partenaire: true },
  })
  if (!facture) return apiError("Facture introuvable", 404)

  if (action === "envoyer") {
    const p = facture.partenaire
    if (!p.email) return apiError("Email du partenaire manquant")

    await sendFacture({
      to:            p.email,
      contactNom:    p.contact ?? p.nom,
      partenaireNom: p.nom,
      numero:        facture.numero,
      mois:          moisLabel(facture.mois),
      consultantNom: `${facture.consultant.prenom} ${facture.consultant.nom}`,
      montantTtc:    Number(facture.montantTtc),
      montantHt:     Number(facture.montantHt),
      jours:         Number(facture.jours),
      tjm:           Number(facture.tjm),
      delaiPaiement: p.delaiPaiement,
    })

    await db.update(factures)
      .set({ statut: "envoyee", envoyeeLe: new Date() })
      .where(eq(factures.id, id))

    return apiOk({ success: true, statut: "envoyee" })
  }

  if (action === "payer") {
    await db.update(factures)
      .set({ statut: "payee", payeeLe: new Date() })
      .where(eq(factures.id, id))
    return apiOk({ success: true, statut: "payee" })
  }

  return apiError("Action inconnue")
}
