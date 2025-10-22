import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, updateUserLastLogin } from "@/lib/dynamodb/users"
import { verifyPassword } from "@/lib/auth/password"
import { setSessionCookies } from "@/lib/auth/session-server"

/**
 * POST /api/auth/customer/login
 * Customer login with email and password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user by email
    console.log('🔍 Looking up customer:', email)
    const user = await getUserByEmail(email)

    if (!user) {
      console.log('❌ Customer not found:', email)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    console.log('✅ Customer found:', user.email, 'Status:', user.status)

    // Check if user is active
    if (user.status !== "active") {
      return NextResponse.json({ error: "Account is not active. Please check your email for activation instructions." }, { status: 401 })
    }

    // Check if user has customer role
    const roles = JSON.parse(user.roles_json || "[]")
    if (!roles.includes("customer")) {
      return NextResponse.json({ error: "Invalid customer account" }, { status: 401 })
    }

    // Verify password
    if (!user.hashed_password) {
      console.log('❌ No password hash found for customer:', email)
      return NextResponse.json({ error: "Password not set. Please use the signup link sent to your email." }, { status: 401 })
    }

    console.log('🔐 Verifying password for customer:', email)
    const isValidPassword = await verifyPassword(password, user.hashed_password)
    console.log('🔐 Password verification result:', isValidPassword)
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for customer:', email)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    console.log('✅ Customer login successful:', email)

    // Create session
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles,
      },
      message: "Login successful! Welcome back to XianFeast.",
    })

    // Update last login
    await updateUserLastLogin(user.id)

    // Set session cookies
    return await setSessionCookies({
      userId: user.id,
      email: user.email,
      roles,
      businessId: undefined, // Customers don't have business associations
    }, response)

  } catch (error) {
    console.error("Error during customer login:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}