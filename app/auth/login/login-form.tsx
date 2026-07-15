"use client"

import { useState, useTransition } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"

export default function LoginForm() {
  const [error, setError]  = useState<string | null>(null)
  const [isPending, start] = useTransition()
  const sp                 = useSearchParams()
  const appRouter          = useRouter()
  const callbackUrl        = sp.get("callbackUrl") ?? "/"

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const res = await signIn("credentials", {
        email:    fd.get("email"),
        password: fd.get("password"),
        redirect: false,
      })
      if (res?.error) setError("Email ou mot de passe incorrect")
      else { appRouter.push(callbackUrl); appRouter.refresh() }
    })
  }

  const inp: React.CSSProperties = {
    width:"100%", background:"#252a33", border:"1px solid #3e4856",
    borderRadius:"8px", padding:"10px 14px", color:"#fff",
    fontSize:"14px", fontFamily:"inherit", outline:"none", boxSizing:"border-box",
  }
  const lbl: React.CSSProperties = {
    display:"block", fontSize:"11px", fontWeight:"700", color:"#9da8b9",
    marginBottom:"6px", textTransform:"uppercase", letterSpacing:".04em",
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", background:"#111418", fontFamily:"inherit" }}>
      <div style={{ width:"100%", maxWidth:"440px", background:"#1f242d", border:"1px solid #282f39", borderRadius:"16px", overflow:"hidden", boxShadow:"0 24px 64px rgba(0,0,0,.5)" }}>
        {/* Hero */}
        <div style={{ height:"140px", background:"linear-gradient(135deg,#0a2a6e,#136dec,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ width:"52px", height:"52px", borderRadius:"14px", background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px", fontSize:"26px" }}>🗂️</div>
            <div style={{ color:"#fff", fontWeight:"800", fontSize:"20px" }}>ESN Manager</div>
            <div style={{ color:"rgba(255,255,255,.6)", fontSize:"12px" }}>Gestion sous-traitance & CRA</div>
          </div>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding:"32px" }}>
          <h2 style={{ color:"#fff", fontWeight:"800", fontSize:"18px", margin:"0 0 24px" }}>Connexion</h2>
          {error && (
            <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:"8px", padding:"10px 14px", color:"#ef4444", fontSize:"13px", marginBottom:"16px" }}>
              {error}
            </div>
          )}
          <div style={{ marginBottom:"16px" }}>
            <label style={lbl}>Email</label>
            <input name="email" type="email" required autoComplete="email" placeholder="admin@mon-esn.fr" style={inp} />
          </div>
          <div style={{ marginBottom:"24px" }}>
            <label style={lbl}>Mot de passe</label>
            <input name="password" type="password" required autoComplete="current-password" style={inp} />
          </div>
          <button type="submit" disabled={isPending}
            style={{ width:"100%", background:"#136dec", color:"#fff", border:"none", borderRadius:"8px", padding:"12px", fontSize:"14px", fontWeight:"700", cursor:"pointer", opacity: isPending ? .6 : 1, fontFamily:"inherit" }}>
            {isPending ? "Connexion…" : "Se connecter"}
          </button>
          <p style={{ color:"#637588", fontSize:"11px", textAlign:"center", marginTop:"16px" }}>
            Besoin d'un compte ? Contactez votre administrateur.
          </p>
        </form>
      </div>
    </div>
  )
}
