import { NextRequest, NextResponse } from "next/server"
import { verifyMagicLinkToken, markMagicLinkAsUsed } from "@/lib/auth/invitation"
import { hashPassword } from "@/lib/auth/password"
import { getSheetsClient } from "@/lib/google/auth"
import { v4 as uuidv4 } from "uuid"

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID

/**
 * GET /api/auth/verify-magic-link
 * Verify a magic link token and return user info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const verification = await verifyMagicLinkToken(token)
    
    if (!verification.valid) {
      return NextResponse.json({ error: verification.error }, { status: 400 })
    }

    // Get user info
    const sheets = getSheetsClient()
    const usersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A:ZZ",
    })

    const users = usersResponse.data.values?.slice(1) || []
    const user = users.find(row => row[0] === verification.userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const [, email, name, , rolesJson] = user
    const roles = rolesJson ? JSON.parse(rolesJson) : []

    return NextResponse.json({
      userId: verification.userId,
      email: verification.email,
      name,
      role: roles[0] || "user",
    })
  } catch (error) {
    console.error("Error verifying magic link:", error)
    return NextResponse.json({ error: "Failed to verify magic link" }, { status: 500 })
  }
}

/**
 * POST /api/auth/verify-magic-link
 * Handle different actions: setup-password, send-mfa, verify-mfa
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, token, password, email, mfaCode, mfaEnabled } = body

    if (action === "setup-password") {
      return await handleSetupPassword(token, password, mfaEnabled)
    } else if (action === "send-mfa") {
      return await handleSendMfa(email)
    } else if (action === "verify-mfa") {
      return await handleVerifyMfa(email, mfaCode)
    } else {
      // Default action: setup-password for backward compatibility
      return await handleSetupPassword(token, password, mfaEnabled)
    }
  } catch (error) {
    console.error("Error in verify-magic-link POST:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

async function handleSetupPassword(token: string, password: string, mfaEnabled?: boolean) {
  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
  }

  const verification = await verifyMagicLinkToken(token)
  
  if (!verification.valid) {
    return NextResponse.json({ error: verification.error }, { status: 400 })
  }

  // Hash the password
  const hashedPassword = await hashPassword(password)

  // Update user password in sheet
  const sheets = getSheetsClient()
  const usersResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "users!A:ZZ",
  })

  const users = usersResponse.data.values?.slice(1) || []
  const userIndex = users.findIndex(row => row[0] === verification.userId)

  if (userIndex === -1) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Update password (column 3, 0-indexed)
  const rowNumber = userIndex + 2 // +1 for header, +1 for 1-indexed
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `users!D${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[hashedPassword]]
    }
  })

  // Update MFA enabled status (column 5, 0-indexed)
  if (mfaEnabled !== undefined) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `users!F${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[mfaEnabled]]
      }
    })
  }

  // Update status to active (column 7, 0-indexed)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `users!H${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [["active"]]
    }
  })

  // Mark magic link as used
  await markMagicLinkAsUsed(token)

  return NextResponse.json({ 
    success: true, 
    message: "Password set up successfully",
    mfaEnabled: mfaEnabled || false
  })
}

async function handleSendMfa(email: string) {
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  // Generate 6-digit OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString()

  // Store OTP in sheet
  const sheets = getSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "otp_codes!A:ZZ",
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        uuidv4(), // id
        "", // user_id (will be filled when user logs in)
        code,
        new Date(Date.now() + 10 * 60 * 1000).toISOString(), // expires in 10 minutes
        "", // used_at (empty initially)
      ]]
    }
  })

  // In a real implementation, you would send the OTP via email/SMS
  console.log(`MFA Code for ${email}: ${code}`)

  return NextResponse.json({ 
    success: true, 
    message: "MFA code sent successfully",
    code // Only for testing - remove in production
  })
}

async function handleVerifyMfa(email: string, mfaCode: string) {
  if (!email || !mfaCode) {
    return NextResponse.json({ error: "Email and MFA code are required" }, { status: 400 })
  }

  // Verify OTP code
  const sheets = getSheetsClient()
  const otpResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "otp_codes!A:ZZ",
  })

  const otpCodes = otpResponse.data.values?.slice(1) || []
  const validCode = otpCodes.find(row => 
    row[2] === mfaCode && // code matches
    row[4] === "" && // not used yet
    new Date(row[3]) > new Date() // not expired
  )

  if (!validCode) {
    return NextResponse.json({ error: "Invalid or expired MFA code" }, { status: 400 })
  }

  // Mark OTP as used
  const codeIndex = otpCodes.findIndex(row => row[0] === validCode[0])
  const rowNumber = codeIndex + 2 // +1 for header, +1 for 1-indexed
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `otp_codes!E${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[new Date().toISOString()]]
    }
  })

  return NextResponse.json({ 
    success: true, 
    message: "MFA verification successful"
  })
}