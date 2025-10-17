import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySession, refreshSession } from "@/lib/auth/session"

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/admin", "/stalls", "/products", "/orders", "/api/admin", "/api/users", "/api/stalls", "/api/products", "/api/orders"]

// Routes that are only for unauthenticated users
const authRoutes = ["/login", "/auth/magic", "/auth/register"]

// Public routes that don't require authentication
const publicRoutes = ["/", "/api/auth/login", "/api/auth/register", "/api/auth/verify-magic-link", "/api/auth/send-mfa", "/api/auth/refresh"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Try to get session
  let session = await verifySession(request)
  
  // If no session but we have a refresh token, try to refresh
  if (!session) {
    session = await refreshSession(request)
  }

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if accessing auth routes with session
  if (isAuthRoute && session) {
    // Super admin goes to admin dashboard, others to regular dashboard
    const redirectPath = session.roles.includes("super_admin") ? "/admin/dashboard" : "/dashboard"
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Role-based redirection for dashboard access
  if (pathname === "/dashboard" && session) {
    if (session.roles.includes("super_admin")) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
