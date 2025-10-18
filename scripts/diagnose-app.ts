#!/usr/bin/env tsx

/**
 * Comprehensive Application Diagnostic Script
 */

import { config } from "dotenv"
import { getSheetsClient } from "../lib/google/auth"
import { queryRows, SHEET_COLUMNS } from "../lib/google/sheets-server"
import { verifyPassword } from "../lib/auth/password"

config()

async function runDiagnostics() {
  console.log("🔍 XianFeast Application Diagnostics")
  console.log("=" .repeat(50))

  try {
    // Test 1: Environment Variables
    console.log("1️⃣ Testing Environment Variables...")
    const requiredEnvVars = [
      'GOOGLE_SPREADSHEET_ID',
      'GOOGLE_SERVICE_ACCOUNT_EMAIL',
      'GOOGLE_PRIVATE_KEY',
      'JWT_SECRET',
      'REFRESH_SECRET'
    ]

    let envVarsOk = true
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`   ✅ ${envVar}: Set`)
      } else {
        console.log(`   ❌ ${envVar}: Missing`)
        envVarsOk = false
      }
    }

    if (!envVarsOk) {
      console.log("   ⚠️  Some environment variables are missing!")
      return
    }

    // Test 2: Google Sheets Connection
    console.log("\n2️⃣ Testing Google Sheets Connection...")
    try {
      const sheets = getSheetsClient()
      const response = await sheets.spreadsheets.get({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID
      })
      console.log(`   ✅ Connected to spreadsheet: ${response.data.properties?.title}`)
    } catch (error) {
      console.log(`   ❌ Google Sheets connection failed: ${error}`)
      return
    }

    // Test 3: Users Sheet
    console.log("\n3️⃣ Testing Users Sheet...")
    try {
      const users = await queryRows("users", SHEET_COLUMNS.users, () => true)
      console.log(`   ✅ Found ${users.length} users in the sheet`)
      
      if (users.length > 0) {
        const superAdmin = users.find(user => user.email === "dancangwe@gmail.com")
        if (superAdmin) {
          console.log(`   ✅ Super Admin found: ${superAdmin.name}`)
          console.log(`   📧 Email: ${superAdmin.email}`)
          console.log(`   🔐 Password Hash: ${superAdmin.hashed_password?.substring(0, 20)}...`)
          console.log(`   👤 Roles: ${superAdmin.roles_json}`)
          console.log(`   📊 Status: ${superAdmin.status}`)
        } else {
          console.log(`   ❌ Super Admin not found!`)
        }
      }
    } catch (error) {
      console.log(`   ❌ Users sheet test failed: ${error}`)
    }

    // Test 4: Password Verification
    console.log("\n4️⃣ Testing Password Verification...")
    try {
      const users = await queryRows("users", SHEET_COLUMNS.users, (user) => user.email === "dancangwe@gmail.com")
      if (users.length > 0) {
        const user = users[0]
        const isValid = await verifyPassword(user.hashed_password, "admin123")
        console.log(`   ${isValid ? '✅' : '❌'} Password verification: ${isValid ? 'SUCCESS' : 'FAILED'}`)
      } else {
        console.log(`   ❌ User not found for password test`)
      }
    } catch (error) {
      console.log(`   ❌ Password verification failed: ${error}`)
    }

    // Test 5: Session Token Generation
    console.log("\n5️⃣ Testing Session Token Generation...")
    try {
      const { createSessionToken } = await import("../lib/auth/session-server")
      const token = createSessionToken({
        userId: "test-user",
        email: "test@example.com",
        roles: ["user"],
        sessionId: "test-session"
      })
      console.log(`   ✅ Session token generated: ${token.substring(0, 20)}...`)
    } catch (error) {
      console.log(`   ❌ Session token generation failed: ${error}`)
    }

    // Test 6: API Endpoints
    console.log("\n6️⃣ Testing API Endpoints...")
    const endpoints = [
      { url: "http://localhost:3000/api/test", method: "GET" },
      { url: "http://localhost:3000/api/auth/login", method: "POST", body: { email: "dancangwe@gmail.com", password: "admin123" } }
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' },
          body: endpoint.body ? JSON.stringify(endpoint.body) : undefined
        })
        
        const status = response.status
        const statusText = response.statusText
        console.log(`   ${status < 400 ? '✅' : '❌'} ${endpoint.method} ${endpoint.url}: ${status} ${statusText}`)
        
        if (status >= 400) {
          const errorText = await response.text()
          console.log(`      Error: ${errorText.substring(0, 100)}...`)
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint.method} ${endpoint.url}: ${error}`)
      }
    }

    console.log("\n🎉 Diagnostics completed!")

  } catch (error) {
    console.error("❌ Diagnostic failed:", error)
    process.exit(1)
  }
}

runDiagnostics()
