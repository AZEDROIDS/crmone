import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { cra } from "@/db/schema"
import { eq } from "drizzle-orm"
import { moisLabel, fmtDate, joursOuvres } from "@/lib/utils"
import Link from "next/link"

export default async function ReportsPage() {
  const session = await auth()
  if (!session?.user.consultantId) redirect("/auth/login")
  const list = await db.query.cra.findMany({
    where: eq(cra.consultantId, session.user.consultantId),
    with: { jours: true, justificatifs: true },
    orderBy: (c, { desc }) => [desc(c.mois)],
  })
  const STATUT: Record<string,[string,string]> = {
    brouillon:["Brouillon","rgba(255,255,255,.06);color:#9da8b9"],
    soumis:["En attente","rgba(249,115,22,.12);color:#f97316"],
    valide:["Validé","rgba(34,197,94,.12);color:#22c55e"],
    refuse:["Refusé","rgba(239,68,68,.12);color:#ef4444"],
  }
  if (!list.length) return (
    <div style={{ background:"#1f242d", border:"1px solid #282f39", borderRadius:"12px", padding:"48px", textAlign:"center" }}>
      <div style={{ fontSize:"48px", marginBottom:"12px" }}>🗓️</div>
      <p style={{ color:"#fff", fontWeight:"700", marginBottom:"8px" }}>Aucun rapport pour le moment</p>
      <Link href="/consultant/cra" style={{ padding:"10px 20px", borderRadius:"8px", background:"#136dec", color:"#fff", textDecoration:"none", fontSize:"13px", fontWeight:"700", display:"inline-block" }}>Saisir mon CRA →</Link>
    </div>
  )
  return (
    <div style={{ fontFamily:"inherit" }}>
      <h1 style={{ color:"#fff", fontSize:"20px", fontWeight:"800", margin:"0 0 20px" }}>Mes rapports d'activité</h1>
      <div style={{ background:"#1f242d", border:"1px solid #282f39", borderRadius:"12px", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["Période","Jours","Télétravail","Absences","Justificatifs","Statut",""].map(h=>(
            <th key={h} style={{ textAlign:"left", padding:"10px 14px", fontSize:"10px", fontWeight:"700", color:"#637588", textTransform:"uppercase", borderBottom:"1px solid #282f39" }}>{h}</th>
          ))}</tr></thead>
          <tbody>{list.map(r => {
            let j=0,t=0,a=0
            for(const x of r.jours){if(x.type==="travail")j++;else if(x.type==="tele"){j++;t++}else if(x.type==="demi")j+=.5;else a++}
            const [label,s]=STATUT[r.statut]??STATUT.brouillon
            return (
              <tr key={r.id} style={{ borderBottom:"1px solid #282f39" }}>
                <td style={{ padding:"12px 14px", color:"#fff", fontWeight:"700", textTransform:"capitalize" }}>{moisLabel(r.mois)}</td>
                <td style={{ padding:"12px 14px" }}><b style={{ color:"#fff" }}>{j}</b><span style={{ color:"#637588", fontSize:"11px" }}> / {joursOuvres(r.mois)}</span></td>
                <td style={{ padding:"12px 14px", color:"#6366f1", fontWeight:"600" }}>{t} j</td>
                <td style={{ padding:"12px 14px", color:"#f97316" }}>{a} j</td>
                <td style={{ padding:"12px 14px", color:"#637588", fontSize:"12px" }}>{r.justificatifs?.length ?? 0} fichier(s)</td>
                <td style={{ padding:"12px 14px" }}><span style={{ padding:"3px 8px", borderRadius:"999px", fontSize:"10px", fontWeight:"700",...Object.fromEntries(s.split(";").map(p=>p.trim().split(":").map(x=>x.trim()))) }}>{label}</span></td>
                <td style={{ padding:"12px 14px" }}>{r.statut!=="valide"&&<Link href={`/consultant/cra?mois=${r.mois}`} style={{ color:"#136dec", fontSize:"12px", fontWeight:"700", textDecoration:"none" }}>Ouvrir →</Link>}</td>
              </tr>
            )
          })}</tbody>
        </table>
      </div>
    </div>
  )
}
