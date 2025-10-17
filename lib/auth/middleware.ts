import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySession } from "./session"
import { checkPermission } from "./permissions"
import type { Permission } from "./session"

export interface AuthConfig {
  requireAuth?: boolean
  requiredRoles?: string[]
  requiredPermissions?: Permission[]
  allowGuests?: boolean
}

/**
 * Enhanced authentication middleware with role-based access control
 */
export async function requireAuth(
  request: NextRequest,
  config: AuthConfig = {}
): Promise<NextResponse | null> {
  const {
    requireAuth = true,
    requiredRoles = [],
    requiredPermissions = [],
    allowGuests = false,
  } = config

  // If no auth required and guests allowed, continue
  if (!requireAuth && allowGuests) {
    return null
  }

  // Verify session
  const session = await verifySession(request)
  
  if (!session) {
    if (requireAuth) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
    return null
  }

  // Check required roles
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => session.roles.includes(role))
    if (!hasRequiredRole) {
      return NextResponse.json(
        { error: "Insufficient permissions", requiredRoles },
        { status: 403 }
      )
    }
  }

  // Check required permissions
  if (requiredPermissions.length > 0) {
    for (const permission of requiredPermissions) {
      const hasPermission = await checkPermission(session, permission)
      if (!hasPermission) {
        return NextResponse.json(
          { error: "Insufficient permissions", requiredPermissions: [permission] },
          { status: 403 }
        )
      }
    }
  }

  return null // No error, continue
}

/**
 * Super Admin only access
 */
export async function requireSuperAdmin(request: NextRequest): Promise<NextResponse | null> {
  return requireAuth(request, {
    requireAuth: true,
    requiredRoles: ["super_admin"],
  })
}

/**
 * Business Owner or higher access
 */
export async function requireBusinessOwner(request: NextRequest): Promise<NextResponse | null> {
  return requireAuth(request, {
    requireAuth: true,
    requiredRoles: ["super_admin", "business_owner"],
  })
}

/**
 * Staff or higher access
 */
export async function requireStaff(request: NextRequest): Promise<NextResponse | null> {
  return requireAuth(request, {
    requireAuth: true,
    requiredRoles: ["super_admin", "business_owner", "stall_manager", "menu_editor", "order_fulfiller"],
  })
}

/**
 * Check if user can access a specific business
 */
export async function requireBusinessAccess(
  request: NextRequest,
  businessId: string
): Promise<NextResponse | null> {
  const session = await verifySession(request)
  
  if (!session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Super admin can access all businesses
  if (session.roles.includes("super_admin")) {
    return null
  }

  // Check if user belongs to this business
  if (session.businessId !== businessId) {
    return NextResponse.json(
      { error: "Access denied to this business" },
      { status: 403 }
    )
  }

  return null
}

/**
 * Check if user can access a specific stall
 */
export async function requireStallAccess(
  request: NextRequest,
  stallId: string
): Promise<NextResponse | null> {
  const session = await verifySession(request)
  
  if (!session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Super admin can access all stalls
  if (session.roles.includes("super_admin")) {
    return null
  }

  // TODO: Implement stall-specific access checking
  // For now, if user has business access, they can access stalls
  return null
}

