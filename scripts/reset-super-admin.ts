#!/usr/bin/env tsx

/**
 * Reset Super Admin Password
 */

import { config } from "dotenv"
import { getSheetsClient } from "../lib/google/auth"
import { hashPassword } from "../lib/auth/password"
import { v4 as uuidv4 } from "uuid"

config()

async function resetSuperAdmin() {
  console.log("🔄 Resetting Super Admin Password")
  console.log("=" .repeat(50))

  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    if (!SPREADSHEET_ID) {
      throw new Error("GOOGLE_SPREADSHEET_ID not set")
    }

    const sheets = getSheetsClient()

    // Get all users
    const usersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A:ZZ",
    })

    const users = usersResponse.data.values || []
    const superAdminIndex = users.findIndex((user, index) => {
      if (index === 0) return false // Skip header
      const roles = user[4] ? JSON.parse(user[4]) : []
      return roles.includes("super_admin")
    })

    if (superAdminIndex === -1) {
      console.log("❌ No Super Admin found")
      return
    }

    // Reset password
    const newPassword = "admin123"
    const hashedPassword = await hashPassword(newPassword)
    
    console.log("🔐 Setting new password...")
    console.log(`   New Password: ${newPassword}`)
    console.log(`   Hash: ${hashedPassword.substring(0, 20)}...`)

    // Update password in sheet (column D, 0-indexed)
    const rowNumber = superAdminIndex + 1
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `users!D${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[hashedPassword]]
      }
    })

    console.log("✅ Super Admin password reset successfully!")
    console.log()
    console.log("🔑 New Login Credentials:")
    console.log(`   Email: dancangwe@gmail.com`)
    console.log(`   Password: ${newPassword}`)

  } catch (error) {
    console.error("❌ Error resetting super admin:", error)
    process.exit(1)
  }
}

resetSuperAdmin()
