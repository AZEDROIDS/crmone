import { z } from "zod"

export const loginSchema = z.object({
  email:    z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe trop court"),
})

export const consultantSchema = z.object({
  prenom:       z.string().min(1, "Prénom requis"),
  nom:          z.string().min(1, "Nom requis"),
  email:        z.string().email("Email invalide"),
  telephone:    z.string().optional(),
  mission:      z.string().min(1, "Mission requise"),
  partenaireId: z.string().uuid("Partenaire requis"),
  clientId:     z.string().uuid("Client requis"),
  tjmVente:     z.coerce.number().positive("TJM vente doit être positif"),
  coutJour:     z.coerce.number().positive("Coût/jour doit être positif"),
  teleMax:      z.coerce.number().int().min(0).max(31),
  debut:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format AAAA-MM-JJ"),
  fin:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
})

export const partenaireSchema = z.object({
  nom:          z.string().min(1, "Nom requis"),
  contact:      z.string().optional(),
  email:        z.string().email("Email invalide").optional().or(z.literal("")),
  siret:        z.string().optional(),
  adresse:      z.string().optional(),
  delaiPaiement:z.coerce.number().int().min(1).max(365).default(45),
})

export const clientSchema = z.object({
  nom:     z.string().min(1, "Nom requis"),
  contact: z.string().optional(),
  email:   z.string().email().optional().or(z.literal("")),
  secteur: z.string().optional(),
  adresse: z.string().optional(),
})

export const craJourSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["travail", "tele", "demi", "conge", "absence"]),
})

export const craUpdateSchema = z.object({
  consultantId: z.string().uuid(),
  mois:         z.string().regex(/^\d{4}-\d{2}$/),
  jours:        z.array(craJourSchema),
})

export const craStatutSchema = z.object({
  statut:     z.enum(["soumis", "valide", "refuse", "brouillon"]),
  motifRefus: z.string().optional(),
})

export type LoginInput       = z.infer<typeof loginSchema>
export type ConsultantInput  = z.infer<typeof consultantSchema>
export type PartenaireInput  = z.infer<typeof partenaireSchema>
export type ClientInput      = z.infer<typeof clientSchema>
export type CraUpdateInput   = z.infer<typeof craUpdateSchema>
export type CraStatutInput   = z.infer<typeof craStatutSchema>
