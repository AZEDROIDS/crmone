import { Body, Container, Head, Heading, Hr, Html, Preview, Row, Column, Section, Text } from "@react-email/components"
import * as React from "react"

interface Props {
  contactNom:    string; partenaireNom: string; numero: string; mois: string
  consultantNom: string; montantTtc: number; montantHt: number
  jours: number; tjm: number; delaiPaiement: number
}

const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })

export function FactureEmail(p: Props) {
  return (
    <Html><Head /><Preview>Facture {p.numero} — {p.mois} · {p.consultantNom}</Preview>
      <Body style={{ backgroundColor: "#f6f7f8", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ maxWidth: "620px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden" }}>
          <Section style={{ backgroundColor: "#136dec", padding: "20px 32px" }}>
            <Row>
              <Column><Text style={{ color: "#fff", fontWeight: "800", fontSize: "18px", margin: 0 }}>🗂️ ESN Manager</Text></Column>
              <Column style={{ textAlign: "right" as const }}>
                <Text style={{ color: "rgba(255,255,255,.7)", fontSize: "13px", margin: 0 }}>FACTURE</Text>
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: "16px", margin: 0 }}>{p.numero}</Text>
              </Column>
            </Row>
          </Section>
          <Section style={{ padding: "28px 32px" }}>
            <Text style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 4px" }}>À l'attention de</Text>
            <Text style={{ color: "#111418", fontWeight: "700", fontSize: "16px", margin: "0 0 4px" }}>{p.contactNom}</Text>
            <Text style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>{p.partenaireNom}</Text>
          </Section>
          <Hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "0 32px" }} />
          <Section style={{ padding: "24px 32px" }}>
            <Heading style={{ color: "#111418", fontSize: "16px", fontWeight: "700", margin: "0 0 14px" }}>Détail de la prestation</Heading>
            <Section style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "16px" }}>
              <Row style={{ marginBottom: "8px" }}>
                <Column><Text style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>Consultant</Text></Column>
                <Column style={{ textAlign: "right" as const }}><Text style={{ color: "#111418", fontWeight: "600", fontSize: "13px", margin: 0 }}>{p.consultantNom}</Text></Column>
              </Row>
              <Row style={{ marginBottom: "8px" }}>
                <Column><Text style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>Période</Text></Column>
                <Column style={{ textAlign: "right" as const }}><Text style={{ color: "#111418", fontWeight: "600", fontSize: "13px", margin: 0 }}>{p.mois}</Text></Column>
              </Row>
              <Row style={{ marginBottom: "8px" }}>
                <Column><Text style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>Jours × TJM</Text></Column>
                <Column style={{ textAlign: "right" as const }}><Text style={{ color: "#111418", fontWeight: "600", fontSize: "13px", margin: 0 }}>{p.jours} j × {fmt(p.tjm)}</Text></Column>
              </Row>
              <Hr style={{ border: "none", borderTop: "1px dashed #d1d5db", margin: "8px 0" }} />
              <Row style={{ marginBottom: "4px" }}>
                <Column><Text style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>Total HT</Text></Column>
                <Column style={{ textAlign: "right" as const }}><Text style={{ color: "#111418", fontSize: "13px", margin: 0 }}>{fmt(p.montantHt)}</Text></Column>
              </Row>
              <Row style={{ marginBottom: "4px" }}>
                <Column><Text style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>TVA 20 %</Text></Column>
                <Column style={{ textAlign: "right" as const }}><Text style={{ color: "#111418", fontSize: "13px", margin: 0 }}>{fmt(p.montantTtc - p.montantHt)}</Text></Column>
              </Row>
              <Row>
                <Column><Text style={{ color: "#111418", fontWeight: "700", fontSize: "15px", margin: 0 }}>Total TTC</Text></Column>
                <Column style={{ textAlign: "right" as const }}><Text style={{ color: "#136dec", fontWeight: "800", fontSize: "18px", margin: 0 }}>{fmt(p.montantTtc)}</Text></Column>
              </Row>
            </Section>
          </Section>
          <Section style={{ padding: "0 32px 28px" }}>
            <Text style={{ color: "#6b7280", fontSize: "12px", lineHeight: "1.6", margin: 0 }}>
              Paiement à {p.delaiPaiement} jours fin de mois · IBAN FR76 0000 0000 0000 0000 0000 000 · BIC XXXXFRPPXXX<br/>
              Pénalités de retard : 3× taux légal · Pas d'escompte pour paiement anticipé.<br/>
              Le PDF de la facture est joint à cet email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
export default FactureEmail
