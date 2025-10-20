import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { createUser } from "@/lib/dynamodb/users"
import { createMagicLinkInvite } from "@/lib/auth/magic-link"
import { sendMagicLinkEmail } from "@/lib/email/send"
import { v4 as uuidv4 } from "uuid"

/**
 * POST /api/auth/invite
 * Create a new user invite and send magic link
 * Requires super_admin role
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    // Check if user is super admin
    if (!session || !session.roles.includes("super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { email, name, businessId, roles = ["user"] } = body

    if (!email || !name) {
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 })
    }

    // Create user record
    const user = await createUser({
      email,
      name,
      roles_json: JSON.stringify(roles),
      mfa_enabled: false,
      status: "pending",
      invited_by: session.userId,
    })

    // Generate magic link
    const magicLink = await createMagicLinkInvite(user.id, email)

    // Send email
    await sendMagicLinkEmail(email, magicLink)

    return NextResponse.json({
      success: true,
      userId: user.id,
      message: "Invitation sent successfully",
    })
  } catch (error) {
    console.error("Error creating invite:", error)
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 })
  }
}
