import { type NextRequest, NextResponse } from "next/server"
import { getUserWithRoles, updateUserLastLogin, getUserRolesWithBusiness } from "@/lib/dynamodb/users"
import { verifyPassword } from "@/lib/auth/password"
import { setSessionCookies } from "@/lib/auth/session-server"
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

    // Find user by email using DynamoDB
    console.log('🔍 Looking up user:', email)
    const userWithRoles = await getUserWithRoles(email)

    if (!userWithRoles) {
      console.log('❌ User not found:', email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log('✅ User found:', userWithRoles.email, 'Status:', userWithRoles.status)

    // Check if user is active
    if (userWithRoles.status !== "active") {
      return NextResponse.json({ error: "Account is not active" }, { status: 401 })
    }

    // Verify password
    if (!userWithRoles.hashed_password) {
      console.log('❌ No password hash found for user:', email)
      return NextResponse.json({ error: "Password not set. Please use magic link." }, { status: 401 })
    }

    console.log('🔐 Verifying password for user:', email)
    const isValidPassword = await verifyPassword(password, userWithRoles.hashed_password)
    console.log('🔐 Password verification result:', isValidPassword)
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if MFA is enabled
    if (userWithRoles.mfa_enabled === true) {
      // Generate and send OTP
      const { otpId, code } = await storeOTP(userWithRoles.id, email)

      return NextResponse.json({
        success: true,
        requiresMFA: true,
        otpId,
        message: "OTP sent to your email",
      })
    }

    // No MFA - create session directly
    const roleNames = userWithRoles.roles.map(role => role.name)
    
    // Get business ID for business owners/stall managers
    let businessId = ''
    if (roleNames.includes('business_owner') || roleNames.includes('stall_manager')) {
      // Get user roles with business associations
      const userRolesWithBusiness = await getUserRolesWithBusiness(userWithRoles.id)
      const businessRole = userRolesWithBusiness.find(ur => 
        ur.role.name === 'business_owner' || ur.role.name === 'stall_manager'
      )
      if (businessRole) {
        businessId = businessRole.business_id
      }
    }
    
    const response = NextResponse.json({
      success: true,
      user: {
        id: userWithRoles.id,
        email: userWithRoles.email,
        name: userWithRoles.name,
        roles: roleNames,
        password_change_required: userWithRoles.password_change_required,
      },
    })

    // Set session cookies
    await setSessionCookies({
      userId: userWithRoles.id,
      email: userWithRoles.email,
      roles: roleNames,
      businessId,
    }, response)

    // Update last login
    await updateUserLastLogin(userWithRoles.id)

    return response
  } catch (error) {
    console.error("Error during login:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
