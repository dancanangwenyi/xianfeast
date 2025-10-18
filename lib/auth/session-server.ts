import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production"
const REFRESH_SECRET = process.env.REFRESH_SECRET || "change-this-refresh-secret-in-production"
const SESSION_COOKIE_NAME = "xianfeast_session"
const REFRESH_COOKIE_NAME = "xianfeast_refresh"
const SESSION_DURATION = 15 * 60 // 15 minutes in seconds
const REFRESH_DURATION = 7 * 24 * 60 * 60 // 7 days in seconds

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
  sessionId: string
  iat: number
  exp: number
}

export interface RefreshPayload {
  userId: string
  sessionId: string
  iat: number
  exp: number
}

/**
 * Generate a secure session ID
 */
export function generateSessionId(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Create a JWT session token
 */
export function createSessionToken(payload: Omit<SessionPayload, 'iat' | 'exp'>): string {
  const now = Math.floor(Date.now() / 1000)
  const sessionPayload: SessionPayload = {
    ...payload,
    iat: now,
    exp: now + SESSION_DURATION,
  }
  
  return jwt.sign(sessionPayload, JWT_SECRET)
}

/**
 * Create a refresh token
 */
export function createRefreshToken(payload: Omit<RefreshPayload, 'iat' | 'exp'>): string {
  const now = Math.floor(Date.now() / 1000)
  const refreshPayload: RefreshPayload = {
    ...payload,
    iat: now,
    exp: now + REFRESH_DURATION,
  }
  
  return jwt.sign(refreshPayload, REFRESH_SECRET)
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
 * Verify and decode a refresh token
 */
export function verifyRefreshToken(token: string): RefreshPayload | null {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as RefreshPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Set session and refresh cookies (server-side only)
 */
export async function setSessionCookies(payload: Omit<SessionPayload, 'iat' | 'exp'>, response: NextResponse): Promise<NextResponse> {
  const sessionId = generateSessionId()
  const sessionPayload = { ...payload, sessionId }
  
  const sessionToken = createSessionToken(sessionPayload)
  const refreshToken = createRefreshToken({ userId: payload.userId, sessionId })
  
  // Set session cookie (short-lived)
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_DURATION,
    path: "/",
  })

  // Set refresh cookie (long-lived)
  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_DURATION,
    path: "/",
  })

  return response
}

/**
 * Set session cookie (server-side only) - Legacy function for backward compatibility
 */
export async function setSessionCookie(payload: Omit<SessionPayload, 'iat' | 'exp'>, response: Response): Promise<Response> {
  return setSessionCookies(payload, response)
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
 * Clear session and refresh cookies
 */
export function clearSession(response: Response): Response {
  response.cookies.delete(SESSION_COOKIE_NAME)
  response.cookies.delete(REFRESH_COOKIE_NAME)
  return response
}

/**
 * Refresh session using refresh token (simplified version without Google Sheets)
 */
export async function refreshSession(request: NextRequest): Promise<SessionPayload | null> {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value
  
  if (!refreshToken) {
    return null
  }

  const refreshPayload = verifyRefreshToken(refreshToken)
  if (!refreshPayload) {
    return null
  }

  // For now, return a basic session without Google Sheets lookup
  // This will be handled by the API routes that need full user data
  return {
    userId: refreshPayload.userId,
    email: "user@example.com", // Placeholder
    roles: ["user"], // Placeholder
    sessionId: refreshPayload.sessionId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION,
  }
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
