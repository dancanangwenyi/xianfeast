import { NextRequest, NextResponse } from "next/server"
import { verifyOTP } from "@/lib/auth/mfa"
import { getSheetsClient } from "@/lib/google/auth"
import { setSessionCookies } from "@/lib/auth/session"

/**
 * POST /api/auth/verify-mfa
 * Verify MFA OTP code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { otpId, code, email } = body

    if (!otpId || !code) {
      return NextResponse.json({ error: "OTP ID and code are required" }, { status: 400 })
    }

    // Verify OTP
    const isValid = await verifyOTP(otpId, code)
    
    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired OTP code" }, { status: 400 })
    }

    // Get user data
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    if (!SPREADSHEET_ID) {
      return NextResponse.json({ error: "Spreadsheet ID not configured" }, { status: 500 })
    }

    const sheets = getSheetsClient()
    const usersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A:ZZ",
    })

    const users = usersResponse.data.values?.slice(1) || []
    const user = users.find(row => row[1] === email) // Find by email

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is active
    if (user[7] !== "active") {
      return NextResponse.json({ error: "Account is not active" }, { status: 401 })
    }

    // Create session
    const roles = JSON.parse(user[4] || "[]")
    await setSessionCookies({
      userId: user[0],
      email: user[1],
      roles,
      businessId: user[8] || undefined,
    })

    // Update last login
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `users!G${users.findIndex(row => row[0] === user[0]) + 2}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[new Date().toISOString()]]
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user[0],
        email: user[1],
        name: user[2],
        roles,
      },
    })

  } catch (error) {
    console.error("Error verifying MFA:", error)
    return NextResponse.json({ error: "MFA verification failed" }, { status: 500 })
  }
}