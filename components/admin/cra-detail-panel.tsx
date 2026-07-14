"use client"

import { useState, useTransition } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { moisLabel, fmtEur, fmtDate } from "@/lib/utils"

const JOURS_S = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"]

export function CraDetailPanel({ cras }: { cras: any[] }) {
  const sp       = useSearchParams()
  const router   = useRouter()
  const [motif, setMotif] = useState("")
  const [showRefus, setShowRefus] = useState(false)
  const [pending, start] = useTransition()
  const [toast, setToast] = useState<string|null>(null)

  const selectedId = sp.get("selected") ?? cras[0]?.id
  const r = cras.find(x => x.id === selectedId)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function setStatut(statut: string, motifRefus?: string) {
    start(async () => {
      const res = await fetch("/api/cra", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, statut, motifRefus }),
      })
      if (res.ok) {
        showToast(statut === "valide" ? "CRA validé ✓" : "CRA refusé")
        setShowRefus(false)
        router.refresh()
      }
    })
  }

  async function genererFacture() {
    start(async () => {
      const res = await fetch("/api/factures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ craId: r.id }),
      })
      if (res.ok) {
        showToast("Facture générée ✓")
        router.refresh()
      }
    })
  }

  if (!r) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"#637588" }}>
      <div style={{ fontSize:"48px", marginBottom:"12px" }}>✅</div>
      <p>Sélectionnez un CRA dans la liste</p>
    </div>
  )

  const k  = r.consultant
  const jo = r.jours ?? []
  let jours = 0, tele = 0, abs = 0
  for (const j of jo) {
    if (j.type === "travail") jours++
    else if (j.type === "tele") { jours++; tele++ }
    else if (j.type === "demi") jours += 0.5
    else abs++
  }

  // Calendrier compact
  const [y, mo] = r.mois.split("-").map(Number)
  const nd = new Date(y, mo, 0).getDate()
  const first = (new Date(y, mo-1, 1).getDay() + 6) % 7
  const cells: JSX.Element[] = []
  for (let i = 0; i < first; i++) cells.push(<div key={`e${i}`} style={{ aspectRatio:"1", borderRadius:"6px", background:"rgba(255,255,255,.03)" }} />)
  for (let d = 1; d <= nd; d++) {
    const wd = new Date(y, mo-1, d).getDay()
    const key = `${r.mois}-${String(d).padStart(2,"0")}`
    const v   = jo.find((j: any) => j.date === key)?.type
    const we  = wd === 0 || wd === 6
    const css: Record<string,React.CSSProperties> = {
      travail: { background:"#136dec", color:"#fff" },
      tele:    { background:"rgba(99,102,241,.15)", border:"1px solid #6366f1", color:"#6366f1" },
      demi:    { background:"rgba(19,109,236,.35)", color:"#fff" },
      conge:   { background:"rgba(249,115,22,.15)", color:"#f97316" },
      absence: { background:"rgba(239,68,68,.12)", color:"#ef4444" },
    }
    cells.push(
      <div key={d} style={{
        aspectRatio:"1", borderRadius:"6px", display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:"11px", fontWeight:"700",
        ...(we ? { background:"rgba(255,255,255,.03)", color:"#3e4856" } : (v ? css[v] : { background:"rgba(255,255,255,.04)", color:"#637588" }))
      }}>
        {d}
      </div>
    )
  }

  return (
    <div style={{ maxWidth:"680px", fontFamily:"inherit" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:"24px", left:"50%", transform:"translateX(-50%)", background:"#1f242d", border:"1px solid #3e4856", color:"#fff", padding:"10px 20px", borderRadius:"10px", fontWeight:"600", fontSize:"13px", zIndex:100 }}>
          {toast}
        </div>
      )}

      {/* Header consultant */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"20px", flexWrap:"wrap", gap:"12px" }}>
        <div style={{ display:"flex", gap:"14px", alignItems:"center" }}>
          <div style={{ width:"50px", height:"50px", borderRadius:"50%", background:"rgba(19,109,236,.15)", color:"#136dec", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"800", fontSize:"17px" }}>
            {k?.prenom?.[0]}{k?.nom?.[0]}
          </div>
          <div>
            <div style={{ color:"#fff", fontWeight:"800", fontSize:"18px" }}>{k?.prenom} {k?.nom}</div>
            <div style={{ color:"#637588", fontSize:"12px", marginTop:"2px" }}>{k?.mission} · {k?.client?.nom}</div>
            <div style={{ color:"#637588", fontSize:"11px", marginTop:"2px" }}>
              Via {k?.partenaire?.nom} · soumis le {fmtDate(r.soumisLe)}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
          <StatutBadge statut={r.statut} />
          {r.statut === "soumis" && !pending && (
            <>
              <button onClick={() => setStatut("valide")} style={{ padding:"6px 14px", borderRadius:"8px", background:"rgba(34,197,94,.12)", color:"#22c55e", border:"none", fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>
                ✓ Valider
              </button>
              <button onClick={() => setShowRefus(true)} style={{ padding:"6px 14px", borderRadius:"8px", background:"rgba(239,68,68,.12)", color:"#ef4444", border:"none", fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>
                ✕ Refuser
              </button>
            </>
          )}
          {r.statut === "valide" && !r.facture && (
            <button onClick={genererFacture} disabled={pending} style={{ padding:"6px 14px", borderRadius:"8px", background:"#136dec", color:"#fff", border:"none", fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit", opacity: pending ? .6 : 1 }}>
              🧾 Générer la facture
            </button>
          )}
        </div>
      </div>

      {/* Formulaire refus */}
      {showRefus && (
        <div style={{ marginBottom:"16px", padding:"16px", borderRadius:"10px", background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.2)" }}>
          <p style={{ color:"#ef4444", fontWeight:"700", fontSize:"13px", margin:"0 0 10px" }}>Motif de refus (transmis au consultant)</p>
          <textarea
            value={motif} onChange={e => setMotif(e.target.value)}
            placeholder="Ex: Merci de vérifier les jours saisis, le total ne correspond pas au bon de commande."
            style={{ width:"100%", background:"#252a33", border:"1px solid #3e4856", borderRadius:"8px", padding:"10px", color:"#fff", fontSize:"13px", fontFamily:"inherit", resize:"vertical", minHeight:"80px", outline:"none", boxSizing:"border-box" }}
          />
          <div style={{ display:"flex", gap:"8px", marginTop:"10px" }}>
            <button onClick={() => setShowRefus(false)} style={{ padding:"6px 14px", borderRadius:"8px", background:"#252a33", color:"#9da8b9", border:"1px solid #3e4856", fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>
              Annuler
            </button>
            <button onClick={() => setStatut("refuse", motif)} disabled={!motif.trim() || pending} style={{ padding:"6px 14px", borderRadius:"8px", background:"rgba(239,68,68,.12)", color:"#ef4444", border:"none", fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>
              Confirmer le refus
            </button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"20px" }}>
        {[
          { label:"Jours facturables", val: jours, color:"#136dec", sub:`/ ${r.jours?.length ?? 0} renseignés` },
          { label:"Télétravail",       val: tele,  color:"#6366f1", sub:"jours à distance" },
          { label:"Absences / Congés", val: abs,   color:"#f97316", sub:"jours non travaillés" },
        ].map(k => (
          <div key={k.label} style={{ background:"#1f242d", border:"1px solid #282f39", borderRadius:"10px", padding:"14px", textAlign:"center" }}>
            <div style={{ fontSize:"10px", fontWeight:"700", color:"#637588", textTransform:"uppercase", letterSpacing:".05em", marginBottom:"6px" }}>{k.label}</div>
            <div style={{ fontSize:"26px", fontWeight:"800", color: k.color }}>{k.val}</div>
            <div style={{ fontSize:"10px", color:"#637588", marginTop:"3px" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Calendrier compact */}
      <div style={{ background:"#1f242d", border:"1px solid #282f39", borderRadius:"12px", marginBottom:"16px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:"1px solid #282f39" }}>
          <span style={{ color:"#fff", fontWeight:"700", fontSize:"14px", textTransform:"capitalize" }}>{moisLabel(r.mois)}</span>
          <div style={{ display:"flex", gap:"10px", fontSize:"10px", color:"#637588" }}>
            {[["#136dec","T"],["#6366f1","TT"],["#f97316","C/A"]].map(([c,l])=>(
              <span key={l} style={{ display:"flex", alignItems:"center", gap:"3px" }}>
                <span style={{ width:"9px", height:"9px", borderRadius:"2px", background: c as string, display:"inline-block" }}/>
                {l}
              </span>
            ))}
          </div>
        </div>
        <div style={{ padding:"14px 18px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px", marginBottom:"4px" }}>
            {JOURS_S.map(j => <div key={j} style={{ textAlign:"center", fontSize:"9px", fontWeight:"700", color:"#637588", textTransform:"uppercase", padding:"4px 0" }}>{j}</div>)}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px" }}>
            {cells}
          </div>
        </div>
      </div>

      {/* Justificatifs */}
      {r.justificatifs?.length > 0 && (
        <div style={{ background:"#1f242d", border:"1px solid #282f39", borderRadius:"12px", padding:"16px", marginBottom:"16px" }}>
          <div style={{ fontSize:"11px", fontWeight:"700", color:"#637588", textTransform:"uppercase", letterSpacing:".05em", marginBottom:"10px" }}>
            Justificatifs joints ({r.justificatifs.length})
          </div>
          {r.justificatifs.map((j: any) => (
            <div key={j.id} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 0", borderBottom:"1px solid #282f39" }}>
              <span style={{ fontSize:"18px" }}>📄</span>
              <span style={{ flex:1, color:"#fff", fontSize:"13px" }}>{j.nom}</span>
              <span style={{ color:"#637588", fontSize:"11px" }}>{j.taille}</span>
              {j.url && (
                <a href={j.url} target="_blank" rel="noopener noreferrer" style={{ color:"#136dec", fontSize:"11px", fontWeight:"700", textDecoration:"none" }}>
                  Télécharger
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Motif de refus */}
      {r.motifRefus && (
        <div style={{ padding:"12px 16px", borderRadius:"8px", background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)", color:"#ef4444", fontSize:"13px" }}>
          <b>Motif de refus :</b> {r.motifRefus}
        </div>
      )}
    </div>
  )
}

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string,[string,string]> = {
    brouillon: ["Brouillon",  "rgba(255,255,255,.06);color:#9da8b9"],
    soumis:    ["En attente", "rgba(249,115,22,.12);color:#f97316"],
    valide:    ["Validé",     "rgba(34,197,94,.12);color:#22c55e"],
    refuse:    ["Refusé",     "rgba(239,68,68,.12);color:#ef4444"],
  }
  const [label, style] = map[statut] ?? map.brouillon
  return (
    <span style={{ padding:"3px 10px", borderRadius:"999px", fontSize:"11px", fontWeight:"700",
      ...Object.fromEntries(style.split(";").map(p => p.trim().split(":").map(x => x.trim()))) }}>
      {label}
    </span>
  )
}
