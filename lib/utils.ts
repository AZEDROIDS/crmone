import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const MOIS_FR = [
  "janvier","février","mars","avril","mai","juin",
  "juillet","août","septembre","octobre","novembre","décembre",
]

export function moisLabel(mois: string): string {
  const [y, m] = mois.split("-")
  return `${MOIS_FR[Number(m) - 1]} ${y}`
}

export function fmtEur(n: number): string {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
}

export function fmtDate(d: string | Date | null): string {
  if (!d) return "—"
  return new Date(typeof d === "string" ? d + "T12:00" : d).toLocaleDateString("fr-FR")
}

export function joursOuvres(mois: string): number {
  const [y, m] = mois.split("-").map(Number)
  const nd = new Date(y, m, 0).getDate()
  let count = 0
  for (let d = 1; d <= nd; d++) {
    const wd = new Date(y, m - 1, d).getDay()
    if (wd !== 0 && wd !== 6) count++
  }
  return count
}

export function initiales(prenom: string, nom: string): string {
  return `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase()
}

export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}
export function apiOk<T>(data: T, status = 200) {
  return Response.json(data, { status })
}
