import { type NextRequest, NextResponse } from "next/server"
import { queryRows, updateRow, SHEET_COLUMNS } from "@/lib/google/sheets"
import { verifyPassword } from "@/lib/auth/password"
import { setSessionCookie } from "@/lib/auth/session"
import { storeOTP } from "@/lib/auth/mfa"

/**
 * POST /api/auth/login
 * Login with email and password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user by email
    const users = await queryRows("users", SHEET_COLUMNS.users, (row) => row.email === email)

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const user = users[0]

    // Check if user is active
    if (user.status !== "active") {
      return NextResponse.json({ error: "Account is not active" }, { status: 401 })
    }

    // Verify password
    if (!user.hashed_password) {
      return NextResponse.json({ error: "Password not set. Please use magic link." }, { status: 401 })
    }

    const isValidPassword = await verifyPassword(user.hashed_password, password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if MFA is enabled
    if (user.mfa_enabled === "true" || user.mfa_enabled === true) {
      // Generate and send OTP
      const { otpId, code } = await storeOTP(user.id, email)

      return NextResponse.json({
        success: true,
        requiresMFA: true,
        otpId,
        message: "OTP sent to your email",
      })
    }

    // No MFA - create session directly
    const roles = JSON.parse(user.roles_json || "[]")
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      roles,
      businessId: user.business_id,
    })

    // Update last login
    await updateRow("users", user.id, { last_login: new Date().toISOString() }, SHEET_COLUMNS.users)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles,
      },
    })
  } catch (error) {
    console.error("Error during login:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
