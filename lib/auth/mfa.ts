import { randomBytes } from "crypto"
import { appendRowToSheet, queryRowsFromSheet, updateRowInSheet } from "@/lib/dynamodb/api-service"
import { sendOTPEmail } from "@/lib/email/send"

export interface OTPData {
  id: string
  userId: string
  code: string
  expiresAt: string
  usedAt?: string
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Store OTP in Google Sheets
 */
export async function storeOTP(userId: string, email: string): Promise<{ otpId: string; code: string }> {
  const otpId = randomBytes(16).toString('hex')
  const code = generateOTP()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

  await appendRowToSheet("otp_codes", {
    id: otpId,
    user_id: userId,
    code,
    expires_at: expiresAt,
    used_at: null,
  })

  // Send OTP via email
  await sendOTPEmail(email, code)

  return { otpId, code }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(otpId: string, code: string): Promise<boolean> {
  const otpCodes = await queryRowsFromSheet("otp_codes", { id: otpId })

  if (otpCodes.length === 0) {
    return false
  }

  const otpRecord = otpCodes[0]

  // Check if OTP is expired
  if (new Date(otpRecord.expires_at) < new Date()) {
    return false
  }

  // Check if OTP is already used
  if (otpRecord.used_at) {
    return false
  }

  // Check if code matches
  if (otpRecord.code !== code) {
    return false
  }

  // Mark OTP as used
  await updateRowInSheet("otp_codes", otpId, {
    used_at: new Date().toISOString()
  })

  return true
}

/**
 * Clean up expired OTPs
 */
export async function cleanupExpiredOTPs(): Promise<void> {
  // This would be handled by DynamoDB TTL in production
  // For now, we'll leave expired OTPs in the table
  console.log("OTP cleanup would be handled by DynamoDB TTL")
}
