import "next-auth"
import "next-auth/jwt"

// ─── Extension des types NextAuth ────────────────────────────────────────────

declare module "next-auth" {
  interface User {
    role:          string
    consultantId?: string
  }
  interface Session {
    user: {
      id:            string
      email:         string
      role:          string
      consultantId?: string
      name?:         string | null
      image?:        string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:            string
    role:          string
    consultantId?: string
  }
}

// ─── Types métier ─────────────────────────────────────────────────────────────

export type JourType   = "travail" | "tele" | "demi" | "conge" | "absence"
export type CraStatut  = "brouillon" | "soumis" | "valide" | "refuse"
export type FacStatut  = "emise" | "envoyee" | "payee"

export interface JourEntry {
  date: string    // YYYY-MM-DD
  type: JourType
}

export interface CraTotals {
  jours:    number   // facturables (travail + tele + demi*0.5)
  tele:     number
  absences: number
}

export function computeTotals(jours: JourEntry[]): CraTotals {
  let j = 0, t = 0, a = 0
  for (const entry of jours) {
    switch (entry.type) {
      case "travail": j++;    break
      case "tele":    j++; t++; break
      case "demi":    j += 0.5; break
      case "conge":
      case "absence": a++;  break
    }
  }
  return { jours: j, tele: t, absences: a }
}
