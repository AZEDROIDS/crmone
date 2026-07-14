import { Resend } from "resend"
import { CraRelanceEmail }  from "@/emails/cra-relance"
import { CraValidateEmail } from "@/emails/cra-validate"
import { CraRefusEmail }    from "@/emails/cra-refus"
import { FactureEmail }     from "@/emails/facture"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.EMAIL_FROM ?? "ESN Manager <noreply@mon-esn.fr>"

// ─── CRA : relance consultant ─────────────────────────────────────────────────

export async function sendCraRelance(opts: {
  to:         string
  prenom:     string
  mois:       string    // ex: "juin 2026"
  portalUrl:  string
}) {
  return resend.emails.send({
    from:    FROM,
    to:      opts.to,
    subject: `⏰ Rappel : saisissez votre CRA de ${opts.mois}`,
    react:   CraRelanceEmail(opts),
  })
}

// ─── CRA : notification de validation ─────────────────────────────────────────

export async function sendCraValidated(opts: {
  to:        string
  prenom:    string
  mois:      string
  jours:     number
  portalUrl: string
}) {
  return resend.emails.send({
    from:    FROM,
    to:      opts.to,
    subject: `✅ Votre CRA de ${opts.mois} a été validé`,
    react:   CraValidateEmail(opts),
  })
}

// ─── CRA : notification de refus ──────────────────────────────────────────────

export async function sendCraRefus(opts: {
  to:        string
  prenom:    string
  mois:      string
  motif:     string
  portalUrl: string
}) {
  return resend.emails.send({
    from:    FROM,
    to:      opts.to,
    subject: `⚠️ Votre CRA de ${opts.mois} nécessite des corrections`,
    react:   CraRefusEmail(opts),
  })
}

// ─── Facture : envoi au partenaire ────────────────────────────────────────────

export async function sendFacture(opts: {
  to:              string
  contactNom:      string
  partenaireNom:   string
  numero:          string
  mois:            string
  consultantNom:   string
  montantTtc:      number
  montantHt:       number
  jours:           number
  tjm:             number
  delaiPaiement:   number
  pdfBase64?:      string    // PDF en base64 pour PJ
}) {
  return resend.emails.send({
    from:    FROM,
    to:      opts.to,
    subject: `Facture ${opts.numero} — ${opts.mois} · ${opts.consultantNom}`,
    react:   FactureEmail(opts),
    attachments: opts.pdfBase64 ? [{
      filename:    `${opts.numero}.pdf`,
      content:     opts.pdfBase64,
      contentType: "application/pdf",
    }] : undefined,
  })
}
