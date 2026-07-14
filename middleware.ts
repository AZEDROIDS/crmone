import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default auth(function middleware(req) {
  const { pathname } = req.nextUrl
  const session = (req as any).auth

  // Routes publiques
  if (pathname.startsWith("/auth")) return NextResponse.next()

  // Non authentifié → login
  if (!session) {
    const loginUrl = new URL("/auth/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = session.user?.role

  // Routes admin → réservé aux admins
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/consultant/cra", req.url))
  }

  // Routes consultant → réservé aux consultants
  if (pathname.startsWith("/consultant") && role !== "consultant") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url))
  }

  // Racine → redirection selon rôle
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(role === "admin" ? "/admin/dashboard" : "/consultant/cra", req.url)
    )
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
}
