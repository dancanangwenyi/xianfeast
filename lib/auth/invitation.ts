/**
 * Email invitation system for XianFeast
 * Handles magic link generation and email sending
 */

import { config } from "dotenv"
import { appendRowToSheet, queryRowsFromSheet, updateRowInSheet } from "../dynamodb/api-service"
import { v4 as uuidv4 } from "uuid"
import crypto from "crypto"

config()

export interface InvitationData {
  userId: string
  email: string
  name: string
  role: string
  businessId?: string
  invitedBy: string
}

export interface MagicLinkData {
  token: string
  userId: string
  email: string
  expiresAt: string
  usedAt?: string
}

/**
 * Generate a secure magic link token
 */
export function generateMagicLinkToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create a magic link invitation
 */
export async function createMagicLinkInvite(
  userId: string, 
  email: string, 
  expiresInHours: number = 24
): Promise<MagicLinkData> {
  const token = generateMagicLinkToken()
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()

  const magicLinkData: MagicLinkData = {
    token,
    userId,
    email,
    expiresAt,
  }

  // Store in magic_links table
  await appendRowToSheet("magic_links", {
    id: uuidv4(),
    user_id: userId,
    token,
    expires_at: expiresAt,
    used_at: null,
  })

  return magicLinkData
}

/**
 * Verify a magic link token
 */
export async function verifyMagicLinkToken(
  token: string
): Promise<{ valid: boolean; userId?: string; email?: string; error?: string }> {
  try {
    // Get magic link data
    const magicLinks = await queryRowsFromSheet("magic_links", { token })

    if (magicLinks.length === 0) {
      return { valid: false, error: "Invalid token" }
    }

    const magicLink = magicLinks[0]

    // Check if already used
    if (magicLink.used_at) {
      return { valid: false, error: "Token already used" }
    }

    // Check if expired
    if (new Date(magicLink.expires_at) < new Date()) {
      return { valid: false, error: "Token expired" }
    }

    // Get user email
    const users = await queryRowsFromSheet("users", { id: magicLink.user_id })

    if (users.length === 0) {
      return { valid: false, error: "User not found" }
    }

    const user = users[0]
    return { valid: true, userId: magicLink.user_id, email: user.email }
  } catch (error) {
    return { valid: false, error: "Verification failed" }
  }
}

/**
 * Mark magic link as used
 */
export async function markMagicLinkAsUsed(token: string): Promise<void> {
  // Find the magic link
  const magicLinks = await queryRowsFromSheet("magic_links", { token })

  if (magicLinks.length === 0) {
    throw new Error("Magic link not found")
  }

  const magicLink = magicLinks[0]
  
  // Update the used_at field
  await updateRowInSheet("magic_links", magicLink.id, {
    used_at: new Date().toISOString()
  })
}

/**
 * Send invitation email (mock implementation)
 * In production, this would integrate with SendGrid, AWS SES, etc.
 */
export async function sendInvitationEmail(
  email: string,
  name: string,
  magicLink: string,
  role: string,
  businessName?: string
): Promise<void> {
  // Mock email sending - in production, integrate with email service
  console.log(`📧 Sending invitation email to ${email}`)
  console.log(`   Name: ${name}`)
  console.log(`   Role: ${role}`)
  console.log(`   Business: ${businessName || 'N/A'}`)
  console.log(`   Magic Link: ${magicLink}`)
  console.log(`   Email sent successfully!`)
  
  // In production, you would use:
  // await sendGrid.send({
  //   to: email,
  //   from: 'noreply@xianfeast.com',
  //   subject: `Welcome to XianFeast${businessName ? ` - ${businessName}` : ''}`,
  //   html: generateInvitationEmailHTML(name, magicLink, role, businessName)
  // })
}

/**
 * Generate invitation email HTML
 */
export function generateInvitationEmailHTML(
  name: string,
  magicLink: string,
  role: string,
  businessName?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to XianFeast</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🍜 Welcome to XianFeast</h1>
          <p>The Immortal Dining Experience</p>
        </div>
        <div class="content">
          <h2>Hello ${name}!</h2>
          <p>You've been invited to join XianFeast${businessName ? ` as part of <strong>${businessName}</strong>` : ''} with the role of <strong>${role}</strong>.</p>
          <p>Click the button below to set up your account and get started:</p>
          <a href="${magicLink}" class="button">Set Up Your Account</a>
          <p><strong>Important:</strong> This link will expire in 24 hours for security reasons.</p>
          <p>If you have any questions, please contact your administrator.</p>
        </div>
        <div class="footer">
          <p>This email was sent by XianFeast. If you didn't expect this invitation, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Create a complete invitation flow
 */
export async function createInvitation(invitationData: InvitationData): Promise<{
  success: boolean
  magicLink?: string
  error?: string
}> {
  try {
    // Create magic link
    const magicLinkData = await createMagicLinkInvite(
      invitationData.userId,
      invitationData.email,
      24 // 24 hours expiry
    )

    // Generate the full magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const magicLink = `${baseUrl}/auth/magic?token=${magicLinkData.token}`

    // Send invitation email
    await sendInvitationEmail(
      invitationData.email,
      invitationData.name,
      magicLink,
      invitationData.role,
      invitationData.businessId ? "Business" : undefined
    )

    return {
      success: true,
      magicLink,
    }
  } catch (error) {
    console.error('Error creating invitation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
