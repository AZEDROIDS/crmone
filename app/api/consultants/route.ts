import { NextRequest } from "next/server"
import { db } from "@/db"
import { consultants, partenaires, clients } from "@/db/schema"
import { requireAdmin } from "@/lib/auth"
import { consultantSchema } from "@/lib/validations"
import { apiError, apiOk } from "@/lib/utils"
import { eq } from "drizzle-orm"

export async function GET() {
  await requireAdmin().catch(() => { throw new Response("", { status: 401 }) })
  const rows = await db.query.consultants.findMany({
    with: { partenaire: true, client: true },
    orderBy: (c, { asc }) => [asc(c.nom)],
  })
  return apiOk(rows)
}

export async function POST(req: NextRequest) {
  await requireAdmin().catch(() => { throw new Response("", { status: 401 }) })
  const body   = await req.json()
  const parsed = consultantSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)
  const [row] = await db.insert(consultants).values({
    ...parsed.data,
    tjmVente: parsed.data.tjmVente.toString(),
    coutJour: parsed.data.coutJour.toString(),
    fin: parsed.data.fin || null,
  }).returning()
  return apiOk(row, 201)
}

export async function PATCH(req: NextRequest) {
  await requireAdmin().catch(() => { throw new Response("", { status: 401 }) })
  const { id, ...body } = await req.json()
  if (!id) return apiError("id requis")
  const parsed = consultantSchema.partial().safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)
  const [row] = await db.update(consultants).set({
    ...parsed.data,
    tjmVente: parsed.data.tjmVente?.toString(),
    coutJour: parsed.data.coutJour?.toString(),
    updatedAt: new Date(),
  }).where(eq(consultants.id, id)).returning()
  return apiOk(row)
}

export async function DELETE(req: NextRequest) {
  await requireAdmin().catch(() => { throw new Response("", { status: 401 }) })
  const { id } = await req.json()
  if (!id) return apiError("id requis")
  await db.update(consultants).set({ actif: false }).where(eq(consultants.id, id))
  return apiOk({ success: true })
}
