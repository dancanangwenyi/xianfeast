import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { appendRow, SHEET_COLUMNS } from "@/lib/google/sheets"
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
    const userId = uuidv4()
    await appendRow(
      "users",
      {
        id: userId,
        email,
        name,
        roles_json: JSON.stringify(roles),
        mfa_enabled: false,
        status: "invited",
        invited_by: session.userId,
      },
      SHEET_COLUMNS.users,
    )

    // Generate magic link
    const magicLink = await createMagicLinkInvite(userId, email)

    // Send email
    await sendMagicLinkEmail(email, magicLink)

    return NextResponse.json({
      success: true,
      userId,
      message: "Invitation sent successfully",
    })
  } catch (error) {
    console.error("Error creating invite:", error)
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 })
  }
}
