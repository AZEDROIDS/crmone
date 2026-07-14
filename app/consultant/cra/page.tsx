export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { consultants, cra, craJours } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { moisLabel, joursOuvres } from "@/lib/utils"
import { CraCalendar } from "@/components/consultant/cra-calendar"

interface Props { searchParams: { mois?: string } }

export default async function CraPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user.consultantId) redirect("/auth/login")

  const now  = new Date()
  const mois = searchParams.mois
    ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const k = await db.query.consultants.findFirst({
    where: eq(consultants.id, session.user.consultantId),
    with: { partenaire: true, client: true },
  })
  if (!k) redirect("/auth/login")

  const existing = await db.query.cra.findFirst({
    where: and(eq(cra.consultantId, k.id), eq(cra.mois, mois)),
    with: { jours: true, justificatifs: true },
  })

  const jo = joursOuvres(mois)

  return (
    <div style={{ fontFamily:"inherit" }}>
      <div style={{ marginBottom:"20px" }}>
        <h1 style={{ color:"#fff", fontSize:"20px", fontWeight:"800", margin:"0 0 4px" }}>
          Compte Rendu d'Activité
        </h1>
        <p style={{ color:"#637588", fontSize:"13px", margin:0 }}>
          {k.mission} · {k.client?.nom} · Via {k.partenaire?.nom}
        </p>
      </div>

      <CraCalendar
        consultantId={k.id}
        mois={mois}
        teleMax={k.teleMax}
        joursOuvres={jo}
        initialJours={existing?.jours ?? []}
        initialStatut={existing?.statut ?? "brouillon"}
        initialJustifs={existing?.justificatifs ?? []}
        motifRefus={existing?.motifRefus ?? undefined}
      />
    </div>
  )
}
