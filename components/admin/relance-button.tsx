"use client"
import { useTransition, useState } from "react"

export function RelanceButton({ consultantIds, mois, label }: { consultantIds: string[]; mois: string; label: string }) {
  const [pending, start] = useTransition()
  const [done, setDone]  = useState(false)

  async function send() {
    start(async () => {
      const res = await fetch("/api/email/relance", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ consultantIds, mois }),
      })
      if (res.ok) setDone(true)
    })
  }

  return (
    <button onClick={send} disabled={pending || done}
      style={{ padding:"5px 12px", borderRadius:"8px", background: done ? "rgba(34,197,94,.12)" : "rgba(249,115,22,.12)", color: done ? "#22c55e" : "#f97316", border:"none", fontWeight:"700", fontSize:"11px", cursor: done ? "default" : "pointer", fontFamily:"inherit", opacity: pending ? .6 : 1 }}>
      {done ? "✓ Envoyé" : pending ? "Envoi…" : `📨 ${label}`}
    </button>
  )
}
