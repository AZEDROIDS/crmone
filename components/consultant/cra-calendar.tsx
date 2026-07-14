"use client"

import { useState, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { moisLabel } from "@/lib/utils"

type JourType = "travail" | "tele" | "demi" | "conge" | "absence"
type JourEntry = { date: string; type: JourType }

const CYCLE: (JourType | null)[] = [null, "travail", "tele", "demi", "conge", "absence"]
const JOURS_S = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"]
const CAL_LABEL: Record<JourType, string> = {
  travail:"Travail", tele:"Télétravail", demi:"Demi-j.", conge:"Congé", absence:"Absence"
}
const CAL_STYLE: Record<JourType, React.CSSProperties> = {
  travail: { background:"rgba(19,109,236,.06)", borderColor:"transparent" },
  tele:    { background:"rgba(99,102,241,.06)", borderColor:"transparent" },
  demi:    { background:"rgba(19,109,236,.04)", borderColor:"transparent" },
  conge:   { background:"rgba(249,115,22,.06)", borderColor:"transparent" },
  absence: { background:"rgba(239,68,68,.06)",  borderColor:"transparent" },
}
const LABEL_STYLE: Record<JourType, React.CSSProperties> = {
  travail: { background:"#136dec", color:"#fff" },
  tele:    { background:"#6366f1", color:"#fff" },
  demi:    { background:"rgba(19,109,236,.4)", color:"#fff" },
  conge:   { background:"rgba(249,115,22,.2)", color:"#f97316" },
  absence: { background:"rgba(239,68,68,.2)",  color:"#ef4444" },
}
const NUM_COLOR: Record<JourType, string> = {
  travail:"#136dec", tele:"#6366f1", demi:"#136dec", conge:"#f97316", absence:"#ef4444"
}

interface Props {
  consultantId: string; mois: string; teleMax: number; joursOuvres: number
  initialJours: any[]; initialStatut: string; initialJustifs: any[]; motifRefus?: string
}

export function CraCalendar({ consultantId, mois, teleMax, joursOuvres, initialJours, initialStatut, initialJustifs, motifRefus }: Props) {
  const router = useRouter()
  const [jours, setJours] = useState<Record<string, JourType>>(
    () => Object.fromEntries(initialJours.map((j: any) => [j.date, j.type]))
  )
  const [pending, start] = useTransition()
  const [toast, setToast] = useState<string | null>(null)
  const [uiMois, setUiMois] = useState(mois)

  const locked = initialStatut === "soumis" || initialStatut === "valide"

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const cycleDay = useCallback((key: string) => {
    if (locked) return
    setJours(prev => {
      const cur  = prev[key] ?? null
      const next = CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length]
      if (next === null) { const n = { ...prev }; delete n[key]; return n }
      return { ...prev, [key]: next }
    })
  }, [locked])

  function prefill() {
    const [y, mo] = uiMois.split("-").map(Number)
    const nd = new Date(y, mo, 0).getDate()
    const next: Record<string, JourType> = {}
    for (let d = 1; d <= nd; d++) {
      const wd = new Date(y, mo-1, d).getDay()
      if (wd === 0 || wd === 6) continue
      next[`${uiMois}-${String(d).padStart(2,"0")}`] = "travail"
    }
    setJours(next)
    showToast("Jours ouvrés pré-remplis ✓")
  }

  async function save(statut: "brouillon" | "soumis") {
    const entries: JourEntry[] = Object.entries(jours).map(([date, type]) => ({ date, type }))
    start(async () => {
      const r1 = await fetch("/api/cra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultantId, mois: uiMois, jours: entries }),
      })
      if (!r1.ok) { showToast("Erreur lors de la sauvegarde"); return }
      const saved = await r1.json()
      if (statut === "soumis") {
        const r2 = await fetch("/api/cra", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: saved.id, statut: "soumis" }),
        })
        if (r2.ok) { showToast("CRA soumis pour validation ✓"); router.refresh() }
      } else {
        showToast("Brouillon sauvegardé ✓")
      }
    })
  }

  // Stats
  let jTotal = 0, tTotal = 0, aTotal = 0
  for (const v of Object.values(jours)) {
    if (v === "travail") jTotal++
    else if (v === "tele") { jTotal++; tTotal++ }
    else if (v === "demi") jTotal += 0.5
    else aTotal++
  }

  // Calendrier
  const [y, mo] = uiMois.split("-").map(Number)
  const nd    = new Date(y, mo, 0).getDate()
  const first = (new Date(y, mo-1, 1).getDay() + 6) % 7

  function shiftMois(d: number) {
    let [yy, mm] = uiMois.split("-").map(Number); mm += d
    if (mm < 1) { mm = 12; yy-- } if (mm > 12) { mm = 1; yy++ }
    setUiMois(`${yy}-${String(mm).padStart(2,"0")}`)
  }

  const cells: JSX.Element[] = []
  for (let i = 0; i < first; i++) cells.push(
    <div key={`e${i}`} style={{ minHeight:"80px", border:"1px solid #282f39", borderRight:"none", borderTop:"none", background:"rgba(0,0,0,.15)" }} />
  )
  for (let d = 1; d <= nd; d++) {
    const wd  = new Date(y, mo-1, d).getDay()
    const we  = wd === 0 || wd === 6
    const key = `${uiMois}-${String(d).padStart(2,"0")}`
    const v   = jours[key]
    cells.push(
      <div key={d}
        onClick={() => cycleDay(key)}
        style={{
          minHeight:"80px", padding:"8px",
          border:"1px solid #282f39", borderRight:"none", borderTop:"none",
          cursor: we || locked ? "default" : "pointer",
          transition:"background .1s",
          ...(we ? { background:"rgba(0,0,0,.12)" } : (v ? CAL_STYLE[v] : {})),
        }}
        onMouseOver={e => { if (!we && !locked && !v) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.03)" }}
        onMouseOut={e  => { if (!we && !locked && !v) (e.currentTarget as HTMLElement).style.background = "transparent" }}
      >
        <div style={{ fontSize:"12px", fontWeight:"700", color: we ? "#3e4856" : (v ? NUM_COLOR[v] : "#637588"), marginBottom:"6px" }}>{d}</div>
        {v && !we && (
          <div style={{ width:"100%", height:"22px", borderRadius:"4px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", fontWeight:"700", textTransform:"uppercase", letterSpacing:".03em", ...LABEL_STYLE[v] }}>
            {CAL_LABEL[v]}
          </div>
        )}
      </div>
    )
  }
  const rem = (first + nd) % 7 ? 7 - (first + nd) % 7 : 0
  for (let i = 0; i < rem; i++) cells.push(
    <div key={`f${i}`} style={{ minHeight:"80px", border:"1px solid #282f39", borderRight:"none", borderTop:"none", background:"rgba(0,0,0,.12)" }} />
  )

  return (
    <div>
      {toast && (
        <div style={{ position:"fixed", bottom:"24px", left:"50%", transform:"translateX(-50%)", background:"#1f242d", border:"1px solid #3e4856", color:"#fff", padding:"10px 20px", borderRadius:"10px", fontWeight:"600", fontSize:"13px", zIndex:100 }}>
          {toast}
        </div>
      )}

      {/* Alerte refus */}
      {motifRefus && (
        <div style={{ marginBottom:"16px", padding:"12px 16px", borderRadius:"8px", background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)", color:"#ef4444", fontSize:"13px" }}>
          <b>CRA refusé :</b> {motifRefus}. Corrigez puis soumettez à nouveau.
        </div>
      )}

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"20px" }}>
        {[
          { label:"Jours facturables", val: jTotal, sub:`/ ${joursOuvres} ouvrés`,  color:"#136dec" },
          { label:"Télétravail",       val: tTotal, sub:`/ ${teleMax} max`,          color: tTotal > teleMax ? "#ef4444" : "#6366f1" },
          { label:"Absences / Congés", val: aTotal, sub:"jours non travaillés",      color:"#f97316" },
          { label:"Statut",            val: null,   sub:"",                          color:"" },
        ].map((k, i) => (
          <div key={i} style={{ background:"#1f242d", border:"1px solid #282f39", borderRadius:"10px", padding:"16px" }}>
            <div style={{ fontSize:"10px", fontWeight:"700", color:"#637588", textTransform:"uppercase", letterSpacing:".05em", marginBottom:"6px" }}>{k.label}</div>
            {k.val !== null
              ? <><div style={{ fontSize:"26px", fontWeight:"800", color: k.color, lineHeight:1 }}>{k.val}</div>
                  <div style={{ fontSize:"10px", color: k.color === "#ef4444" ? "#ef4444" : "#637588", marginTop:"3px" }}>{k.sub}</div></>
              : <StatutBadge statut={initialStatut} />
            }
          </div>
        ))}
      </div>

      {/* Calendrier */}
      <div style={{ background:"#1f242d", border:"1px solid #282f39", borderRadius:"12px", marginBottom:"20px", overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:"1px solid #282f39", flexWrap:"wrap", gap:"10px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <button onClick={() => shiftMois(-1)} style={navBtnStyle}>‹</button>
            <span style={{ color:"#fff", fontWeight:"800", fontSize:"15px", minWidth:"150px", textAlign:"center", textTransform:"capitalize" }}>{moisLabel(uiMois)}</span>
            <button onClick={() => shiftMois(1)}  style={navBtnStyle}>›</button>
          </div>
          {!locked && (
            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={prefill} style={actionBtnStyle("#252a33","#9da8b9")}>✨ Pré-remplir</button>
              <button onClick={() => setJours({})} style={actionBtnStyle("rgba(239,68,68,.1)","#ef4444")}>🗑 Effacer</button>
            </div>
          )}
          <div style={{ display:"flex", gap:"10px", fontSize:"10px", color:"#637588", flexWrap:"wrap" }}>
            {(["travail","tele","demi","conge","absence"] as JourType[]).map(t => (
              <span key={t} style={{ display:"flex", alignItems:"center", gap:"3px" }}>
                <span style={{ width:"9px", height:"9px", borderRadius:"2px", display:"inline-block", ...(LABEL_STYLE[t] as any) }}/>
                {CAL_LABEL[t]}
              </span>
            ))}
          </div>
        </div>
        {/* Header jours */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"1px solid #282f39" }}>
          {JOURS_S.map((j,i) => (
            <div key={j} style={{ padding:"10px", textAlign:"center", fontSize:"10px", fontWeight:"700", textTransform:"uppercase", letterSpacing:".05em", color: i >= 5 ? "#f87171" : "#637588" }}>{j}</div>
          ))}
        </div>
        {/* Cellules */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderLeft:"1px solid #282f39", borderTop:"1px solid #282f39" }}>
          {cells}
        </div>
      </div>

      {/* Justificatifs + Soumission */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
        {/* Justificatifs */}
        <div style={{ background:"#1f242d", border:"1px solid #282f39", borderRadius:"12px", padding:"18px" }}>
          <div style={{ color:"#fff", fontWeight:"700", fontSize:"14px", marginBottom:"12px" }}>📎 Justificatifs</div>
          {initialJustifs.length === 0 && <p style={{ color:"#637588", fontSize:"12px" }}>Aucun fichier joint.</p>}
          {initialJustifs.map((j: any) => (
            <div key={j.id} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"7px 0", borderBottom:"1px solid #282f39" }}>
              <span>📄</span>
              <span style={{ flex:1, color:"#fff", fontSize:"12px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{j.nom}</span>
              <span style={{ color:"#637588", fontSize:"10px" }}>{j.taille}</span>
            </div>
          ))}
          {!locked && (
            <label style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"6px", border:"2px dashed #3e4856", borderRadius:"8px", padding:"16px", marginTop:"10px", cursor:"pointer", color:"#637588", fontSize:"12px", textAlign:"center" }}>
              ⬆️ Déposer un fichier<br/>
              <span style={{ fontSize:"10px", color:"#3e4856" }}>PDF, Word, Excel</span>
              <input type="file" accept=".pdf,.doc,.docx,.xlsx" style={{ display:"none" }} onChange={async e => {
                const f = e.target.files?.[0]; if (!f) return
                const fd = new FormData(); fd.append("file", f)
                fd.append("craConsultantId", consultantId); fd.append("craMois", uiMois)
                await fetch("/api/justificatifs", { method:"POST", body: fd })
                showToast(`${f.name} ajouté`); router.refresh()
              }}/>
            </label>
          )}
        </div>

        {/* Soumission */}
        <div style={{ background:"#1f242d", border:"1px solid #282f39", borderRadius:"12px", padding:"18px" }}>
          <div style={{ color:"#fff", fontWeight:"700", fontSize:"14px", marginBottom:"12px" }}>📨 Soumission</div>
          <div style={{ background:"#252a33", borderRadius:"8px", padding:"12px", marginBottom:"14px", fontSize:"12px", color:"#637588" }}>
            <p style={{ margin:"0 0 4px" }}>⏰ <b style={{ color:"#9da8b9" }}>Date limite :</b> le 5 du mois suivant</p>
            <p style={{ margin:0 }}>🔒 Une fois soumis, le CRA est verrouillé.</p>
          </div>
          {locked ? (
            <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"14px", borderRadius:"8px", background: initialStatut === "valide" ? "rgba(34,197,94,.08)" : "rgba(249,115,22,.08)", border: `1px solid ${initialStatut === "valide" ? "rgba(34,197,94,.25)" : "rgba(249,115,22,.25)"}` }}>
              <span style={{ fontSize:"22px" }}>{initialStatut === "valide" ? "✅" : "⏳"}</span>
              <div>
                <div style={{ color: initialStatut === "valide" ? "#22c55e" : "#f97316", fontWeight:"700", fontSize:"13px" }}>
                  {initialStatut === "valide" ? "CRA validé ✓" : "En attente de validation"}
                </div>
                <div style={{ color:"#637588", fontSize:"11px", marginTop:"2px" }}>
                  {initialStatut === "valide" ? "La facture sera générée par votre ESN." : "Vous serez notifié par email."}
                </div>
              </div>
            </div>
          ) : (
            <>
              <button onClick={() => save("brouillon")} disabled={pending || jTotal === 0} style={{ ...submitBtnStyle("#252a33","#9da8b9"), marginBottom:"8px" }}>
                💾 Sauvegarder le brouillon
              </button>
              <button onClick={() => save("soumis")} disabled={pending || jTotal === 0} style={submitBtnStyle("#136dec","#fff")}>
                📨 Soumettre pour validation
              </button>
              {jTotal === 0 && <p style={{ color:"#637588", fontSize:"11px", textAlign:"center", marginTop:"8px" }}>Saisissez au moins un jour.</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, [string, string]> = {
    brouillon:["Brouillon","rgba(255,255,255,.06);color:#9da8b9"],
    soumis:   ["En attente","rgba(249,115,22,.12);color:#f97316"],
    valide:   ["Validé","rgba(34,197,94,.12);color:#22c55e"],
    refuse:   ["Refusé","rgba(239,68,68,.12);color:#ef4444"],
  }
  const [label, s] = map[statut] ?? map.brouillon
  return <span style={{ padding:"4px 10px", borderRadius:"999px", fontSize:"11px", fontWeight:"700", ...Object.fromEntries(s.split(";").map(p=>p.trim().split(":").map(x=>x.trim()))) }}>{label}</span>
}

const navBtnStyle: React.CSSProperties = { padding:"5px 10px", borderRadius:"8px", background:"#252a33", border:"1px solid #3e4856", color:"#9da8b9", cursor:"pointer", fontSize:"16px", lineHeight:1, fontFamily:"inherit" }
const actionBtnStyle = (bg: string, color: string): React.CSSProperties => ({ padding:"6px 12px", borderRadius:"8px", background:bg, color, border:"none", fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" })
const submitBtnStyle = (bg: string, color: string): React.CSSProperties => ({ width:"100%", padding:"11px", borderRadius:"8px", background:bg, color, border:"none", fontWeight:"700", fontSize:"13px", cursor:"pointer", fontFamily:"inherit", display:"block", marginBottom:"0" })
