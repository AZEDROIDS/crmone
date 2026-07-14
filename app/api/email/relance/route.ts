import { NextRequest } from "next/server"
import { db } from "@/db"
import { consultants } from "@/db/schema"
import { requireAdmin } from "@/lib/auth"
import { sendCraRelance } from "@/lib/email"
import { apiError, apiOk, moisLabel } from "@/lib/utils"
import { eq, inArray } from "drizzle-orm"

/**
 * POST /api/email/relance
 * Body: { consultantIds: string[], mois: string }
 * 
 * Rate limité : max 50 emails / heure via Upstash Redis
 * (activer en décommentant le bloc Ratelimit ci-dessous)
 */
export async function POST(req: NextRequest) {
  await requireAdmin().catch(() => { throw new Response("", { status: 401 }) })

  const { consultantIds, mois } = await req.json()
  if (!consultantIds?.length) return apiError("consultantIds requis")
  if (!mois) return apiError("mois requis")

  // ── Rate Limiting (optionnel, nécessite UPSTASH_REDIS_REST_URL + TOKEN) ──
  // import { Ratelimit } from "@upstash/ratelimit"
  // import { Redis } from "@upstash/redis"
  // const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(50, "1 h") })
  // const ip = req.headers.get("x-forwarded-for") ?? "global"
  // const { success } = await ratelimit.limit(`relance:${ip}`)
  // if (!success) return apiError("Trop de requêtes", 429)

  const liste = await db.query.consultants.findMany({
    where: inArray(consultants.id, consultantIds),
  })

  const results = await Promise.allSettled(
    liste.map(k =>
      sendCraRelance({
        to:        k.email,
        prenom:    k.prenom,
        mois:      moisLabel(mois),
        portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/consultant/cra`,
      })
    )
  )

  const sent    = results.filter(r => r.status === "fulfilled").length
  const failed  = results.filter(r => r.status === "rejected").length

  return apiOk({ sent, failed, total: liste.length })
}
