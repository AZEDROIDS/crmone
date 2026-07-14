import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components"
import * as React from "react"

interface Props { prenom: string; mois: string; jours: number; portalUrl: string }

export function CraValidateEmail({ prenom, mois, jours, portalUrl }: Props) {
  return (
    <Html><Head />
      <Preview>✅ Votre CRA de {mois} a été validé</Preview>
      <Body style={{ backgroundColor: "#f6f7f8", fontFamily: "'Manrope', Arial, sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden" }}>
          <Section style={{ backgroundColor: "#22c55e", padding: "20px 32px" }}>
            <Text style={{ color: "#fff", fontSize: "18px", fontWeight: "800", margin: 0 }}>✅ CRA Validé</Text>
          </Section>
          <Section style={{ padding: "32px" }}>
            <Heading style={{ color: "#111418", fontSize: "22px", fontWeight: "800", margin: "0 0 16px" }}>
              Bonjour {prenom},
            </Heading>
            <Text style={{ color: "#4b5563", fontSize: "15px", lineHeight: "1.6" }}>
              Votre CRA de <strong>{mois}</strong> ({jours} jour{jours > 1 ? "s" : ""} facturables) 
              a été <strong style={{ color: "#16a34a" }}>validé</strong> par votre responsable.
            </Text>
            <Text style={{ color: "#4b5563", fontSize: "15px", lineHeight: "1.6" }}>
              La facture correspondante va être générée et envoyée à votre ESN partenaire.
            </Text>
            <Section style={{ textAlign: "center" as const, margin: "28px 0" }}>
              <Button style={{ backgroundColor: "#136dec", color: "#fff", borderRadius: "8px", padding: "12px 28px", fontSize: "14px", fontWeight: "700" }} href={portalUrl}>
                Voir mes rapports
              </Button>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
export default CraValidateEmail
