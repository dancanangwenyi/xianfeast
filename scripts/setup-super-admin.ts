#!/usr/bin/env tsx

/**
 * Setup Super Admin User
 */

import { config } from "dotenv"
import { getSheetsClient } from "../lib/google/auth"
import { hashPassword } from "../lib/auth/password"
import { v4 as uuidv4 } from "uuid"

config()

async function setupSuperAdmin() {
  console.log("🔧 Setting up Super Admin User")
  console.log("=" .repeat(50))

  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    if (!SPREADSHEET_ID) {
      throw new Error("GOOGLE_SPREADSHEET_ID not set")
    }

    const sheets = getSheetsClient()

    // Check if super admin already exists
    const usersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A:ZZ",
    })

    const users = usersResponse.data.values?.slice(1) || []
    const existingSuperAdmin = users.find(user => {
      const roles = user[4] ? JSON.parse(user[4]) : []
      return roles.includes("super_admin")
    })

    if (existingSuperAdmin) {
      console.log("✅ Super Admin already exists:")
      console.log(`   Email: ${existingSuperAdmin[1]}`)
      console.log(`   Name: ${existingSuperAdmin[2]}`)
      console.log(`   Status: ${existingSuperAdmin[7]}`)
      return
    }

    // Create super admin user
    const superAdminId = uuidv4()
    const email = "dancangwe@gmail.com"
    const name = "Super Admin"
    const password = "admin123" // Change this in production
    const hashedPassword = await hashPassword(password)

    console.log("👤 Creating Super Admin user...")
    console.log(`   Email: ${email}`)
    console.log(`   Name: ${name}`)
    console.log(`   Password: ${password}`)

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A:ZZ",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          superAdminId,
          email,
          name,
          hashedPassword,
          JSON.stringify(["super_admin"]),
          false, // mfa_enabled
          new Date().toISOString(), // last_login
          "active", // status
          "", // invited_by
          "", // invite_token
          "", // invite_expiry
          new Date().toISOString(), // created_at
        ]]
      }
    })

    console.log("✅ Super Admin created successfully!")
    console.log()
    console.log("🔑 Login Credentials:")
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log()
    console.log("⚠️  Please change the password after first login!")

  } catch (error) {
    console.error("❌ Error setting up super admin:", error)
    process.exit(1)
  }
}

setupSuperAdmin()
