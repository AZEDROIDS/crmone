import { db } from "@/db"
import { consultants } from "@/db/schema"
import { eq } from "drizzle-orm"
import { fmtEur, fmtDate } from "@/lib/utils"
import Link from "next/link"

export default async function ConsultantsPage() {
  const list = await db.query.consultants.findMany({
    where: eq(consultants.actif, true),
    with: { partenaire: true, client: true },
    orderBy: (c, { asc }) => [asc(c.nom)],
  })

  return (
    <div style={{ fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: "800", margin: "0 0 4px" }}>Consultants & Missions</h1>
          <p style={{ color: "#637588", fontSize: "13px", margin: 0 }}>{list.length} consultant(s) en mission</p>
        </div>
        <Link href="/admin/consultants/new" style={{ padding: "10px 18px", borderRadius: "8px", background: "#136dec", color: "#fff", textDecoration: "none", fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
          + Nouveau consultant
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {list.map(k => {
          const mj = Number(k.tjmVente) - Number(k.coutJour)
          return (
            <div key={k.id} style={{ background: "#1f242d", border: "1px solid #282f39", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "rgba(19,109,236,.15)", color: "#136dec", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "16px", flexShrink: 0 }}>
                  {k.prenom[0]}{k.nom[0]}
                </div>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <div style={{ color: "#fff", fontWeight: "800", fontSize: "15px" }}>{k.prenom} {k.nom}</div>
                  <div style={{ color: "#637588", fontSize: "12px", marginTop: "2px" }}>{k.mission}</div>
                  <div style={{ color: "#637588", fontSize: "11px", marginTop: "2px" }}>{k.email}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "180px" }}>
                  <div style={{ fontSize: "12px" }}>
                    <span style={{ color: "#637588" }}>Via ESN </span>
                    <span style={{ color: "#fff", fontWeight: "600" }}>{k.partenaire.nom}</span>
                  </div>
                  <div style={{ fontSize: "12px" }}>
                    <span style={{ color: "#637588" }}>Chez </span>
                    <span style={{ color: "#fff", fontWeight: "600" }}>{k.client.nom}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#637588" }}>{fmtDate(k.debut)} → {fmtDate(k.fin)}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "130px" }}>
                  <div style={{ fontSize: "12px" }}>
                    <span style={{ color: "#637588" }}>TJM vente </span>
                    <span style={{ color: "#fff", fontWeight: "700" }}>{fmtEur(Number(k.tjmVente))}</span>
                  </div>
                  <div style={{ fontSize: "12px" }}>
                    <span style={{ color: "#637588" }}>Marge/j </span>
                    <span style={{ color: mj >= 0 ? "#22c55e" : "#ef4444", fontWeight: "700" }}>{fmtEur(mj)}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#637588" }}>TT max : {k.teleMax} j/mois</div>
                </div>
              </div>
            </div>
          )
        })}

        {list.length === 0 && (
          <div style={{ background: "#1f242d", border: "1px solid #282f39", borderRadius: "12px", padding: "48px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>👥</div>
            <p style={{ color: "#fff", fontWeight: "700", marginBottom: "8px" }}>Aucun consultant</p>
            <p style={{ color: "#637588", fontSize: "13px", marginBottom: "16px" }}>Commencez par ajouter votre premier consultant.</p>
            <Link href="/admin/consultants/new" style={{ padding: "10px 20px", borderRadius: "8px", background: "#136dec", color: "#fff", textDecoration: "none", fontSize: "13px", fontWeight: "700", display: "inline-block" }}>
              + Ajouter un consultant
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
