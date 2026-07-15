import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default auth(function middleware(req) {
  const { pathname } = req.nextUrl
  const session = (req as any).auth

  if (pathname.startsWith("/auth")) return NextResponse.next()

  if (!session) {
    const loginUrl = new URL("/auth/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = session.user?.role
  if (pathname.startsWith("/admin") && role !== "admin")
    return NextResponse.redirect(new URL("/consultant/cra", req.url))
  if (pathname.startsWith("/consultant") && role !== "consultant")
    return NextResponse.redirect(new URL("/admin/dashboard", req.url))
  if (pathname === "/")
    return NextResponse.redirect(new URL(role === "admin" ? "/admin/dashboard" : "/consultant/cra", req.url))

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
}
