import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getUserById } from "@/lib/dynamodb/users"

/**
 * GET /api/users/me
 * Get current user info
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get full user details from DynamoDB
    const user = await getUserById(session.userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return user info (exclude sensitive fields)
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: JSON.parse(user.roles_json || "[]"),
      mfaEnabled: user.mfa_enabled === true,
      status: user.status,
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
