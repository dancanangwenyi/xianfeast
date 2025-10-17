import { NextRequest, NextResponse } from "next/server"
import { getSheetsClient } from "@/lib/google/auth"
import { v4 as uuidv4 } from "uuid"

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID

/**
 * POST /api/auth/send-mfa
 * Send MFA code to user's email
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

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

    // Mock email sending - in production, integrate with email service
    console.log(`📧 MFA Code sent to ${email}: ${code}`)

    return NextResponse.json({ success: true, message: "MFA code sent" })
  } catch (error) {
    console.error("Error sending MFA:", error)
    return NextResponse.json({ error: "Failed to send MFA code" }, { status: 500 })
  }
}
