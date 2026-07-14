import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { SignOutButton } from "@/components/ui/sign-out-button"
import { db } from "@/db"
import { consultants } from "@/db/schema"
import { eq } from "drizzle-orm"

const NAV = [
  { href:"/consultant/cra",     icon:"🗓️", label:"Mon CRA"      },
  { href:"/consultant/reports", icon:"🕘", label:"Mes rapports" },
]

export default async function ConsultantLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== "consultant") redirect("/auth/login")

  const k = session.user.consultantId
    ? await db.query.consultants.findFirst({
        where: eq(consultants.id, session.user.consultantId),
        with: { partenaire: true, client: true },
      })
    : null

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"#111418", fontFamily:"'Manrope', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width:"256px", flexShrink:0, display:"flex", flexDirection:"column", background:"#111418", borderRight:"1px solid #282f39" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"16px", height:"64px", borderBottom:"1px solid #282f39" }}>
          <div style={{ width:"38px", height:"38px", borderRadius:"8px", background:"rgba(19,109,236,.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>🗂️</div>
          <div>
            <div style={{ color:"#fff", fontWeight:"800", fontSize:"14px", lineHeight:"1.2" }}>ESN Manager</div>
            <div style={{ color:"#637588", fontSize:"11px" }}>Portail Consultant</div>
          </div>
        </div>
        <nav style={{ flex:1, padding:"12px" }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 12px", borderRadius:"8px", textDecoration:"none", color:"#9da8b9", fontSize:"14px", fontWeight:"500", marginBottom:"2px" }}>
              <span style={{ fontSize:"18px" }}>{n.icon}</span>{n.label}
            </Link>
          ))}
        </nav>
        {k && (
          <div style={{ padding:"12px", borderTop:"1px solid #282f39" }}>
            <div style={{ background:"#1f242d", borderRadius:"10px", padding:"12px" }}>
              <div style={{ color:"#9da8b9", fontSize:"10px", fontWeight:"700", textTransform:"uppercase", letterSpacing:".04em", marginBottom:"6px" }}>Ma mission</div>
              <div style={{ color:"#fff", fontWeight:"700", fontSize:"12px", marginBottom:"2px" }}>{k.mission}</div>
              <div style={{ color:"#637588", fontSize:"11px" }}>
                Chez {k.client?.nom}
              </div>
              <div style={{ color:"#637588", fontSize:"11px", marginBottom:"8px" }}>
                Via {k.partenaire?.nom}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:"rgba(19,109,236,.2)", color:"#136dec", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"800", fontSize:"11px" }}>
                  {k.prenom[0]}{k.nom[0]}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:"#fff", fontWeight:"600", fontSize:"11px" }}>{k.prenom} {k.nom}</div>
                  <div style={{ color:"#637588", fontSize:"10px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{k.email}</div>
                </div>
                <SignOutButton />
              </div>
            </div>
          </div>
        )}
      </aside>
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
        <main style={{ flex:1, overflowY:"auto", padding:"24px" }}>{children}</main>
      </div>
    </div>
  )
}
