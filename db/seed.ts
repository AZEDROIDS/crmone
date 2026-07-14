/**
 * Script de seed — peupler la base pour le développement
 * Usage: npm run db:seed
 */
import "dotenv/config"
import bcrypt from "bcryptjs"
import { db } from "./index"
import {
  users, partenaires, clients, consultants, cra, craJours,
} from "./schema"

async function main() {
  console.log("🌱 Seeding database…")

  // 1. Partenaires
  const [capgemini, alten] = await db
    .insert(partenaires)
    .values([
      { nom: "Capgemini Sourcing", contact: "Laure Petit", email: "laure.petit@capg-sourcing.fr", delaiPaiement: 45 },
      { nom: "Alten Partners",     contact: "Marc Diallo",  email: "marc.diallo@alten-partners.fr", delaiPaiement: 60 },
    ])
    .returning()
  console.log("✓ Partenaires")

  // 2. Clients
  const [bnpp, edf, sg] = await db
    .insert(clients)
    .values([
      { nom: "BNP Paribas",        contact: "DSI Marchés",        email: "dsi@bnpp.example",    secteur: "Banque" },
      { nom: "EDF",                contact: "Digital Factory",    email: "df@edf.example",      secteur: "Énergie" },
      { nom: "Société Générale",   contact: "IT Risques",         email: "it@sg.example",       secteur: "Banque" },
    ])
    .returning()
  console.log("✓ Clients")

  // 3. Consultants
  const [jean, marie, thomas] = await db
    .insert(consultants)
    .values([
      {
        prenom: "Jean", nom: "Dupont", email: "jean.dupont@mon-esn.fr",
        mission: "Développeur Fullstack React/Java", partenaireId: capgemini.id, clientId: bnpp.id,
        tjmVente: "620", coutJour: "410", teleMax: 10,
        debut: "2025-09-01", fin: "2026-12-31",
      },
      {
        prenom: "Marie", nom: "Curie", email: "marie.curie@mon-esn.fr",
        mission: "Data Engineer – Lakehouse Azure", partenaireId: alten.id, clientId: edf.id,
        tjmVente: "680", coutJour: "450", teleMax: 8,
        debut: "2026-01-15", fin: "2026-10-31",
      },
      {
        prenom: "Thomas", nom: "Pesquet", email: "thomas.pesquet@mon-esn.fr",
        mission: "DevOps / SRE – Kubernetes", partenaireId: capgemini.id, clientId: sg.id,
        tjmVente: "710", coutJour: "480", teleMax: 10,
        debut: "2025-11-03", fin: "2026-09-30",
      },
    ])
    .returning()
  console.log("✓ Consultants")

  // 4. Comptes utilisateurs
  const adminHash = await bcrypt.hash("admin1234", 12)
  const jeanHash  = await bcrypt.hash("jean1234",  12)

  await db.insert(users).values([
    { email: "admin@mon-esn.fr",       passwordHash: adminHash, role: "admin" },
    { email: "jean.dupont@mon-esn.fr", passwordHash: jeanHash,  role: "consultant", consultantId: jean.id },
  ])
  console.log("✓ Utilisateurs")
  console.log("  admin@mon-esn.fr / admin1234")
  console.log("  jean.dupont@mon-esn.fr / jean1234")

  // 5. CRA de démonstration (juin 2026, validé)
  const [craJuin] = await db.insert(cra).values({
    consultantId: jean.id, mois: "2026-06", statut: "valide",
    soumisLe: new Date("2026-06-30"),
  }).returning()

  // Jours ouvrés juin 2026
  const joursJuin: { craId: string; date: string; type: "travail" | "tele" }[] = []
  for (let d = 1; d <= 30; d++) {
    const dt = new Date(2026, 5, d)
    const wd = dt.getDay()
    if (wd === 0 || wd === 6) continue
    const dateStr = `2026-06-${String(d).padStart(2, "0")}`
    joursJuin.push({ craId: craJuin.id, date: dateStr, type: (wd === 1 || wd === 5) ? "tele" : "travail" })
  }
  await db.insert(craJours).values(joursJuin)
  console.log("✓ CRA de démonstration")

  console.log("🎉 Seed terminé !")
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
