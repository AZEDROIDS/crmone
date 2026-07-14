import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "ESN Manager — Gestion sous-traitance & CRA",
  description: "Plateforme de gestion des consultants, CRA et facturation pour ESN",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Manrope', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
