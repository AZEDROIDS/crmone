import "server-only"
import { db } from "@/db"
import { factures } from "@/db/schema"
import { sql } from "drizzle-orm"

/** Générer le prochain numéro de facture FA-YYYY-NNN */
export async function nextNumeroFacture(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `FA-${year}-`
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(factures)
    .where(sql`${factures.numero} LIKE ${prefix + "%"}`)
  const seq = (Number(result[0]?.count ?? 0) + 1).toString().padStart(3, "0")
  return `${prefix}${seq}`
}
