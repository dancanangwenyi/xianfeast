import { type NextRequest, NextResponse } from "next/server"
import { verifyOTP } from "@/lib/auth/otp"
import { getUserByEmail, updateUser } from "@/lib/dynamodb/users"
import { setSessionCookie } from "@/lib/auth/session"

/**
 * POST /api/auth/verify-otp
 * Verify OTP code and create session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { otpId, code, email } = body

    if (!otpId || !code || !email) {
      return NextResponse.json({ error: "OTP ID, code, and email are required" }, { status: 400 })
    }

    // Verify OTP
    const result = verifyOTP(otpId, code)

    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    // Find user by email
    const user = await getUserByEmail(email)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const roles = JSON.parse(user.roles_json || "[]")

    // Create session
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      roles,
    })

    // Update last login
    await updateUser(user.id, { last_login: new Date().toISOString() })

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
    console.error("Error verifying OTP:", error)
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 })
  }
}
