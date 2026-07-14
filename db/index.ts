import { drizzle } from "drizzle-orm/neon-serverless"
import { Pool } from "@neondatabase/serverless"
import * as schema from "./schema"

// Singleton pattern — un seul pool par instance
const globalForDb = globalThis as unknown as { pool: Pool | undefined }

const pool = globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL! })

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool
}

export const db = drizzle(pool, { schema, logger: process.env.NODE_ENV === "development" })

export type DB = typeof db
