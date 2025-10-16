import { type NextRequest, NextResponse } from "next/server"
import { storeOTP } from "@/lib/auth/otp"
import { sendOTPEmail } from "@/lib/email/send"

/**
 * POST /api/auth/send-otp
 * Send OTP to user's email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Generate and store OTP
    const { otpId, code } = storeOTP(email)

    // Send email
    await sendOTPEmail(email, code)

    return NextResponse.json({
      success: true,
      otpId,
      message: "OTP sent to your email",
    })
  } catch (error) {
    console.error("Error sending OTP:", error)
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 })
  }
}
