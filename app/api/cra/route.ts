export const runtime = "nodejs"
import { NextRequest } from "next/server"
import { db } from "@/db"
import { cra, craJours, consultants } from "@/db/schema"
import { requireAuth } from "@/lib/auth"
import { craUpdateSchema, craStatutSchema } from "@/lib/validations"
import { apiError, apiOk } from "@/lib/utils"
import { sendCraValidated, sendCraRefus } from "@/lib/email"
import { moisLabel } from "@/lib/utils"
import { eq, and, inArray } from "drizzle-orm"

// GET /api/cra?consultantId=xxx&mois=2026-06
export async function GET(req: NextRequest) {
  const session = await requireAuth().catch(() => null)
  if (!session) return apiError("Non autorisé", 401)

  const { searchParams } = new URL(req.url)
  const consultantId = searchParams.get("consultantId")
  const mois         = searchParams.get("mois")

  // Un consultant ne peut lire que ses propres CRA
  if (session.user.role === "consultant" &&
      consultantId !== session.user.consultantId) {
    return apiError("Non autorisé", 403)
  }

  const conditions = []
  if (consultantId) conditions.push(eq(cra.consultantId, consultantId))
  if (mois)         conditions.push(eq(cra.mois, mois))

  const rows = await db.query.cra.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: { jours: true, justificatifs: true },
    orderBy: (c, { desc }) => [desc(c.mois)],
  })
  return apiOk(rows)
}

// POST /api/cra — créer ou mettre à jour un CRA + ses jours
export async function POST(req: NextRequest) {
  const session = await requireAuth().catch(() => null)
  if (!session) return apiError("Non autorisé", 401)

  const body   = await req.json()
  const parsed = craUpdateSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)

  const { consultantId, mois, jours } = parsed.data

  // RBAC : consultant ne peut modifier que son propre CRA
  if (session.user.role === "consultant" &&
      consultantId !== session.user.consultantId) {
    return apiError("Non autorisé", 403)
  }

  // Upsert CRA
  const existing = await db.query.cra.findFirst({
    where: and(eq(cra.consultantId, consultantId), eq(cra.mois, mois)),
  })

  let craId: string

  if (existing) {
    if (existing.statut === "valide") return apiError("CRA déjà validé", 409)
    craId = existing.id
    await db.update(cra)
      .set({ statut: "brouillon", updatedAt: new Date() })
      .where(eq(cra.id, craId))
  } else {
    const [created] = await db.insert(cra).values({
      consultantId, mois, statut: "brouillon",
    }).returning()
    craId = created.id
  }

  // Remplacer les jours
  await db.delete(craJours).where(eq(craJours.craId, craId))
  if (jours.length) {
    await db.insert(craJours).values(
      jours.map(j => ({ craId, date: j.date, type: j.type }))
    )
  }

  const updated = await db.query.cra.findFirst({
    where: eq(cra.id, craId),
    with: { jours: true },
  })
  return apiOk(updated)
}

// PATCH /api/cra — changer le statut (soumettre / valider / refuser)
export async function PATCH(req: NextRequest) {
  const session = await requireAuth().catch(() => null)
  if (!session) return apiError("Non autorisé", 401)

  const body   = await req.json()
  const { id, ...rest } = body
  if (!id) return apiError("id requis")

  const parsed = craStatutSchema.safeParse(rest)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)

  const { statut, motifRefus } = parsed.data

  // Consultant ne peut que soumettre ou repasser en brouillon
  if (session.user.role === "consultant" &&
      !["soumis", "brouillon"].includes(statut)) {
    return apiError("Non autorisé", 403)
  }

  // Admin seulement pour valider/refuser
  if (["valide", "refuse"].includes(statut) &&
      session.user.role !== "admin") {
    return apiError("Non autorisé", 403)
  }

  const existing = await db.query.cra.findFirst({
    where: eq(cra.id, id),
    with: { consultant: true },
  })
  if (!existing) return apiError("CRA introuvable", 404)

  const updateData: Record<string, unknown> = {
    statut, updatedAt: new Date(),
  }
  if (statut === "soumis")  updateData.soumisLe   = new Date()
  if (statut === "valide")  { updateData.valideLe = new Date(); updateData.valideParId = session.user.id }
  if (statut === "refuse")  updateData.motifRefus = motifRefus

  await db.update(cra).set(updateData).where(eq(cra.id, id))

  // Emails transactionnels
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/consultant/cra`
  const consultant = existing.consultant

  if (statut === "valide" && consultant) {
    const joursCount = await db.query.craJours.findMany({
      where: and(
        eq(craJours.craId, id),
        inArray(craJours.type, ["travail", "tele", "demi"])
      ),
    })
    await sendCraValidated({
      to: consultant.email, prenom: consultant.prenom,
      mois: moisLabel(existing.mois),
      jours: joursCount.length, portalUrl,
    }).catch(console.error)
  }

  if (statut === "refuse" && consultant && motifRefus) {
    await sendCraRefus({
      to: consultant.email, prenom: consultant.prenom,
      mois: moisLabel(existing.mois), motif: motifRefus, portalUrl,
    }).catch(console.error)
  }

  return apiOk({ success: true, statut })
}
