import { v4 as uuidv4 } from "uuid"
import { updateRowInSheet } from "../dynamodb/api-service"

/**
 * Generate a magic link token for user invite
 */
export function generateMagicLinkToken(): string {
  return uuidv4()
}

/**
 * Create magic link invite for a user
 */
export async function createMagicLinkInvite(userId: string, email: string): Promise<string> {
  const token = generateMagicLinkToken()
  const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await updateRowInSheet("users", userId, {
    invite_token: token,
    invite_expiry: expiryDate.toISOString(),
    status: "pending",
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${appUrl}/auth/magic?token=${token}`
}

/**
 * Verify magic link token and return user ID
 */
export async function verifyMagicLinkToken(
  token: string,
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  // This would query the users sheet for the token
  // For now, return a placeholder
  // TODO: Implement actual token verification from sheets
  return { valid: false, error: "Not implemented" }
}
