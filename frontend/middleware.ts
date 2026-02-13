import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { Role } from "./types/role"

const roleAccessRules: Record<string, Role[]> = {
  "/settings": [Role.Admin],
  "/team": [Role.Admin, Role.IT],
  "/repositories": [Role.Admin, Role.Developer, Role.IT],
  "/dashboard": [Role.Admin, Role.Developer, Role.IT],
  "/policies": [Role.Admin, Role.Developer, Role.IT],
  "/resources": [Role.Admin, Role.Developer, Role.IT],
  "/requests": [Role.Admin, Role.Developer, Role.IT],
  "/monitoring": [Role.Admin, Role.Developer],
  "/get-help": [Role.Admin, Role.Developer, Role.IT],
  "/account": [Role.Admin, Role.Developer, Role.IT],
  "/infrastructure": [Role.Admin, Role.IT],
  "/accountSettings": [Role.Admin, Role.Developer, Role.IT],
  "/users": [Role.Admin],
  "/clusters": [Role.Admin, Role.Developer, Role.IT],
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Get JWT from HTTP-only cookie
  const token = req.cookies.get("access_token")?.value
  let role: Role | null = null
  let isLoggedIn = false

  if (token) {
    // try {
    //   const payload = JSON.parse(
    //     Buffer.from(token.split(".")[1], "base64").toString()
    //   )
    //   role = payload.role as Role
    //   isLoggedIn = true
    // } catch {
    //   isLoggedIn = false
    //   role = null
    // }

    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
      )

      const now = Math.floor(Date.now() / 1000)
      if (payload.exp && payload.exp < now) {
        isLoggedIn = false
        role = null
      } else {
        isLoggedIn = true
        role = payload.role as Role
      }
    } catch {
      isLoggedIn = false
      role = null
    }
  }

  if (!role) {
    isLoggedIn = false
  }

  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Redirect logged-in users visiting "/" to "/dashboard"
  if (pathname === "/" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Redirect not logged-in users accessing protected pages to login
  if (!isLoggedIn) {
    // any path that requires login
    for (const route of Object.keys(roleAccessRules)) {
      if (pathname === route || pathname.startsWith(`${route}/`)) {
        return NextResponse.redirect(new URL("/login", req.url))
      }
    }
  }

  // Role-based access (only if logged in)
  for (const [route, allowedRoles] of Object.entries(roleAccessRules)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      if (!role || !allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/get-help/:path*",
    "/monitoring/:path*",
    "/policies/:path*",
    "/repositories/:path*",
    "/requests/:path*",
    "/resources/:path*",
    "/settings/:path*",
    "/team/:path*",
    "/account/:path*",
    "/infrastructure/:path*",
    "/accountSettings/:path*",
    "/users/:path*",
    "/clusters/:path*",
  ],
}
