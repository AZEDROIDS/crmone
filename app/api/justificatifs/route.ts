import { NextRequest } from "next/server"
import { db } from "@/db"
import { cra, craJours, justificatifs } from "@/db/schema"
import { requireAuth } from "@/lib/auth"
import { apiError, apiOk } from "@/lib/utils"
import { and, eq } from "drizzle-orm"

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED  = ["application/pdf","application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]

export async function POST(req: NextRequest) {
  const session = await requireAuth().catch(() => null)
  if (!session) return apiError("Non autorisé", 401)

  const formData     = await req.formData()
  const file         = formData.get("file") as File | null
  const consultantId = formData.get("craConsultantId") as string
  const mois         = formData.get("craMois") as string

  if (!file)         return apiError("Fichier manquant")
  if (!consultantId) return apiError("consultantId manquant")
  if (!mois)         return apiError("mois manquant")

  // Vérifications
  if (file.size > MAX_SIZE) return apiError("Fichier trop lourd (max 10 Mo)")
  if (!ALLOWED.includes(file.type)) return apiError("Type de fichier non accepté")

  // RBAC
  if (session.user.role === "consultant" && consultantId !== session.user.consultantId) {
    return apiError("Non autorisé", 403)
  }

  // Trouver ou créer le CRA
  let craRecord = await db.query.cra.findFirst({
    where: and(eq(cra.consultantId, consultantId), eq(cra.mois, mois)),
  })
  if (!craRecord) {
    const [created] = await db.insert(cra).values({ consultantId, mois, statut: "brouillon" }).returning()
    craRecord = created
  }
  if (craRecord.statut === "valide") return apiError("CRA déjà validé", 409)

  // Upload vers Vercel Blob (si configuré) ou stockage local simulé
  let url: string | undefined
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob")
    const blob = await put(`justificatifs/${craRecord.id}/${file.name}`, file, { access: "private" })
    url = blob.url
  }

  // Enregistrement en base
  const [justif] = await db.insert(justificatifs).values({
    craId:    craRecord.id,
    nom:      file.name,
    taille:   `${(file.size / 1024).toFixed(0)} Ko`,
    mimeType: file.type,
    url:      url,
  }).returning()

  return apiOk(justif, 201)
}

export async function DELETE(req: NextRequest) {
  const session = await requireAuth().catch(() => null)
  if (!session) return apiError("Non autorisé", 401)

  const { id } = await req.json()
  if (!id) return apiError("id requis")

  const j = await db.query.justificatifs.findFirst({ where: eq(justificatifs.id, id), with: { cra: true } })
  if (!j) return apiError("Justificatif introuvable", 404)

  // RBAC
  if (session.user.role === "consultant" && j.cra.consultantId !== session.user.consultantId) {
    return apiError("Non autorisé", 403)
  }

  // Supprimer du blob si URL
  if (j.url && process.env.BLOB_READ_WRITE_TOKEN) {
    const { del } = await import("@vercel/blob")
    await del(j.url).catch(console.error)
  }

  await db.delete(justificatifs).where(eq(justificatifs.id, id))
  return apiOk({ success: true })
}
