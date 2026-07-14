export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { SignOutButton } from "@/components/ui/sign-out-button"

const NAV = [
  { href:"/admin/dashboard",      icon:"📊", label:"Tableau de bord"      },
  { href:"/admin/consultants",    icon:"👥", label:"Consultants"           },
  { href:"/admin/annuaire",       icon:"🏢", label:"Partenaires & Clients" },
  { href:"/admin/validation",     icon:"✅", label:"Validation CRA"        },
  { href:"/admin/factures",       icon:"🧾", label:"Factures"              },
  { href:"/admin/notifications",  icon:"🔔", label:"Notifications"         },
  { href:"/admin/settings",       icon:"⚙️",  label:"Paramètres"            },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/auth/login")

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"#111418", fontFamily:"'Manrope', system-ui, sans-serif", colorScheme:"dark" }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside style={{
        width:"256px", flexShrink:0, display:"flex", flexDirection:"column",
        background:"#111418", borderRight:"1px solid #282f39",
      }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"16px", height:"64px", borderBottom:"1px solid #282f39" }}>
          <div style={{ width:"38px", height:"38px", borderRadius:"8px", background:"rgba(19,109,236,.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>🗂️</div>
          <div>
            <div style={{ color:"#fff", fontWeight:"800", fontSize:"14px", lineHeight:"1.2" }}>ESN Manager</div>
            <div style={{ color:"#637588", fontSize:"11px" }}>Admin Portal</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"12px", overflowY:"auto" }}>
          {NAV.map(n => (
            <NavItem key={n.href} href={n.href} icon={n.icon} label={n.label} />
          ))}
        </nav>

        {/* User */}
        <div style={{ padding:"12px", borderTop:"1px solid #282f39" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", borderRadius:"10px", background:"#1f242d" }}>
            <div style={{ width:"34px", height:"34px", borderRadius:"50%", background:"rgba(19,109,236,.2)", color:"#136dec", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"800", fontSize:"12px", flexShrink:0 }}>
              {session.user.email?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:"#fff", fontWeight:"600", fontSize:"12px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {session.user.email}
              </div>
              <div style={{ color:"#637588", fontSize:"10px" }}>Super Admin</div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
        <main style={{ flex:1, overflowY:"auto", padding:"24px" }}>
          {children}
        </main>
      </div>
    </div>
  )
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} style={{
      display:"flex", alignItems:"center", gap:"12px",
      padding:"10px 12px", borderRadius:"8px", textDecoration:"none",
      color:"#9da8b9", fontSize:"14px", fontWeight:"500",
      transition:"background .15s, color .15s",
      marginBottom:"2px",
    }}
    onMouseOver={e => { (e.currentTarget as HTMLElement).style.background="#1f242d"; (e.currentTarget as HTMLElement).style.color="#fff" }}
    onMouseOut={e =>  { (e.currentTarget as HTMLElement).style.background="transparent"; (e.currentTarget as HTMLElement).style.color="#9da8b9" }}
    >
      <span style={{ fontSize:"18px", lineHeight:1 }}>{icon}</span>
      {label}
    </Link>
  )
}
