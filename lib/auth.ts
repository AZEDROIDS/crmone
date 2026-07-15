import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { users } from "@/db/schema"
import { loginSchema } from "./validations"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",       type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1)

        if (!user) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        return {
          id:           user.id,
          email:        user.email,
          role:         user.role,
          consultantId: user.consultantId,
          name:         user.email,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id           = user.id
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
  pages: {
    signIn: "/auth/login",
    error:  "/auth/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,   // requis derrière le proxy Fly.io
  secret: process.env.AUTH_SECRET,
})

// ─── Helpers d'autorisation ──────────────────────────────────────────────────

export async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    throw new Error("UNAUTHORIZED")
  }
  return session
}

export async function requireAuth() {
  const session = await auth()
  if (!session) {
    throw new Error("UNAUTHORIZED")
  }
  return session
}
