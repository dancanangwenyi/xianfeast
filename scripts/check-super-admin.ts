#!/usr/bin/env tsx

/**
 * Check Super Admin User Details
 */

import { config } from "dotenv"
import { getSheetsClient } from "../lib/google/auth"
import { verifyPassword } from "../lib/auth/password"

config()

async function checkSuperAdmin() {
  console.log("🔍 Checking Super Admin User Details")
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

    const users = usersResponse.data.values?.slice(1) || []
    const superAdmin = users.find(user => {
      const roles = user[4] ? JSON.parse(user[4]) : []
      return roles.includes("super_admin")
    })

    if (!superAdmin) {
      console.log("❌ No Super Admin found")
      return
    }

    console.log("👤 Super Admin Details:")
    console.log(`   ID: ${superAdmin[0]}`)
    console.log(`   Email: ${superAdmin[1]}`)
    console.log(`   Name: ${superAdmin[2]}`)
    console.log(`   Password Hash: ${superAdmin[3] ? superAdmin[3].substring(0, 20) + '...' : 'None'}`)
    console.log(`   Roles: ${superAdmin[4]}`)
    console.log(`   MFA Enabled: ${superAdmin[5]}`)
    console.log(`   Last Login: ${superAdmin[6] || 'Never'}`)
    console.log(`   Status: ${superAdmin[7]}`)
    console.log(`   Created: ${superAdmin[11]}`)

    // Test password verification
    console.log()
    console.log("🔐 Testing Password Verification:")
    const testPasswords = ["admin123", "password", "123456", "admin"]
    
    for (const password of testPasswords) {
      try {
        const isValid = await verifyPassword(password, superAdmin[3])
        console.log(`   "${password}": ${isValid ? '✅ Valid' : '❌ Invalid'}`)
        if (isValid) {
          console.log(`   🎉 Found working password: "${password}"`)
          break
        }
      } catch (error) {
        console.log(`   "${password}": ❌ Error - ${error.message}`)
      }
    }

  } catch (error) {
    console.error("❌ Error checking super admin:", error)
    process.exit(1)
  }
}

checkSuperAdmin()
