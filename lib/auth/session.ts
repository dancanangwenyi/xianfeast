import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production"
const SESSION_COOKIE_NAME = "xianfeast_session"
const SESSION_DURATION = 24 * 60 * 60 // 24 hours in seconds

export type Permission =
  | "business:read"
  | "business:update"
  | "business:disable"
  | "stall:create"
  | "stall:read"
  | "stall:update"
  | "stall:delete"
  | "product:create"
  | "product:update"
  | "product:delete"
  | "product:approve"
  | "orders:create"
  | "orders:view"
  | "orders:fulfil"
  | "orders:export"
  | "users:invite"
  | "users:role:update"
  | "manage_webhooks"

export interface SessionPayload {
  userId: string
  email: string
  roles: string[]
  businessId?: string
}

/**
 * Create a JWT session token
 */
export function createSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: SESSION_DURATION,
  })
}

/**
 * Verify and decode a JWT session token
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Set session cookie (server-side only)
 */
export async function setSessionCookie(payload: SessionPayload) {
  const token = createSessionToken(payload)
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_DURATION,
    path: "/",
  })
}

/**
 * Get current session from cookie
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  return verifySessionToken(token)
}

/**
 * Verify session from NextRequest (for API routes)
 */
export async function verifySession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  return verifySessionToken(token)
}

/**
 * Clear session cookie
 */
export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(session: SessionPayload | null, permission: string): boolean {
  if (!session) return false

  // Super admin has all permissions
  if (session.roles.includes("super_admin")) return true

  // TODO: Implement fine-grained permission checking from roles_permissions sheet
  // For now, basic role-based checks
  return false
}
