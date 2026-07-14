// app/api/annuaire/partenaires/route.ts
import { NextRequest } from "next/server"
import { db } from "@/db"
import { partenaires } from "@/db/schema"
import { requireAdmin } from "@/lib/auth"
import { partenaireSchema } from "@/lib/validations"
import { apiError, apiOk } from "@/lib/utils"
import { eq } from "drizzle-orm"

export async function GET() {
  await requireAdmin().catch(() => { throw new Response("", { status: 401 }) })
  return apiOk(await db.query.partenaires.findMany({ orderBy: (p,{asc})=>[asc(p.nom)] }))
}
export async function POST(req: NextRequest) {
  await requireAdmin().catch(() => { throw new Response("", { status: 401 }) })
  const body   = await req.json()
  const parsed = partenaireSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)
  const [row]  = await db.insert(partenaires).values(parsed.data).returning()
  return apiOk(row, 201)
}
export async function PATCH(req: NextRequest) {
  await requireAdmin().catch(() => { throw new Response("", { status: 401 }) })
  const { id, ...body } = await req.json()
  if (!id) return apiError("id requis")
  const parsed = partenaireSchema.partial().safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)
  const [row] = await db.update(partenaires).set({ ...parsed.data, updatedAt: new Date() }).where(eq(partenaires.id, id)).returning()
  return apiOk(row)
}
