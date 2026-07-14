import { NextRequest } from "next/server"
import { db } from "@/db"
import { clients } from "@/db/schema"
import { requireAdmin } from "@/lib/auth"
import { clientSchema } from "@/lib/validations"
import { apiError, apiOk } from "@/lib/utils"
import { eq } from "drizzle-orm"

export async function GET() {
  await requireAdmin().catch(() => { throw new Response("", { status: 401 }) })
  return apiOk(await db.query.clients.findMany({ orderBy: (c,{asc})=>[asc(c.nom)] }))
}
export async function POST(req: NextRequest) {
  await requireAdmin().catch(() => { throw new Response("", { status: 401 }) })
  const body = await req.json()
  const parsed = clientSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)
  const [row] = await db.insert(clients).values(parsed.data).returning()
  return apiOk(row, 201)
}
export async function PATCH(req: NextRequest) {
  await requireAdmin().catch(() => { throw new Response("", { status: 401 }) })
  const { id, ...body } = await req.json()
  if (!id) return apiError("id requis")
  const parsed = clientSchema.partial().safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)
  const [row] = await db.update(clients).set(parsed.data).where(eq(clients.id, id)).returning()
  return apiOk(row)
}
