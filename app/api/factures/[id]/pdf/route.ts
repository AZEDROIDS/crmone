import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { factures } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/auth"
import { moisLabel, fmtEur } from "@/lib/utils"

// Génération PDF serveur sans dépendance navigateur
// Utilise jsPDF (compatible Node.js via canvas polyfill)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAdmin().catch(() => { throw new Response("", { status: 401 }) })

  const f = await db.query.factures.findFirst({
    where: eq(factures.id, params.id),
    with: { consultant: { with: { client: true } }, partenaire: true },
  })
  if (!f) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })

  const k = f.consultant
  const p = f.partenaire

  // ── Génération PDF avec jsPDF (Node.js) ─────────────────────
  // jsPDF fonctionne en Node via : npm install jspdf @types/node canvas
  // Ici on génère un PDF minimaliste sans canvas
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  const W = 210, margin = 20

  // ── En-tête bleue ────────────────────────────────────────────
  doc.setFillColor(19, 109, 236)
  doc.rect(0, 0, W, 40, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("ESN Manager", margin, 18)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Gestion sous-traitance & CRA", margin, 26)
  doc.setFontSize(22)
  doc.setFont("helvetica", "bold")
  doc.text("FACTURE", W - margin, 18, { align: "right" })
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text(f.numero, W - margin, 27, { align: "right" })
  doc.text(`Émise le ${new Date(f.date).toLocaleDateString("fr-FR")}`, W - margin, 34, { align: "right" })

  // ── Infos émetteur / destinataire ────────────────────────────
  doc.setTextColor(30, 30, 30)
  let y = 55
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(margin, y, (W - 2 * margin) / 2 - 5, 35, 3, 3, "F")
  doc.roundedRect(W / 2 + 5, y, (W - 2 * margin) / 2 - 5, 35, 3, 3, "F")

  doc.setFontSize(8); doc.setTextColor(100, 116, 139)
  doc.text("DE", margin + 5, y + 8)
  doc.setFontSize(11); doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold")
  doc.text("Mon ESN SARL", margin + 5, y + 16)
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139)
  doc.text("12 rue de la Paix, 75002 Paris", margin + 5, y + 23)
  doc.text("SIRET : 123 456 789 00012", margin + 5, y + 29)
  doc.text("TVA : FR12345678900", margin + 5, y + 35)

  doc.setFontSize(8); doc.setTextColor(100, 116, 139)
  doc.text("À", W / 2 + 10, y + 8)
  doc.setFontSize(11); doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold")
  doc.text(p.nom, W / 2 + 10, y + 16)
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139)
  if (p.contact) doc.text(p.contact, W / 2 + 10, y + 23)
  if (p.email)   doc.text(p.email,   W / 2 + 10, y + 29)

  // ── Table de la prestation ───────────────────────────────────
  y = 105
  doc.setFillColor(15, 20, 26)
  doc.rect(margin, y, W - 2 * margin, 9, "F")
  doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont("helvetica", "bold")
  doc.text("Désignation",   margin + 3,       y + 6)
  doc.text("Qté (j)",       W - margin - 65,  y + 6)
  doc.text("TJM HT",        W - margin - 40,  y + 6)
  doc.text("Total HT",      W - margin - 5,   y + 6, { align: "right" })

  y += 14
  doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "normal"); doc.setFontSize(10)
  doc.text(`Prestation ${k.prenom} ${k.nom}`, margin + 3, y)
  y += 6
  doc.setFontSize(8); doc.setTextColor(100, 116, 139)
  doc.text(`Période : ${moisLabel(f.mois)} · Client : ${k.client?.nom ?? "—"}`, margin + 3, y)
  doc.text(String(f.jours),          W - margin - 62,  y - 6)
  doc.text(fmtEur(Number(f.tjm)),    W - margin - 37,  y - 6)
  doc.setFontSize(10); doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold")
  doc.text(fmtEur(Number(f.montantHt)), W - margin - 5, y - 6, { align: "right" })

  // ── Totaux ───────────────────────────────────────────────────
  y = 155
  const rightX = W - margin
  doc.setDrawColor(226, 232, 240); doc.line(margin, y, rightX, y)
  y += 8
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(100, 116, 139)
  doc.text("Total HT",   rightX - 55, y); doc.setTextColor(15, 23, 42); doc.text(fmtEur(Number(f.montantHt)), rightX, y, { align: "right" })
  y += 7
  doc.setTextColor(100, 116, 139); doc.text("TVA 20 %", rightX - 55, y); doc.setTextColor(15, 23, 42); doc.text(fmtEur(Number(f.tva)), rightX, y, { align: "right" })
  y += 2
  doc.setDrawColor(15, 23, 42); doc.setLineWidth(0.5); doc.line(rightX - 70, y, rightX, y)
  y += 6
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(19, 109, 236)
  doc.text("Total TTC", rightX - 55, y); doc.text(fmtEur(Number(f.montantTtc)), rightX, y, { align: "right" })

  // ── Pied de page ─────────────────────────────────────────────
  y = 275
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100, 116, 139)
  doc.text(`Paiement à ${p.delaiPaiement} jours fin de mois · IBAN FR76 0000 0000 0000 0000 0000 000`, margin, y)
  doc.text("Pénalités de retard : 3× taux légal · Pas d'escompte pour paiement anticipé", margin, y + 5)

  // ── Renvoyer le PDF ──────────────────────────────────────────
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${f.numero}.pdf"`,
      "Cache-Control":       "no-store",
    },
  })
}
