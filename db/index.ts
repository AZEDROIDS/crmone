import { drizzle } from "drizzle-orm/neon-serverless"
import { Pool } from "@neondatabase/serverless"
import * as schema from "./schema"

const globalForDb = globalThis as unknown as { pool: Pool | undefined }

function makePool(): Pool {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL non configurée — attachez une base PostgreSQL (fly postgres attach)")
  }
  return new Pool({ connectionString: url })
}

// Lazy init via Proxy : le pool n'est créé qu'au premier accès réel
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
