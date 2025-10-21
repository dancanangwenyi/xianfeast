import { type NextRequest, NextResponse } from "next/server"
import { getAllUsers, updateUser, updateUserLastLogin } from "@/lib/dynamodb/users"
import { hashPassword, validatePassword } from "@/lib/auth/password"
import { setSessionCookies } from "@/lib/auth/session-server"

/**
 * POST /api/auth/customer/set-password
 * Set password for customer after magic link verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ 
        error: "Password does not meet requirements", 
        details: passwordValidation.errors 
      }, { status: 400 })
    }

    // Find user with this token
    const allUsers = await getAllUsers()
    const user = allUsers.find(u => u.invite_token === token)

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired magic link" }, { status: 400 })
    }

    // Check if token is expired
    if (!user.invite_expiry || new Date(user.invite_expiry) < new Date()) {
      return NextResponse.json({ error: "Magic link has expired" }, { status: 400 })
    }

    // Check if user has customer role
    const roles = JSON.parse(user.roles_json || "[]")
    if (!roles.includes("customer")) {
      return NextResponse.json({ error: "Invalid customer magic link" }, { status: 400 })
    }

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Update user with password and activate account
    const updatedUser = await updateUser(user.id, {
      hashed_password: hashedPassword,
      status: "active",
      password_change_required: false,
      invite_token: undefined, // Clear the token
      invite_expiry: undefined, // Clear the expiry
    })

    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    console.log('✅ Customer password set and activated:', updatedUser.email)

    // Create session and log in the customer
    const response = NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        roles,
      },
      message: "Password set successfully! Welcome to XianFeast.",
    })

    // Update last login
    await updateUserLastLogin(updatedUser.id)

    // Set session cookies
    return await setSessionCookies({
      userId: updatedUser.id,
      email: updatedUser.email,
      roles,
      businessId: undefined, // Customers don't have business associations
    }, response)

  } catch (error) {
    console.error("Error setting customer password:", error)
    return NextResponse.json({ error: "Failed to set password" }, { status: 500 })
  }
}