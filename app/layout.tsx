import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "ESN Manager — Gestion sous-traitance & CRA",
  description: "Plateforme de gestion des consultants, CRA et facturation pour ESN",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* Font chargée côté client uniquement — aucune dépendance réseau au build */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Manrope', system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
