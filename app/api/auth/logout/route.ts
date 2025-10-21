import { type NextRequest, NextResponse } from "next/server"
import { clearSession } from "@/lib/auth/session"

/**
 * POST /api/auth/logout
 * Clear the current session and logout user
 */
export async function POST(request: NextRequest) {
  try {
    await clearSession()
    
    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("Error during logout:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}