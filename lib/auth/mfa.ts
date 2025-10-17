import { randomBytes } from "crypto"
import { getSheetsClient } from "@/lib/google/auth"
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

  const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
  if (!SPREADSHEET_ID) {
    throw new Error("Spreadsheet ID not configured")
  }

  const sheets = getSheetsClient()

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "otp_codes!A:ZZ",
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        otpId,
        userId,
        code,
        expiresAt,
        "", // used_at (empty initially)
      ]]
    }
  })

  // Send OTP via email
  await sendOTPEmail(email, code)

  return { otpId, code }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(otpId: string, code: string): Promise<boolean> {
  const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
  if (!SPREADSHEET_ID) {
    throw new Error("Spreadsheet ID not configured")
  }

  const sheets = getSheetsClient()

  const otpResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "otp_codes!A:ZZ",
  })

  const otpCodes = otpResponse.data.values?.slice(1) || []
  const otpRecord = otpCodes.find(row => row[0] === otpId)

  if (!otpRecord) {
    return false
  }

  const [, userId, storedCode, expiresAt, usedAt] = otpRecord

  // Check if OTP is expired
  if (new Date(expiresAt) < new Date()) {
    return false
  }

  // Check if OTP is already used
  if (usedAt) {
    return false
  }

  // Check if code matches
  if (storedCode !== code) {
    return false
  }

  // Mark OTP as used
  const otpIndex = otpCodes.findIndex(row => row[0] === otpId)
  const rowNumber = otpIndex + 2 // +1 for header, +1 for 1-indexed

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `otp_codes!E${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[new Date().toISOString()]]
    }
  })

  return true
}

/**
 * Clean up expired OTPs
 */
export async function cleanupExpiredOTPs(): Promise<void> {
  const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
  if (!SPREADSHEET_ID) {
    throw new Error("Spreadsheet ID not configured")
  }

  const sheets = getSheetsClient()

  const otpResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "otp_codes!A:ZZ",
  })

  const otpCodes = otpResponse.data.values || []
  const now = new Date()

  // Filter out expired OTPs
  const validOTPs = otpCodes.filter((row, index) => {
    if (index === 0) return true // Keep header
    const expiresAt = row[3]
    return new Date(expiresAt) > now
  })

  // Clear the sheet and rewrite with valid OTPs
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: "otp_codes!A:ZZ",
  })

  if (validOTPs.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "otp_codes!A:ZZ",
      valueInputOption: "RAW",
      requestBody: {
        values: validOTPs
      }
    })
  }
}
