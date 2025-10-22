import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, updateUser } from "@/lib/dynamodb/users"

/**
 * GET /api/auth/customer/verify-magic?token=xxx
 * Verify customer magic link token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Find user with this token (scan all users since we don't have a token index)
    // In production, you'd want to create a GSI for invite_token
    const { getAllUsers } = await import("@/lib/dynamodb/users")
    const allUsers = await getAllUsers()
    
    const user = allUsers.find(u => u.invite_token === token)

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired magic link" }, { status: 400 })
    }

    // Check if token is expired
    if (!user.invite_expiry || new Date(user.invite_expiry) < new Date()) {
      return NextResponse.json({ error: "Magic link has expired" }, { status: 400 })
    }

    // Check if user is already active
    if (user.status === "active") {
      return NextResponse.json({ error: "Account is already activated" }, { status: 400 })
    }

    // Check if user has customer role
    const roles = JSON.parse(user.roles_json || "[]")
    if (!roles.includes("customer")) {
      return NextResponse.json({ error: "Invalid customer magic link" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      message: "Magic link verified successfully",
    })

  } catch (error) {
    console.error("Error verifying customer magic link:", error)
    return NextResponse.json({ error: "Failed to verify magic link" }, { status: 500 })
  }
}