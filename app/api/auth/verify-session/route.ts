import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"

/**
 * GET /api/auth/verify-session
 * Verify current session and return user data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: "No active session" }, { status: 401 })
    }

    // Return session data with expiry information
    return NextResponse.json({
      userId: session.userId,
      email: session.email,
      roles: session.roles,
      businessId: session.businessId,
      expiresAt: new Date(session.exp * 1000).toISOString(), // Convert Unix timestamp to ISO string
      isAuthenticated: true,
    })
  } catch (error) {
    console.error("Error verifying session:", error)
    return NextResponse.json({ error: "Session verification failed" }, { status: 500 })
  }
}