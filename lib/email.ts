import { Resend } from "resend"
import type { CraRelanceEmail  as CraRelanceType  } from "@/emails/cra-relance"
import type { CraValidateEmail as CraValidateType } from "@/emails/cra-validate"
import type { CraRefusEmail   as CraRefusType    } from "@/emails/cra-refus"
import type { FactureEmail    as FactureType     } from "@/emails/facture"

const FROM = process.env.EMAIL_FROM ?? "ESN Manager <noreply@crmone.fly.dev>"

// Initialisation lazy — évite l'erreur "Missing API key" au build
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY non définie — emails désactivés")
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

type SendResult = { data: { id: string } | null; error: Error | null }

async function send(payload: Parameters<Resend["emails"]["send"]>[0]): Promise<SendResult> {
  const resend = getResend()
  if (!resend) return { data: null, error: new Error("Email non configuré") }
  return resend.emails.send(payload) as Promise<SendResult>
}

// ── CRA relance ──────────────────────────────────────────────────
export async function sendCraRelance(opts: {
  to: string; prenom: string; mois: string; portalUrl: string
}) {
  const { CraRelanceEmail } = await import("@/emails/cra-relance")
  return send({ from: FROM, to: opts.to,
    subject: `⏰ Rappel : saisissez votre CRA de ${opts.mois}`,
    react: CraRelanceEmail(opts) })
}

// ── CRA validé ──────────────────────────────────────────────────
export async function sendCraValidated(opts: {
  to: string; prenom: string; mois: string; jours: number; portalUrl: string
}) {
  const { CraValidateEmail } = await import("@/emails/cra-validate")
  return send({ from: FROM, to: opts.to,
    subject: `✅ Votre CRA de ${opts.mois} a été validé`,
    react: CraValidateEmail(opts) })
}

// ── CRA refusé ──────────────────────────────────────────────────
export async function sendCraRefus(opts: {
  to: string; prenom: string; mois: string; motif: string; portalUrl: string
}) {
  const { CraRefusEmail } = await import("@/emails/cra-refus")
  return send({ from: FROM, to: opts.to,
    subject: `⚠️ Votre CRA de ${opts.mois} nécessite des corrections`,
    react: CraRefusEmail(opts) })
}

// ── Facture partenaire ──────────────────────────────────────────
export async function sendFacture(opts: {
  to: string; contactNom: string; partenaireNom: string; numero: string
  mois: string; consultantNom: string; montantTtc: number; montantHt: number
  jours: number; tjm: number; delaiPaiement: number; pdfBase64?: string
}) {
  const { FactureEmail } = await import("@/emails/facture")
  return send({ from: FROM, to: opts.to,
    subject: `Facture ${opts.numero} — ${opts.mois} · ${opts.consultantNom}`,
    react: FactureEmail(opts),
    attachments: opts.pdfBase64 ? [{
      filename: `${opts.numero}.pdf`,
      content: opts.pdfBase64,
      contentType: "application/pdf",
    }] : undefined })
}
