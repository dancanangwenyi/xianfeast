import { type NextRequest, NextResponse } from "next/server"
import { createUser, getUserByEmail } from "@/lib/dynamodb/users"
import { v4 as uuidv4 } from "uuid"
import { sendCustomerSignupEmail } from "@/lib/email/customer"

/**
 * POST /api/auth/customer/signup
 * Customer signup with magic link
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = body

    if (!email || !name) {
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    // Generate magic link token
    const token = uuidv4()
    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create customer user with pending status
    const customer = await createUser({
      email,
      name,
      roles_json: JSON.stringify(["customer"]),
      status: "pending",
      mfa_enabled: false,
      invite_token: token,
      invite_expiry: expiryDate.toISOString(),
      password_change_required: true,
    })

    console.log('✅ Customer created:', customer.email, 'ID:', customer.id)

    // Send signup email with magic link
    await sendCustomerSignupEmail({
      to: email,
      name,
      token,
    })

    console.log('✅ Signup email sent to:', email)

    return NextResponse.json({
      success: true,
      message: "Account created successfully! Please check your email for the setup link.",
      customerId: customer.id,
    })

  } catch (error) {
    console.error("Error during customer signup:", error)
    return NextResponse.json({ error: "Signup failed" }, { status: 500 })
  }
}