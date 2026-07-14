import { db } from "@/db"
import { consultants, cra, factures } from "@/db/schema"
import { eq, count, sum, and } from "drizzle-orm"
import { joursOuvres, moisLabel, fmtEur } from "@/lib/utils"
import Link from "next/link"

export default async function DashboardPage() {
  const now   = new Date()
  const mois  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  // ── Données DB en parallèle ──────────────────────────────────
  const [
    allConsultants,
    craEnAttente,
    allFactures,
  ] = await Promise.all([
    db.query.consultants.findMany({
      where: eq(consultants.actif, true),
      with: { partenaire: true, client: true },
    }),
    db.query.cra.findMany({
      where: eq(cra.statut, "soumis"),
      with: { consultant: true },
    }),
    db.query.factures.findMany({
      with: { consultant: true, partenaire: true },
      orderBy: (f, { desc }) => [desc(f.createdAt)],
      limit: 10,
    }),
  ])

  const jo          = joursOuvres(mois)
  const caPrev      = allConsultants.reduce((s, k) => s + Number(k.tjmVente) * jo, 0)
  const margePrev   = allConsultants.reduce((s, k) => s + (Number(k.tjmVente) - Number(k.coutJour)) * jo, 0)
  const facNonPayee = allFactures.filter(f => f.statut !== "payee")
  const facTtl      = facNonPayee.reduce((s, f) => s + Number(f.montantTtc), 0)

  const STATUT_CSS: Record<string, string> = {
    brouillon: "background:rgba(255,255,255,.06);color:#9da8b9",
    soumis:    "background:rgba(249,115,22,.12);color:#f97316",
    valide:    "background:rgba(34,197,94,.12);color:#22c55e",
    refuse:    "background:rgba(239,68,68,.12);color:#ef4444",
    emise:     "background:rgba(255,255,255,.06);color:#9da8b9",
    envoyee:   "background:rgba(19,109,236,.12);color:#136dec",
    payee:     "background:rgba(34,197,94,.12);color:#22c55e",
  }
  const STATUT_L: Record<string, string> = {
    brouillon:"Brouillon",soumis:"En attente",valide:"Validé",refuse:"Refusé",
    emise:"Émise",envoyee:"Envoyée",payee:"Payée",
  }

  return (
    <div style={{ fontFamily:"inherit" }}>
      <div style={{ marginBottom:"24px" }}>
        <h1 style={{ color:"#fff", fontSize:"22px", fontWeight:"800", margin:"0 0 4px" }}>Tableau de bord</h1>
        <p style={{ color:"#637588", fontSize:"13px", margin:0 }}>Vue d'ensemble — {moisLabel(mois)}</p>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"16px", marginBottom:"24px" }}>
        <KpiCard label="Consultants en mission" value={String(allConsultants.length)} icon="👥" sub="Tous clients confondus" trend="+actifs" />
        <KpiCard label={`CA prévisionnel — ${moisLabel(mois)}`} value={fmtEur(caPrev)} icon="💶" sub={`Sur ${jo} jours ouvrés`} trend="+12%" trendOk />
        <KpiCard label="CRA en attente" value={String(craEnAttente.length)} icon="⏳" sub="Bloque la facturation" alert={craEnAttente.length > 0} />
        <KpiCard label="Factures en cours" value={String(facNonPayee.length)} icon="🧾" sub={facNonPayee.length ? `Valeur ${fmtEur(facTtl)}` : "Tout réglé"} />
      </div>

      {/* ── Marge par mission ──────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:"20px", marginBottom:"20px" }}>
        <Card title="Missions en cours" action={{ label:"Gérer", href:"/admin/consultants" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>{["Consultant","Mission","Partenaire","TJM","Marge/j","CRA"].map(h=>(
                <th key={h} style={{ textAlign:"left", padding:"8px 10px", fontSize:"10px", fontWeight:"700", color:"#637588", textTransform:"uppercase", letterSpacing:".05em", borderBottom:"1px solid #282f39" }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {allConsultants.map(k => {
                const mj = Number(k.tjmVente) - Number(k.coutJour)
                const r  = null // On pourrait charger le CRA ici
                return (
                  <tr key={k.id}>
                    <td style={{ padding:"11px 10px", borderBottom:"1px solid #282f39" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                        <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:"rgba(19,109,236,.15)", color:"#136dec", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"800", fontSize:"10px", flexShrink:0 }}>
                          {k.prenom[0]}{k.nom[0]}
                        </div>
                        <div>
                          <div style={{ color:"#fff", fontWeight:"600", fontSize:"12px" }}>{k.prenom} {k.nom}</div>
                          <div style={{ color:"#637588", fontSize:"10px" }}>{k.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:"11px 10px", borderBottom:"1px solid #282f39", color:"#9da8b9", fontSize:"12px", maxWidth:"160px" }}>
                      <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{k.mission}</div>
                    </td>
                    <td style={{ padding:"11px 10px", borderBottom:"1px solid #282f39", color:"#9da8b9", fontSize:"12px" }}>{k.partenaire.nom}</td>
                    <td style={{ padding:"11px 10px", borderBottom:"1px solid #282f39", color:"#fff", fontWeight:"700", fontSize:"12px" }}>{fmtEur(Number(k.tjmVente))}</td>
                    <td style={{ padding:"11px 10px", borderBottom:"1px solid #282f39", color: mj >= 0 ? "#22c55e" : "#ef4444", fontWeight:"700", fontSize:"12px" }}>{fmtEur(mj)}</td>
                    <td style={{ padding:"11px 10px", borderBottom:"1px solid #282f39" }}>
                      <span style={{ padding:"3px 8px", borderRadius:"999px", fontSize:"10px", fontWeight:"700", ...Object.fromEntries(("background:rgba(255,255,255,.06);color:#9da8b9").split(";").map(p=>p.split(":").map(x=>x.trim()))) }}>
                        —
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        <Card title="Marge nette / mission">
          <div style={{ padding:"0 4px" }}>
            {allConsultants.map(k => {
              const mj = Number(k.tjmVente) - Number(k.coutJour)
              return (
                <div key={k.id} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 0", borderBottom:"1px solid #282f39" }}>
                  <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:"rgba(19,109,236,.15)", color:"#136dec", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"800", fontSize:"11px", flexShrink:0 }}>
                    {k.prenom[0]}{k.nom[0]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:"#fff", fontWeight:"700", fontSize:"12px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{k.prenom} {k.nom}</div>
                    <div style={{ color:"#637588", fontSize:"10px" }}>{k.partenaire.nom}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ color: mj >= 0 ? "#22c55e" : "#ef4444", fontWeight:"800", fontSize:"13px" }}>{fmtEur(mj)}/j</div>
                    <div style={{ color:"#637588", fontSize:"10px" }}>{fmtEur(mj * jo)}</div>
                  </div>
                </div>
              )
            })}
            <p style={{ fontSize:"10px", color:"#637588", marginTop:"8px", textAlign:"center" }}>* {jo} jours ouvrés</p>
          </div>
        </Card>
      </div>

      {/* ── CRA en attente ─────────────────────────────────── */}
      {craEnAttente.length > 0 && (
        <Card title={`CRA en attente de validation (${craEnAttente.length})`} action={{ label:"Tout voir", href:"/admin/validation" }}>
          {craEnAttente.map(r => (
            <div key={r.id} style={{ display:"flex", alignItems:"center", gap:"14px", padding:"12px 0", borderBottom:"1px solid #282f39" }}>
              <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:"rgba(19,109,236,.15)", color:"#136dec", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"800", fontSize:"13px", flexShrink:0 }}>
                {r.consultant?.prenom?.[0]}{r.consultant?.nom?.[0]}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ color:"#fff", fontWeight:"700", fontSize:"13px" }}>{r.consultant?.prenom} {r.consultant?.nom}</div>
                <div style={{ color:"#637588", fontSize:"11px" }}>{moisLabel(r.mois)} · soumis le {r.soumisLe?.toLocaleDateString("fr-FR") ?? "—"}</div>
              </div>
              <span style={{ padding:"3px 10px", borderRadius:"999px", fontSize:"11px", fontWeight:"700", background:"rgba(249,115,22,.12)", color:"#f97316" }}>En attente</span>
              <Link href="/admin/validation" style={{ padding:"6px 14px", borderRadius:"8px", background:"#136dec", color:"#fff", textDecoration:"none", fontSize:"12px", fontWeight:"700" }}>Valider</Link>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

function KpiCard({ label, value, icon, sub, trend, trendOk, alert }: {
  label: string; value: string; icon: string; sub?: string; trend?: string; trendOk?: boolean; alert?: boolean
}) {
  return (
    <div style={{
      background:"#1f242d", border:`1px solid ${alert ? "#f97316" : "#282f39"}`,
      borderLeft: alert ? "4px solid #f97316" : "1px solid #282f39",
      borderRadius:"12px", padding:"20px",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
        <span style={{ color:"#9da8b9", fontSize:"12px", fontWeight:"500" }}>{label}</span>
        <div style={{ width:"34px", height:"34px", borderRadius:"8px", background: alert ? "rgba(249,115,22,.12)" : "rgba(19,109,236,.12)", color: alert ? "#f97316" : "#136dec", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>{icon}</div>
      </div>
      <div style={{ display:"flex", alignItems:"baseline", gap:"8px", marginBottom:"4px" }}>
        <span style={{ color:"#fff", fontSize:"26px", fontWeight:"800", lineHeight:1 }}>{value}</span>
        {trend && <span style={{ fontSize:"11px", fontWeight:"600", padding:"2px 6px", borderRadius:"4px", background: trendOk ? "rgba(34,197,94,.12)" : "rgba(249,115,22,.12)", color: trendOk ? "#22c55e" : "#f97316" }}>{trend}</span>}
      </div>
      {sub && <p style={{ color:"#637588", fontSize:"11px", margin:0 }}>{sub}</p>}
    </div>
  )
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: { label: string; href: string } }) {
  return (
    <div style={{ background:"#1f242d", border:"1px solid #282f39", borderRadius:"12px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid #282f39" }}>
        <span style={{ color:"#fff", fontWeight:"700", fontSize:"14px" }}>{title}</span>
        {action && <Link href={action.href} style={{ color:"#136dec", fontSize:"12px", fontWeight:"700", textDecoration:"none" }}>{action.label} →</Link>}
      </div>
      <div style={{ padding:"0 20px 8px" }}>{children}</div>
    </div>
  )
}
