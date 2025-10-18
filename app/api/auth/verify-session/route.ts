import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session-server"

/**
 * GET /api/auth/verify-session
 * Verify current session and return session data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request)
    
    if (!session) {
      return NextResponse.json({ error: "No valid session" }, { status: 401 })
    }

    return NextResponse.json({
      userId: session.userId,
      email: session.email,
      roles: session.roles,
      businessId: session.businessId,
      expiresAt: new Date(session.exp * 1000).toISOString(), // Convert exp to ISO string
    })
  } catch (error) {
    console.error("Session verification failed:", error)
    return NextResponse.json({ error: "Session verification failed" }, { status: 401 })
  }
}
