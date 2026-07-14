"use client"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

// ── Annuaire Client ───────────────────────────────────────────────────────────
export function AnnuaireClient({ partenaires, clients }: { partenaires: any[]; clients: any[] }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px", fontFamily:"inherit" }}>
      <h1 style={{ color:"#fff", fontSize:"20px", fontWeight:"800", margin:0 }}>Partenaires & Clients</h1>
      <Section title="ESN Partenaires" icon="🤝" items={partenaires}
        fields={[
          { key:"nom",     label:"Raison sociale" },
          { key:"contact", label:"Contact" },
          { key:"email",   label:"Email" },
          { key:"delaiPaiement", label:"Délai (j)" },
        ]}
        apiPath="/api/annuaire/partenaires"
      />
      <Section title="Grands Comptes (Clients)" icon="🏢" items={clients}
        fields={[
          { key:"nom",     label:"Nom" },
          { key:"contact", label:"Contact / Service" },
          { key:"email",   label:"Email" },
          { key:"secteur", label:"Secteur" },
        ]}
        apiPath="/api/annuaire/clients"
      />
    </div>
  )
}

function Section({ title, icon, items, fields, apiPath }: any) {
  const router = useRouter()
  const [editing, setEditing]   = useState<any | null>(null)
  const [adding,  setAdding]    = useState(false)
  const [form, setForm]         = useState<Record<string,string>>({})
  const [pending, start]        = useTransition()

  function openAdd()  { setForm({}); setAdding(true); setEditing(null) }
  function openEdit(item: any) { setForm(item); setEditing(item); setAdding(false) }

  async function save() {
    start(async () => {
      await fetch(apiPath, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(editing ? { id: editing.id, ...form } : form),
      })
      setAdding(false); setEditing(null)
      router.refresh()
    })
  }

  return (
    <div style={{ background:"#1f242d", border:"1px solid #282f39", borderRadius:"12px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:"1px solid #282f39" }}>
        <span style={{ color:"#fff", fontWeight:"700", fontSize:"15px" }}>{icon} {title}</span>
        <button onClick={openAdd} style={{ padding:"6px 14px", borderRadius:"8px", background:"rgba(19,109,236,.12)", color:"#136dec", border:"none", fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>
          + Ajouter
        </button>
      </div>

      {/* Formulaire */}
      {(adding || editing) && (
        <div style={{ padding:"16px 18px", borderBottom:"1px solid #282f39", background:"rgba(255,255,255,.02)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"10px", marginBottom:"12px" }}>
            {fields.map((f: any) => (
              <label key={f.key} style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
                <span style={{ fontSize:"10px", fontWeight:"700", color:"#637588", textTransform:"uppercase", letterSpacing:".04em" }}>{f.label}</span>
                <input value={form[f.key]??""} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                  style={{ background:"#252a33", border:"1px solid #3e4856", borderRadius:"8px", padding:"8px 10px", color:"#fff", fontSize:"13px", fontFamily:"inherit", outline:"none" }}/>
              </label>
            ))}
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            <button onClick={()=>{setAdding(false);setEditing(null)}} style={{ padding:"7px 14px", borderRadius:"8px", background:"#252a33", color:"#9da8b9", border:"1px solid #3e4856", fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>Annuler</button>
            <button onClick={save} disabled={pending} style={{ padding:"7px 14px", borderRadius:"8px", background:"#136dec", color:"#fff", border:"none", fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>Enregistrer</button>
          </div>
        </div>
      )}

      {/* Liste */}
      {items.map((item: any) => (
        <div key={item.id} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 18px", borderBottom:"1px solid #282f39" }}>
          <div style={{ width:"36px", height:"36px", borderRadius:"8px", background:"rgba(99,102,241,.12)", color:"#6366f1", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"800", fontSize:"14px", flexShrink:0 }}>
            {item.nom?.[0]}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ color:"#fff", fontWeight:"700", fontSize:"13px" }}>{item.nom}</div>
            <div style={{ color:"#637588", fontSize:"11px", marginTop:"2px" }}>
              {fields.slice(1).map((f: any) => item[f.key]).filter(Boolean).join(" · ")}
            </div>
          </div>
          <button onClick={()=>openEdit(item)} style={{ background:"none", border:"none", color:"#637588", cursor:"pointer", fontSize:"16px", padding:"4px" }}>✏️</button>
        </div>
      ))}
      {items.length === 0 && <div style={{ padding:"24px", textAlign:"center", color:"#637588", fontSize:"13px" }}>Aucune entrée.</div>}
    </div>
  )
}
