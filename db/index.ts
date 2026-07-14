import { drizzle } from "drizzle-orm/neon-serverless"
import { Pool } from "@neondatabase/serverless"
import * as schema from "./schema"

let _db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (_db) return _db
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")
  const pool = new Pool({ connectionString: url })
  _db = drizzle(pool, { schema, logger: process.env.NODE_ENV === "development" })
  return _db
}

// Export db as a proxy so existing code works without change
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as any)[prop]
  },
})

export type DB = typeof db
