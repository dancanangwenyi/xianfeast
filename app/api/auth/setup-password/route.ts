import { NextRequest, NextResponse } from "next/server"
import { verifyMagicLinkToken, markMagicLinkAsUsed } from "@/lib/auth/invitation"
import { hashPassword } from "@/lib/auth/password"
import { getSheetsClient } from "@/lib/google/auth"
import { v4 as uuidv4 } from "uuid"

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID

/**
 * POST /api/auth/setup-password
 * Set up password for a user via magic link
 */
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

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

    // Update status to active (column 7, 0-indexed)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `users!H${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [["active"]]
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error setting up password:", error)
    return NextResponse.json({ error: "Failed to set up password" }, { status: 500 })
  }
}
