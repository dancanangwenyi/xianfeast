import { type NextRequest, NextResponse } from "next/server"
import { refreshSession } from "@/lib/auth/session"

/**
 * POST /api/auth/refresh
 * Refresh the current session using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    const newSession = await refreshSession(request)
    
    if (!newSession) {
      return NextResponse.json({ error: "Unable to refresh session" }, { status: 401 })
    }

    // Return new session data
    return NextResponse.json({
      userId: newSession.userId,
      email: newSession.email,
      roles: newSession.roles,
      businessId: newSession.businessId,
      expiresAt: new Date(newSession.exp * 1000).toISOString(),
      isAuthenticated: true,
    })
  } catch (error) {
    console.error("Error refreshing session:", error)
    return NextResponse.json({ error: "Session refresh failed" }, { status: 500 })
  }
}