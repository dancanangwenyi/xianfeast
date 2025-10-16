import { type NextRequest, NextResponse } from "next/server"
import { updateRow, SHEET_COLUMNS } from "@/lib/google/sheets"
import { hashPassword, validatePassword } from "@/lib/auth/password"

/**
 * POST /api/auth/set-password
 * Set password for a user (after magic link)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, password } = body

    if (!userId || !password) {
      return NextResponse.json({ error: "User ID and password are required" }, { status: 400 })
    }

    // Validate password strength
    const validation = validatePassword(password)
    if (!validation.valid) {
      return NextResponse.json({ error: "Invalid password", details: validation.errors }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Update user record
    await updateRow(
      "users",
      userId,
      {
        hashed_password: hashedPassword,
        status: "active",
        invite_token: "",
        invite_expiry: "",
      },
      SHEET_COLUMNS.users,
    )

    // TODO: Get user details and create session
    // For now, return success
    return NextResponse.json({
      success: true,
      message: "Password set successfully",
    })
  } catch (error) {
    console.error("Error setting password:", error)
    return NextResponse.json({ error: "Failed to set password" }, { status: 500 })
  }
}
