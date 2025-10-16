import { v4 as uuidv4 } from "uuid"

// In-memory OTP storage (use Redis in production)
const otpStore = new Map<
  string,
  {
    code: string
    email: string
    attempts: number
    expiresAt: Date
  }
>()

const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 5
const MAX_OTP_ATTEMPTS = 3
const RESEND_COOLDOWN_SECONDS = 60

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Store OTP for verification
 */
export function storeOTP(email: string): { otpId: string; code: string } {
  const otpId = uuidv4()
  const code = generateOTP()
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  otpStore.set(otpId, {
    code,
    email,
    attempts: 0,
    expiresAt,
  })

  return { otpId, code }
}

/**
 * Verify OTP code
 */
export function verifyOTP(otpId: string, code: string): { valid: boolean; error?: string } {
  const otp = otpStore.get(otpId)

  if (!otp) {
    return { valid: false, error: "Invalid or expired OTP" }
  }

  if (new Date() > otp.expiresAt) {
    otpStore.delete(otpId)
    return { valid: false, error: "OTP has expired" }
  }

  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    otpStore.delete(otpId)
    return { valid: false, error: "Too many failed attempts" }
  }

  otp.attempts++

  if (otp.code !== code) {
    return { valid: false, error: "Invalid OTP code" }
  }

  // Valid OTP - remove from store
  otpStore.delete(otpId)
  return { valid: true }
}

/**
 * Clean up expired OTPs (run periodically)
 */
export function cleanupExpiredOTPs() {
  const now = new Date()
  for (const [otpId, otp] of otpStore.entries()) {
    if (now > otp.expiresAt) {
      otpStore.delete(otpId)
    }
  }
}

// Run cleanup every minute
setInterval(cleanupExpiredOTPs, 60 * 1000)
