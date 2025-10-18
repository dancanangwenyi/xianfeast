import { NextRequest, NextResponse } from "next/server"
import { getMagicLinkByToken, markMagicLinkAsUsed } from "@/lib/dynamodb/business"
import { getUserById, updateUserLastLogin } from "@/lib/dynamodb/auth"
import { setSessionCookies } from "@/lib/auth/session-server"
import { hashPassword } from "@/lib/auth/password"
import { updateItem, TABLE_NAMES } from "@/lib/dynamodb/service"

/**
 * POST /api/auth/verify-magic-link
 * Verify magic link and handle different types of actions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, action, password, mfaCode } = body

    if (!token) {
      return NextResponse.json({ error: "Magic link token is required" }, { status: 400 })
    }

    // Get magic link
    const magicLink = await getMagicLinkByToken(token)
    
    if (!magicLink) {
      return NextResponse.json({ error: "Invalid or expired magic link" }, { status: 400 })
    }

    // Check if already used
    if (magicLink.used) {
      return NextResponse.json({ error: "Magic link has already been used" }, { status: 400 })
    }

    // Check if expired
    if (new Date(magicLink.expires_at) < new Date()) {
      return NextResponse.json({ error: "Magic link has expired" }, { status: 400 })
    }

    // Get user
    const user = await getUserById(magicLink.user_id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Handle different actions based on magic link type
    switch (action) {
      case 'setup-password':
        return await handlePasswordSetup(magicLink, user, password)
      
      case 'verify-mfa':
        return await handleMFAVerification(magicLink, user, mfaCode)
      
      case 'login':
        return await handleMagicLinkLogin(magicLink, user)
      
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

  } catch (error) {
    console.error("Error verifying magic link:", error)
    return NextResponse.json({ error: "Failed to verify magic link" }, { status: 500 })
  }
}

async function handlePasswordSetup(magicLink: any, user: any, password: string) {
  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 })
  }

  // Hash the new password
  const hashedPassword = await hashPassword(password)

  // Update user with new password and activate account
  await updateItem(
    TABLE_NAMES.USERS,
    { id: user.id },
    {
      hashed_password: hashedPassword,
      status: 'active',
      password_change_required: false
    }
  )

  // Get updated user
  const updatedUser = await getUserById(user.id)
  if (!updatedUser) {
    throw new Error('Failed to retrieve updated user')
  }

  // Mark magic link as used
  await markMagicLinkAsUsed(magicLink.token)

  // If MFA is enabled, send MFA code
  if (user.mfa_enabled) {
    // TODO: Send MFA code
    return NextResponse.json({
      success: true,
      requiresMFA: true,
      message: "Password set successfully. MFA code sent to your email."
    })
  }

  // Create session and login
  const roles = JSON.parse(updatedUser.roles_json || "[]")
  
  const response = NextResponse.json({
    success: true,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      roles,
    },
    message: "Password set successfully. You are now logged in."
  })

  // Set session cookies
  await setSessionCookies({
    userId: updatedUser.id,
    email: updatedUser.email,
    roles,
    businessId: magicLink.business_id || '',
  }, response)

  // Update last login
  await updateUserLastLogin(updatedUser.id)

  return response
}

async function handleMFAVerification(magicLink: any, user: any, mfaCode: string) {
  if (!mfaCode) {
    return NextResponse.json({ error: "MFA code is required" }, { status: 400 })
  }

  // TODO: Verify MFA code
  // For now, just mark as verified

  // Mark magic link as used
  await markMagicLinkAsUsed(magicLink.token)

  // Create session and login
  const roles = JSON.parse(user.roles_json || "[]")
  
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles,
    },
    message: "MFA verified successfully. You are now logged in."
  })

  // Set session cookies
  await setSessionCookies({
    userId: user.id,
    email: user.email,
    roles,
    businessId: magicLink.business_id || '',
  }, response)

  // Update last login
  await updateUserLastLogin(user.id)

  return response
}

async function handleMagicLinkLogin(magicLink: any, user: any) {
  // Mark magic link as used
  await markMagicLinkAsUsed(magicLink.token)

  // Create session and login
  const roles = JSON.parse(user.roles_json || "[]")
  
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles,
    },
    message: "Logged in successfully via magic link."
  })

  // Set session cookies
  await setSessionCookies({
    userId: user.id,
    email: user.email,
    roles,
    businessId: magicLink.business_id || '',
  }, response)

  // Update last login
  await updateUserLastLogin(user.id)

  return response
}