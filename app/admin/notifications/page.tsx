import { db } from "@/db"
import { consultants, cra } from "@/db/schema"
import { eq } from "drizzle-orm"
import { moisLabel } from "@/lib/utils"
import { RelanceButton } from "@/components/admin/relance-button"

export default async function NotificationsPage() {
  const now  = new Date()
  const mois = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`
  const all  = await db.query.consultants.findMany({ where: eq(consultants.actif, true) })
  const cras = await db.query.cra.findMany({ where: eq(cra.mois, mois) })
  
  const sansRelance = all.filter(k => {
    const r = cras.find(c => c.consultantId === k.id)
    return !r || r.statut === "brouillon"
  })
  const enAttente = cras.filter(r => r.statut === "soumis").length
  
  return (
    <div style={{ maxWidth:"680px", fontFamily:"inherit" }}>
      <h1 style={{ color:"#fff", fontSize:"20px", fontWeight:"800", margin:"0 0 20px" }}>Notifications</h1>
      
      {/* CRA non soumis */}
      <div style={{ background:"#1f242d", border:"1px solid #282f39", borderRadius:"12px", marginBottom:"16px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:"1px solid #282f39" }}>
          <span style={{ color:"#fff", fontWeight:"700" }}>CRA non soumis — {moisLabel(mois)}</span>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ padding:"2px 8px", borderRadius:"999px", fontSize:"10px", fontWeight:"700", background:"rgba(249,115,22,.12)", color:"#f97316" }}>{sansRelance.length}</span>
            {sansRelance.length > 0 && <RelanceButton consultantIds={sansRelance.map(k=>k.id)} mois={mois} label="Relancer tous" />}
          </div>
        </div>
        {sansRelance.length === 0
          ? <div style={{ padding:"24px", textAlign:"center", color:"#637588", fontSize:"13px" }}>✅ Tous les CRA ont été soumis ce mois</div>
          : sansRelance.map(k => (
              <div key={k.id} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 18px", borderBottom:"1px solid #282f39" }}>
                <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:"rgba(19,109,236,.15)", color:"#136dec", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"800", fontSize:"13px" }}>
                  {k.prenom[0]}{k.nom[0]}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ color:"#fff", fontWeight:"700", fontSize:"13px" }}>{k.prenom} {k.nom}</div>
                  <div style={{ color:"#637588", fontSize:"11px" }}>{k.email}</div>
                </div>
                <RelanceButton consultantIds={[k.id]} mois={mois} label="Relancer" />
              </div>
            ))
        }
      </div>
      
      {/* CRA en attente de validation */}
      {enAttente > 0 && (
        <div style={{ padding:"14px 18px", borderRadius:"12px", background:"rgba(19,109,236,.08)", border:"1px solid rgba(19,109,236,.2)", color:"#136dec", fontSize:"13px", display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"20px" }}>✅</span>
          <span><b>{enAttente} CRA</b> en attente de validation.</span>
          <a href="/admin/validation" style={{ marginLeft:"auto", color:"#136dec", fontWeight:"700", textDecoration:"none", fontSize:"12px" }}>Valider →</a>
        </div>
      )}
    </div>
  )
}
