import { NextRequest, NextResponse } from "next/server"
import { clearSession } from "@/lib/auth/session"

/**
 * POST /api/auth/logout
 * Logout user and clear session
 */
export async function POST(request: NextRequest) {
  try {
    // Clear session cookies
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

/**
 * GET /api/auth/logout
 * Logout user and redirect to login
 */
export async function GET(request: NextRequest) {
  try {
    // Clear session cookies
    await clearSession()

    // Redirect to login page
    return NextResponse.redirect(new URL("/login", request.url))
  } catch (error) {
    console.error("Error during logout:", error)
    return NextResponse.redirect(new URL("/login", request.url))
  }
}