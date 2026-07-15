import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const globalForDb = globalThis as unknown as { pool: Pool | undefined }

function makePool(): Pool {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL non configurée — attachez une base PostgreSQL")
  }
  return new Pool({
    connectionString: url,
    // Fly Postgres interne : pas de SSL ; Neon/externe : SSL requis
    ssl: url.includes(".flycast") || url.includes(".internal") || url.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  })
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    if (!_db) {
      const pool = globalForDb.pool ?? makePool()
      if (process.env.NODE_ENV !== "production") globalForDb.pool = pool
      _db = drizzle(pool, { schema })
    }
    return (_db as any)[prop]
  },
})

export type DB = typeof db
