export const dynamic = "force-dynamic"
import { db } from "@/db"
import { cra } from "@/db/schema"
import { eq } from "drizzle-orm"
import { moisLabel } from "@/lib/utils"
import { CraDetailPanel } from "@/components/admin/cra-detail-panel"

export default async function ValidationPage() {
  const soumis = await db.query.cra.findMany({
    where: eq(cra.statut, "soumis"),
    with: { consultant: { with: { partenaire: true, client: true } }, jours: true, justificatifs: true },
    orderBy: (c, { asc }) => [asc(c.soumisLe)],
  })
  const historique = await db.query.cra.findMany({
    where: (c, { inArray }) => inArray(c.statut, ["valide", "refuse"]),
    with: { consultant: true, jours: true },
    orderBy: (c, { desc }) => [desc(c.updatedAt)],
    limit: 20,
  })

  const all = [...soumis, ...historique]

  return (
    <div style={{ display:"flex", margin:"-24px", height:"calc(100vh - 64px)", overflow:"hidden" }}>
      {/* ── File de validation ─────────────────────────────── */}
      <aside style={{ width:"300px", flexShrink:0, borderRight:"1px solid #282f39", display:"flex", flexDirection:"column", overflow:"hidden", background:"#111418" }}>
        <div style={{ padding:"14px 16px", borderBottom:"1px solid #282f39", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:"11px", fontWeight:"700", color:"#637588", textTransform:"uppercase", letterSpacing:".05em" }}>File de validation</span>
            <span style={{ padding:"2px 8px", borderRadius:"999px", fontSize:"10px", fontWeight:"700", background:"rgba(249,115,22,.12)", color:"#f97316" }}>
              {soumis.length} en attente
            </span>
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto" }}>
          {soumis.length === 0 && (
            <div style={{ padding:"32px 16px", textAlign:"center", color:"#637588", fontSize:"13px" }}>
              ✅ Aucun CRA en attente
            </div>
          )}
          {soumis.map(r => (
            <QueueItem key={r.id} r={r} statut="soumis" />
          ))}
          {historique.length > 0 && (
            <>
              <div style={{ padding:"10px 16px 4px", fontSize:"10px", fontWeight:"700", color:"#637588", textTransform:"uppercase", letterSpacing:".05em", borderTop:"1px solid #282f39" }}>
                Historique
              </div>
              {historique.map(r => (
                <QueueItem key={r.id} r={r} statut={r.statut} />
              ))}
            </>
          )}
        </div>
      </aside>

      {/* ── Panneau détail ─────────────────────────────────── */}
      <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>
        <CraDetailPanel cras={all} />
      </div>
    </div>
  )
}

function QueueItem({ r, statut }: { r: any; statut: string }) {
  const css: Record<string,string> = {
    soumis:"background:rgba(249,115,22,.12);color:#f97316",
    valide:"background:rgba(34,197,94,.12);color:#22c55e",
    refuse:"background:rgba(239,68,68,.12);color:#ef4444",
  }
  const k = r.consultant
  return (
    <a href={`?selected=${r.id}`} style={{
      display:"flex", alignItems:"center", gap:"12px",
      padding:"12px 16px", borderBottom:"1px solid #282f39",
      textDecoration:"none", color:"inherit", cursor:"pointer",
      transition:"background .12s",
    }}
    onMouseOver={e=>(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,.03)"}
    onMouseOut={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
    >
      <div style={{ width:"38px", height:"38px", borderRadius:"50%", background:"rgba(19,109,236,.15)", color:"#136dec", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"800", fontSize:"13px", flexShrink:0 }}>
        {k?.prenom?.[0]}{k?.nom?.[0]}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ color:"#fff", fontWeight:"700", fontSize:"13px" }}>{k?.prenom} {k?.nom}</div>
        <div style={{ color:"#637588", fontSize:"11px", marginTop:"2px" }}>{moisLabel(r.mois)}</div>
      </div>
      <span style={{ padding:"2px 7px", borderRadius:"999px", fontSize:"10px", fontWeight:"700", flexShrink:0, ...(Object.fromEntries((css[statut]||css.soumis).split(";").map((p:string)=>p.trim().split(":").map((x:string)=>x.trim())))) }}>
        {statut === "soumis" ? "En attente" : statut === "valide" ? "Validé" : "Refusé"}
      </span>
    </a>
  )
}
