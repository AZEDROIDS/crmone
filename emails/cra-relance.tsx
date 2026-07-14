import {
  Body, Button, Container, Head, Heading, Hr,
  Html, Img, Preview, Section, Text,
} from "@react-email/components"
import * as React from "react"

interface Props {
  prenom:    string
  mois:      string
  portalUrl: string
}

export function CraRelanceEmail({ prenom, mois, portalUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Rappel : saisissez votre CRA de {mois}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>🗂️ ESN Manager</Text>
          </Section>
          <Section style={content}>
            <Heading style={h1}>Bonjour {prenom},</Heading>
            <Text style={text}>
              Nous n'avons pas encore reçu votre Compte Rendu d'Activité pour le mois de{" "}
              <strong>{mois}</strong>.
            </Text>
            <Text style={text}>
              La date limite de saisie est le <strong>5 du mois suivant</strong>. 
              Merci de saisir et soumettre votre CRA dès que possible.
            </Text>
            <Section style={btnSection}>
              <Button style={btn} href={portalUrl}>
                Saisir mon CRA →
              </Button>
            </Section>
            <Hr style={hr} />
            <Text style={footer}>
              Si vous avez déjà soumis votre CRA, ignorez ce message.
              Besoin d'aide ? Répondez directement à cet email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default CraRelanceEmail

const main      = { backgroundColor: "#f6f7f8", fontFamily: "'Manrope', Arial, sans-serif" }
const container = { maxWidth: "560px", margin: "0 auto", backgroundColor: "#ffffff", borderRadius: "12px", overflow: "hidden" }
const logoSection = { backgroundColor: "#136dec", padding: "20px 32px" }
const logoText  = { color: "#ffffff", fontSize: "18px", fontWeight: "800", margin: 0 }
const content   = { padding: "32px" }
const h1        = { color: "#111418", fontSize: "22px", fontWeight: "800", margin: "0 0 16px" }
const text      = { color: "#4b5563", fontSize: "15px", lineHeight: "1.6", margin: "0 0 14px" }
const btnSection= { textAlign: "center" as const, margin: "28px 0" }
const btn       = { backgroundColor: "#136dec", color: "#ffffff", borderRadius: "8px", padding: "12px 28px", fontSize: "14px", fontWeight: "700", textDecoration: "none", display: "inline-block" }
const hr        = { border: "none", borderTop: "1px solid #e5e7eb", margin: "24px 0" }
const footer    = { color: "#9ca3af", fontSize: "12px", lineHeight: "1.5", margin: 0 }
