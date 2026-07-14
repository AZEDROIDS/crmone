export const dynamic = "force-dynamic"
import { db } from "@/db"
import { factures } from "@/db/schema"
import { moisLabel, fmtEur, fmtDate } from "@/lib/utils"
import { FactureActions } from "@/components/admin/facture-actions"

export default async function FacturesPage() {
  const rows = await db.query.factures.findMany({
    with: { consultant: true, partenaire: true },
    orderBy: (f, { desc }) => [desc(f.createdAt)],
  })

  const emises   = rows.filter(f => f.statut === "emise")
  const envoyees = rows.filter(f => f.statut === "envoyee")
  const payees   = rows.filter(f => f.statut === "payee")
  const sumTtl   = (list: typeof rows) => list.reduce((s, f) => s + Number(f.montantTtc), 0)

  if (!rows.length) return (
    <div style={{ background:"#1f242d", border:"1px solid #282f39", borderRadius:"12px", padding:"48px", textAlign:"center" }}>
      <div style={{ fontSize:"48px", marginBottom:"12px" }}>🧾</div>
      <p style={{ color:"#fff", fontWeight:"700", marginBottom:"8px" }}>Aucune facture générée</p>
      <p style={{ color:"#637588", fontSize:"13px" }}>Validez un CRA depuis l'onglet Validation, puis générez la facture.</p>
    </div>
  )

  return (
    <div style={{ fontFamily:"inherit" }}>
      {/* KPI */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px", marginBottom:"24px" }}>
        {[
          { label:"Émises",   val: fmtEur(sumTtl(emises)),   n: emises.length,   icon:"📝", color:"#9da8b9" },
          { label:"Envoyées", val: fmtEur(sumTtl(envoyees)), n: envoyees.length, icon:"📨", color:"#136dec" },
          { label:"Payées",   val: fmtEur(sumTtl(payees)),   n: payees.length,   icon:"✅", color:"#22c55e" },
        ].map(k => (
          <div key={k.label} style={{ background:"#1f242d", border:"1px solid #282f39", borderRadius:"12px", padding:"18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
              <span style={{ color:"#9da8b9", fontSize:"12px" }}>{k.label}</span>
              <span style={{ fontSize:"20px" }}>{k.icon}</span>
            </div>
            <div style={{ color: k.color, fontSize:"24px", fontWeight:"800", marginBottom:"3px" }}>{k.val}</div>
            <p style={{ color:"#637588", fontSize:"11px", margin:0 }}>{k.n} facture(s)</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:"#1f242d", border:"1px solid #282f39", borderRadius:"12px", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr>
              {["N° Facture","Consultant","Partenaire","Période","Jours","Montant TTC","Statut","Actions"].map(h => (
                <th key={h} style={{ textAlign:"left", padding:"12px 14px", fontSize:"10px", fontWeight:"700", color:"#637588", textTransform:"uppercase", letterSpacing:".05em", borderBottom:"1px solid #282f39" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(f => {
              const k = f.consultant
              const s: Record<string,[string,string]> = {
                emise:    ["Émise",   "rgba(255,255,255,.06);color:#9da8b9"],
                envoyee:  ["Envoyée", "rgba(19,109,236,.12);color:#136dec"],
                payee:    ["Payée",   "rgba(34,197,94,.12);color:#22c55e"],
              }
              const [label, style] = s[f.statut] ?? s.emise
              return (
                <tr key={f.id} style={{ borderBottom:"1px solid #282f39" }}>
                  <td style={{ padding:"12px 14px", color:"#fff", fontWeight:"700", fontSize:"13px" }}>{f.numero}</td>
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ color:"#fff", fontWeight:"600", fontSize:"13px" }}>{k.prenom} {k.nom}</div>
                  </td>
                  <td style={{ padding:"12px 14px", color:"#9da8b9", fontSize:"13px" }}>{f.partenaire.nom}</td>
                  <td style={{ padding:"12px 14px", color:"#9da8b9", fontSize:"13px", textTransform:"capitalize" }}>{moisLabel(f.mois)}</td>
                  <td style={{ padding:"12px 14px", color:"#9da8b9", fontSize:"13px" }}>{f.jours} j</td>
                  <td style={{ padding:"12px 14px", color:"#fff", fontWeight:"700", fontSize:"13px" }}>{fmtEur(Number(f.montantTtc))}</td>
                  <td style={{ padding:"12px 14px" }}>
                    <span style={{ padding:"3px 8px", borderRadius:"999px", fontSize:"10px", fontWeight:"700",
                      ...Object.fromEntries(style.split(";").map(p=>p.trim().split(":").map(x=>x.trim()))) }}>
                      {label}
                    </span>
                  </td>
                  <td style={{ padding:"12px 14px" }}>
                    <FactureActions facture={f} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
