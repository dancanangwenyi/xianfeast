import { NextRequest, NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/auth/middleware"
import { getSheetsClient } from "@/lib/google/auth"
import { hashPassword } from "@/lib/auth/password"
import { createInvitation } from "@/lib/auth/invitation"
import { v4 as uuidv4 } from "uuid"

/**
 * POST /api/admin/users/manage
 * Super Admin user management operations
 */
export async function POST(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { action, userId, email, newPassword, unlock, sendResetLink } = body

    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    if (!SPREADSHEET_ID) {
      return NextResponse.json({ error: "Spreadsheet ID not configured" }, { status: 500 })
    }

    const sheets = getSheetsClient()

    // Get user data
    const usersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A:ZZ",
    })

    const users = usersResponse.data.values?.slice(1) || []
    const userIndex = users.findIndex(row => row[0] === userId)
    
    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[userIndex]
    const rowNumber = userIndex + 2 // +1 for header, +1 for 1-indexed

    switch (action) {
      case "reset_password":
        if (!newPassword) {
          return NextResponse.json({ error: "New password is required" }, { status: 400 })
        }

        const hashedPassword = await hashPassword(newPassword)
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `users!D${rowNumber}`, // password column
          valueInputOption: "RAW",
          requestBody: {
            values: [[hashedPassword]]
          }
        })

        return NextResponse.json({
          success: true,
          message: "Password reset successfully"
        })

      case "unlock_account":
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `users!H${rowNumber}`, // status column
          valueInputOption: "RAW",
          requestBody: {
            values: [["active"]]
          }
        })

        return NextResponse.json({
          success: true,
          message: "Account unlocked successfully"
        })

      case "lock_account":
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `users!H${rowNumber}`, // status column
          valueInputOption: "RAW",
          requestBody: {
            values: [["disabled"]]
          }
        })

        return NextResponse.json({
          success: true,
          message: "Account locked successfully"
        })

      case "send_reset_link":
        if (!email) {
          return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        const invitationResult = await createInvitation({
          userId: user[0], // user id
          email: user[1], // user email
          name: user[2], // user name
          role: JSON.parse(user[4] || "[]")[0] || "user", // first role
          businessId: user[7] || "", // business_id
          invitedBy: "super_admin",
        })

        if (invitationResult.success) {
          return NextResponse.json({
            success: true,
            message: "Password reset link sent successfully",
            magicLink: invitationResult.magicLink
          })
        } else {
          return NextResponse.json({
            success: false,
            error: invitationResult.error
          }, { status: 500 })
        }

      case "enable_mfa":
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `users!F${rowNumber}`, // mfa_enabled column
          valueInputOption: "RAW",
          requestBody: {
            values: [[true]]
          }
        })

        return NextResponse.json({
          success: true,
          message: "MFA enabled successfully"
        })

      case "disable_mfa":
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `users!F${rowNumber}`, // mfa_enabled column
          valueInputOption: "RAW",
          requestBody: {
            values: [[false]]
          }
        })

        return NextResponse.json({
          success: true,
          message: "MFA disabled successfully"
        })

      case "update_roles":
        const { roles } = body
        if (!roles || !Array.isArray(roles)) {
          return NextResponse.json({ error: "Roles array is required" }, { status: 400 })
        }

        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `users!E${rowNumber}`, // roles_json column
          valueInputOption: "RAW",
          requestBody: {
            values: [[JSON.stringify(roles)]]
          }
        })

        return NextResponse.json({
          success: true,
          message: "Roles updated successfully"
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

  } catch (error) {
    console.error("Error in user management:", error)
    return NextResponse.json({ error: "User management operation failed" }, { status: 500 })
  }
}
