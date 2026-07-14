"use client"

import { useRouter } from "next/navigation"
import { useTransition, useState } from "react"

export function FactureActions({ facture }: { facture: any }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function action(act: "envoyer" | "payer") {
    start(async () => {
      const res = await fetch("/api/factures", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: facture.id, action: act }),
      })
      if (res.ok) {
        showToast(act === "envoyer" ? "Email envoyé ✓" : "Facture marquée payée 💶")
        router.refresh()
      }
    })
  }

  async function downloadPdf() {
    const res = await fetch(`/api/factures/${facture.id}/pdf`)
    if (!res.ok) return
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `${facture.numero}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
      {toast && (
        <div style={{ position:"fixed", bottom:"24px", left:"50%", transform:"translateX(-50%)", background:"#1f242d", border:"1px solid #3e4856", color:"#fff", padding:"10px 20px", borderRadius:"10px", fontWeight:"600", fontSize:"13px", zIndex:100 }}>
          {toast}
        </div>
      )}

      <button onClick={downloadPdf} style={btnStyle("#252a33","#9da8b9")} title="Télécharger PDF">
        📄 PDF
      </button>

      {facture.statut === "emise" && (
        <button onClick={() => action("envoyer")} disabled={pending} style={btnStyle("rgba(19,109,236,.12)","#136dec")}>
          📨 Envoyer
        </button>
      )}

      {facture.statut !== "payee" && (
        <button onClick={() => action("payer")} disabled={pending} style={btnStyle("rgba(34,197,94,.12)","#22c55e")}>
          ✓ Payée
        </button>
      )}
    </div>
  )
}

const btnStyle = (bg: string, color: string): React.CSSProperties => ({
  padding:"5px 12px", borderRadius:"8px", background: bg, color, border:"none",
  fontWeight:"700", fontSize:"11px", cursor:"pointer", fontFamily:"inherit",
  transition:"opacity .15s",
})
