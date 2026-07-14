import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components"
import * as React from "react"
interface Props { prenom: string; mois: string; motif: string; portalUrl: string }
export function CraRefusEmail({ prenom, mois, motif, portalUrl }: Props) {
  return (
    <Html><Head /><Preview>⚠️ Votre CRA de {mois} nécessite des corrections</Preview>
      <Body style={{ backgroundColor: "#f6f7f8", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden" }}>
          <Section style={{ backgroundColor: "#f97316", padding: "20px 32px" }}>
            <Text style={{ color: "#fff", fontSize: "18px", fontWeight: "800", margin: 0 }}>⚠️ CRA à corriger</Text>
          </Section>
          <Section style={{ padding: "32px" }}>
            <Heading style={{ color: "#111418", fontSize: "20px", fontWeight: "800", margin: "0 0 16px" }}>Bonjour {prenom},</Heading>
            <Text style={{ color: "#4b5563", fontSize: "15px", lineHeight: "1.6" }}>
              Votre CRA de <strong>{mois}</strong> a été retourné pour corrections.
            </Text>
            <Section style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "8px", padding: "16px", margin: "16px 0" }}>
              <Text style={{ color: "#9a3412", fontSize: "14px", margin: 0 }}>
                <strong>Motif :</strong> {motif}
              </Text>
            </Section>
            <Text style={{ color: "#4b5563", fontSize: "15px", lineHeight: "1.6" }}>
              Merci de corriger et de soumettre à nouveau votre rapport.
            </Text>
            <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
              <Button style={{ backgroundColor: "#f97316", color: "#fff", borderRadius: "8px", padding: "12px 28px", fontSize: "14px", fontWeight: "700" }} href={portalUrl}>
                Corriger mon CRA
              </Button>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
export default CraRefusEmail
