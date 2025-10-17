import { NextRequest, NextResponse } from "next/server"
import { refreshSession } from "@/lib/auth/session"

/**
 * POST /api/auth/refresh
 * Refresh session using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    const session = await refreshSession(request)
    
    if (!session) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        email: session.email,
        roles: session.roles,
        businessId: session.businessId,
      },
    })
  } catch (error) {
    console.error("Error refreshing session:", error)
    return NextResponse.json({ error: "Failed to refresh session" }, { status: 500 })
  }
}

