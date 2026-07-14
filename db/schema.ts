import {
  pgTable, pgEnum, text, integer, decimal, timestamp,
  boolean, date, uuid, index, uniqueIndex,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// ─── Enums ───────────────────────────────────────────────────────────────────

export const roleEnum         = pgEnum("role",          ["admin", "consultant"])
export const craStatutEnum    = pgEnum("cra_statut",    ["brouillon", "soumis", "valide", "refuse"])
export const jourTypeEnum     = pgEnum("jour_type",     ["travail", "tele", "demi", "conge", "absence"])
export const factureStatutEnum= pgEnum("facture_statut",["emise", "envoyee", "payee"])

// ─── Utilisateurs (auth) ──────────────────────────────────────────────────────

export const users = pgTable("users", {
  id            : uuid("id").primaryKey().defaultRandom(),
  email         : text("email").notNull().unique(),
  passwordHash  : text("password_hash").notNull(),
  role          : roleEnum("role").notNull().default("consultant"),
  consultantId  : uuid("consultant_id"),           // lien consultant si role=consultant
  createdAt     : timestamp("created_at").defaultNow().notNull(),
  updatedAt     : timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  emailIdx: uniqueIndex("users_email_idx").on(t.email),
}))

// ─── Sessions (NextAuth) ──────────────────────────────────────────────────────

export const sessions = pgTable("sessions", {
  id           : uuid("id").primaryKey().defaultRandom(),
  sessionToken : text("session_token").notNull().unique(),
  userId       : uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires      : timestamp("expires").notNull(),
})

export const verificationTokens = pgTable("verification_tokens", {
  identifier : text("identifier").notNull(),
  token      : text("token").notNull().unique(),
  expires    : timestamp("expires").notNull(),
})

// ─── Partenaires ESN ─────────────────────────────────────────────────────────

export const partenaires = pgTable("partenaires", {
  id        : uuid("id").primaryKey().defaultRandom(),
  nom       : text("nom").notNull(),
  contact   : text("contact"),
  email     : text("email"),
  siret     : text("siret"),
  adresse   : text("adresse"),
  delaiPaiement : integer("delai_paiement").default(45).notNull(),
  createdAt : timestamp("created_at").defaultNow().notNull(),
  updatedAt : timestamp("updated_at").defaultNow().notNull(),
})

// ─── Clients (Grands Comptes) ─────────────────────────────────────────────────

export const clients = pgTable("clients", {
  id        : uuid("id").primaryKey().defaultRandom(),
  nom       : text("nom").notNull(),
  contact   : text("contact"),
  email     : text("email"),
  secteur   : text("secteur"),
  adresse   : text("adresse"),
  createdAt : timestamp("created_at").defaultNow().notNull(),
  updatedAt : timestamp("updated_at").defaultNow().notNull(),
})

// ─── Consultants ──────────────────────────────────────────────────────────────

export const consultants = pgTable("consultants", {
  id            : uuid("id").primaryKey().defaultRandom(),
  prenom        : text("prenom").notNull(),
  nom           : text("nom").notNull(),
  email         : text("email").notNull().unique(),
  telephone     : text("telephone"),
  mission       : text("mission").notNull(),
  partenaireId  : uuid("partenaire_id").notNull().references(() => partenaires.id),
  clientId      : uuid("client_id").notNull().references(() => clients.id),
  tjmVente      : decimal("tjm_vente", { precision: 10, scale: 2 }).notNull(),
  coutJour      : decimal("cout_jour", { precision: 10, scale: 2 }).notNull(),
  teleMax       : integer("tele_max").default(10).notNull(),
  debut         : date("debut").notNull(),
  fin           : date("fin"),
  actif         : boolean("actif").default(true).notNull(),
  createdAt     : timestamp("created_at").defaultNow().notNull(),
  updatedAt     : timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  emailIdx: uniqueIndex("consultants_email_idx").on(t.email),
  partenaireIdx: index("consultants_partenaire_idx").on(t.partenaireId),
}))

// ─── CRA (Compte Rendu d'Activité) ───────────────────────────────────────────

export const cra = pgTable("cra", {
  id           : uuid("id").primaryKey().defaultRandom(),
  consultantId : uuid("consultant_id").notNull().references(() => consultants.id, { onDelete: "cascade" }),
  mois         : text("mois").notNull(),            // format: YYYY-MM
  statut       : craStatutEnum("statut").notNull().default("brouillon"),
  soumisLe     : timestamp("soumis_le"),
  valideParId  : uuid("valide_par_id").references(() => users.id),
  valideLe     : timestamp("valide_le"),
  motifRefus   : text("motif_refus"),
  createdAt    : timestamp("created_at").defaultNow().notNull(),
  updatedAt    : timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  consultantMoisIdx: uniqueIndex("cra_consultant_mois_idx").on(t.consultantId, t.mois),
}))

// ─── Jours CRA ────────────────────────────────────────────────────────────────

export const craJours = pgTable("cra_jours", {
  id     : uuid("id").primaryKey().defaultRandom(),
  craId  : uuid("cra_id").notNull().references(() => cra.id, { onDelete: "cascade" }),
  date   : date("date").notNull(),                  // format: YYYY-MM-DD
  type   : jourTypeEnum("type").notNull(),
}, (t) => ({
  craDayIdx: uniqueIndex("cra_jours_cra_date_idx").on(t.craId, t.date),
  craIdx: index("cra_jours_cra_idx").on(t.craId),
}))

// ─── Justificatifs ────────────────────────────────────────────────────────────

export const justificatifs = pgTable("justificatifs", {
  id         : uuid("id").primaryKey().defaultRandom(),
  craId      : uuid("cra_id").notNull().references(() => cra.id, { onDelete: "cascade" }),
  nom        : text("nom").notNull(),
  taille     : text("taille"),
  url        : text("url"),                         // URL S3/Vercel Blob
  mimeType   : text("mime_type"),
  uploadedAt : timestamp("uploaded_at").defaultNow().notNull(),
})

// ─── Factures ─────────────────────────────────────────────────────────────────

export const factures = pgTable("factures", {
  id           : uuid("id").primaryKey().defaultRandom(),
  craId        : uuid("cra_id").notNull().references(() => cra.id),
  consultantId : uuid("consultant_id").notNull().references(() => consultants.id),
  partenaireId : uuid("partenaire_id").notNull().references(() => partenaires.id),
  numero       : text("numero").notNull().unique(),
  date         : date("date").notNull(),
  mois         : text("mois").notNull(),
  jours        : decimal("jours", { precision: 5, scale: 1 }).notNull(),
  tjm          : decimal("tjm", { precision: 10, scale: 2 }).notNull(),
  montantHt    : decimal("montant_ht", { precision: 12, scale: 2 }).notNull(),
  tva          : decimal("tva", { precision: 12, scale: 2 }).notNull(),
  montantTtc   : decimal("montant_ttc", { precision: 12, scale: 2 }).notNull(),
  statut       : factureStatutEnum("statut").notNull().default("emise"),
  envoyeeLe    : timestamp("envoyee_le"),
  payeeLe      : timestamp("payee_le"),
  createdAt    : timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  numeroIdx: uniqueIndex("factures_numero_idx").on(t.numero),
  craIdx: index("factures_cra_idx").on(t.craId),
}))

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one }) => ({
  consultant: one(consultants, {
    fields: [users.consultantId],
    references: [consultants.id],
  }),
}))

export const consultantsRelations = relations(consultants, ({ one, many }) => ({
  partenaire  : one(partenaires, { fields: [consultants.partenaireId], references: [partenaires.id] }),
  client      : one(clients,     { fields: [consultants.clientId],     references: [clients.id]     }),
  cra         : many(cra),
  factures    : many(factures),
}))

export const craRelations = relations(cra, ({ one, many }) => ({
  consultant   : one(consultants, { fields: [cra.consultantId], references: [consultants.id] }),
  jours        : many(craJours),
  justificatifs: many(justificatifs),
  facture      : one(factures, { fields: [cra.id], references: [factures.craId] }),
}))

export const facturesRelations = relations(factures, ({ one }) => ({
  cra         : one(cra,         { fields: [factures.craId],         references: [cra.id]         }),
  consultant  : one(consultants, { fields: [factures.consultantId],  references: [consultants.id] }),
  partenaire  : one(partenaires, { fields: [factures.partenaireId],  references: [partenaires.id] }),
}))
