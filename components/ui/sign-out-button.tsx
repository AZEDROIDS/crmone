"use client"
import { signOut } from "next-auth/react"

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/auth/login" })}
      title="Déconnexion"
      style={{
        marginLeft:"auto", background:"none", border:"none",
        color:"#637588", cursor:"pointer", fontSize:"16px",
        display:"flex", padding:"4px", borderRadius:"4px",
        transition:"color .15s",
      }}
      onMouseOver={e => (e.currentTarget.style.color = "#ef4444")}
      onMouseOut={e =>  (e.currentTarget.style.color = "#637588")}
    >
      ⏻
    </button>
  )
}
