import { auth } from "@/lib/auth"

export default async function SettingsPage() {
  const session = await auth()

  return (
    <div style={{ fontFamily: "inherit", maxWidth: "640px" }}>
      <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: "800", margin: "0 0 24px" }}>Paramètres</h1>

      {/* Informations du compte */}
      <div style={{ background: "#1f242d", border: "1px solid #282f39", borderRadius: "12px", marginBottom: "16px" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #282f39" }}>
          <span style={{ color: "#fff", fontWeight: "700", fontSize: "14px" }}>🔐 Compte administrateur</span>
        </div>
        <div style={{ padding: "20px" }}>
          <div style={{ display: "grid", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#637588", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "5px" }}>Email</label>
              <div style={{ padding: "10px 14px", borderRadius: "8px", background: "#252a33", color: "#9da8b9", fontSize: "13px" }}>
                {session?.user.email}
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#637588", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "5px" }}>Rôle</label>
              <div style={{ padding: "10px 14px", borderRadius: "8px", background: "#252a33", color: "#9da8b9", fontSize: "13px" }}>
                Administrateur
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informations ESN */}
      <div style={{ background: "#1f242d", border: "1px solid #282f39", borderRadius: "12px", marginBottom: "16px" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #282f39" }}>
          <span style={{ color: "#fff", fontWeight: "700", fontSize: "14px" }}>🏢 Informations ESN</span>
        </div>
        <div style={{ padding: "20px" }}>
          <p style={{ color: "#637588", fontSize: "13px", margin: "0 0 16px" }}>
            Ces informations apparaissent sur les factures générées.
          </p>
          <div style={{ display: "grid", gap: "14px" }}>
            {[
              { label: "Raison sociale", placeholder: "Mon ESN SARL", env: "ESN_NOM" },
              { label: "SIRET", placeholder: "123 456 789 00012", env: "ESN_SIRET" },
              { label: "N° TVA intracommunautaire", placeholder: "FR12345678900", env: "ESN_TVA" },
              { label: "Adresse", placeholder: "12 rue de la Paix, 75002 Paris", env: "ESN_ADRESSE" },
              { label: "IBAN", placeholder: "FR76 0000 0000 0000 0000 0000 000", env: "ESN_IBAN" },
            ].map(f => (
              <div key={f.env}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#637588", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "5px" }}>{f.label}</label>
                <input
                  placeholder={f.placeholder}
                  defaultValue={process.env[f.env] ?? ""}
                  style={{ width: "100%", background: "#252a33", border: "1px solid #3e4856", borderRadius: "8px", padding: "10px 14px", color: "#fff", fontSize: "13px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const }}
                  readOnly
                />
              </div>
            ))}
          </div>
          <p style={{ color: "#637588", fontSize: "11px", marginTop: "14px" }}>
            💡 Pour modifier ces valeurs, configurez les variables d'environnement correspondantes dans Fly.io → Secrets.
          </p>
        </div>
      </div>

      {/* Variables d'env */}
      <div style={{ background: "#1f242d", border: "1px solid #282f39", borderRadius: "12px" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #282f39" }}>
          <span style={{ color: "#fff", fontWeight: "700", fontSize: "14px" }}>⚙️ Configuration serveur</span>
        </div>
        <div style={{ padding: "20px" }}>
          {[
            { label: "URL de l'application", val: process.env.NEXT_PUBLIC_APP_URL ?? "non définie" },
            { label: "Email configuré", val: process.env.EMAIL_FROM ? "✅ Oui" : "❌ Non (RESEND_API_KEY manquante)" },
            { label: "Stockage fichiers", val: process.env.BLOB_READ_WRITE_TOKEN ? "✅ Vercel Blob" : "⚠️ Non configuré" },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #282f39", fontSize: "13px" }}>
              <span style={{ color: "#9da8b9" }}>{r.label}</span>
              <span style={{ color: "#fff", fontWeight: "600" }}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
