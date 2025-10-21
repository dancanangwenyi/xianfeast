import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getUserById } from "@/lib/dynamodb/users"
import { createMagicLink } from "@/lib/dynamodb/magic-links"
import { sendMagicLinkEmail } from "@/lib/email/send"
import { randomBytes } from "crypto"

/**
 * POST /api/users/[id]/reset-password
 * Send password reset link to user
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!session.roles.includes("super_admin")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { id } = await params
    const user = await getUserById(id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate magic link token
    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create magic link record
    await createMagicLink({
      token,
      user_id: user.id,
      type: "password_reset",
      expires_at: expiresAt.toISOString(),
      used: false,
    })

    // Send email
    await sendMagicLinkEmail({
      to: user.email,
      name: user.name,
      token,
      type: "password_reset",
    })

    return NextResponse.json({
      success: true,
      message: "Password reset link sent successfully",
    })
  } catch (error) {
    console.error("Error sending password reset:", error)
    return NextResponse.json({ error: "Failed to send password reset" }, { status: 500 })
  }
}