import type { NextAuthConfig } from "next-auth"

// Config PARTAGÉE, sans accès DB — safe pour le middleware Edge
export const authConfig = {
  providers: [],   // les providers avec DB sont ajoutés dans lib/auth.ts
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id           = (user as any).id
        token.role         = (user as any).role
        token.consultantId = (user as any).consultantId
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id           = token.id as string
        session.user.role         = token.role as string
        session.user.consultantId = token.consultantId as string | undefined
      }
      return session
    },
  },
  pages: { signIn: "/auth/login", error: "/auth/login" },
  session: { strategy: "jwt" },
  trustHost: true,
} satisfies NextAuthConfig
