export const runtime = "nodejs"
export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"

export async function GET() {
  let db = "not_configured"
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("build:build")) {
    try {
      const { db: client } = await import("@/db")
      const { sql } = await import("drizzle-orm")
      await client.execute(sql`SELECT 1`)
      db = "connected"
    } catch {
      db = "disconnected"
    }
  }
  // Toujours 200 : la machine est vivante même si la DB n'est pas encore attachée
  return NextResponse.json({ status: "ok", db, ts: new Date().toISOString() })
}
