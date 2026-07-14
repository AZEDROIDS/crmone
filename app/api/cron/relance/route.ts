import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { consultants, cra } from "@/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { sendCraRelance } from "@/lib/email"
import { moisLabel } from "@/lib/utils"

/**
 * CRON Route — appelée automatiquement par Vercel Cron
 * Configurée dans vercel.json :
 *   - Le 25 de chaque mois à 9h00 → relances CRA non soumis
 *   - Le 1er de chaque mois à 8h00 → rapport récapitulatif admin
 *
 * Sécurisée par CRON_SECRET (header Authorization)
 */
export async function GET(req: NextRequest) {
  // ── Vérification sécurité ────────────────────────────────────
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now  = new Date()
  const mois = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const day  = now.getDate()

  // ── Cas 1 : Relance CRA (appelée le 25) ─────────────────────
  if (day >= 20) {
    const allConsultants = await db.query.consultants.findMany({
      where: eq(consultants.actif, true),
    })

    const relances: string[] = []
    const errors:   string[] = []

    for (const k of allConsultants) {
      // Vérifier si le CRA du mois est soumis/validé
      const existing = await db.query.cra.findFirst({
        where: and(eq(cra.consultantId, k.id), eq(cra.mois, mois)),
      })

      if (!existing || existing.statut === "brouillon") {
        try {
          await sendCraRelance({
            to:        k.email,
            prenom:    k.prenom,
            mois:      moisLabel(mois),
            portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/consultant/cra`,
          })
          relances.push(k.email)
        } catch (e) {
          errors.push(k.email)
          console.error(`Relance failed for ${k.email}:`, e)
        }
      }
    }

    console.log(`[CRON] Relances envoyées: ${relances.length} | Erreurs: ${errors.length}`)
    return NextResponse.json({
      type:     "relance",
      mois,
      sent:     relances.length,
      errors:   errors.length,
      details:  relances,
    })
  }

  // ── Cas 2 : Rapport récapitulatif mensuel (appelé le 1er) ────
  if (day === 1) {
    const prevMo = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMois = `${prevMo.getFullYear()}-${String(prevMo.getMonth() + 1).padStart(2, "0")}`

    const craValides = await db.query.cra.findMany({
      where: and(eq(cra.mois, prevMois), eq(cra.statut, "valide")),
      with: { consultant: true },
    })

    console.log(`[CRON] Rapport mensuel ${moisLabel(prevMois)}: ${craValides.length} CRA validés`)
    // TODO: envoyer email récap à l'admin
    return NextResponse.json({
      type:      "recap",
      mois:      prevMois,
      validated: craValides.length,
    })
  }

  return NextResponse.json({ type: "noop", day })
}
