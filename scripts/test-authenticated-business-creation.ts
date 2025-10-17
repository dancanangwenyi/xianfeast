#!/usr/bin/env tsx

/**
 * Test Business Creation with Authentication
 */

import { config } from "dotenv"
import { getSheetsClient } from "../lib/google/auth"
import { createInvitation } from "../lib/auth/invitation"
import { v4 as uuidv4 } from "uuid"

config()

async function testAuthenticatedBusinessCreation() {
  console.log("🧪 Testing Authenticated Business Creation")
  console.log("=" .repeat(60))

  try {
    // First, let's simulate what happens when a user is logged in
    console.log("1️⃣ Simulating login session...")
    
    // Get session token (this would normally come from login)
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dancangwe@gmail.com',
        password: 'admin123'
      })
    })

    if (!loginResponse.ok) {
      throw new Error('Login failed')
    }

    const loginData = await loginResponse.json()
    console.log("   ✅ Login successful")
    console.log(`   User: ${loginData.user.name} (${loginData.user.email})`)
    console.log(`   Roles: ${loginData.user.roles.join(', ')}`)

    // Extract session cookie from response
    const setCookieHeader = loginResponse.headers.get('set-cookie')
    if (!setCookieHeader) {
      throw new Error('No session cookie received')
    }

    const sessionCookie = setCookieHeader.split(';')[0]
    console.log(`   Session Cookie: ${sessionCookie.substring(0, 50)}...`)

    // Now test business creation with authentication
    console.log()
    console.log("2️⃣ Testing business creation with authentication...")
    
    const businessData = {
      name: "Authenticated Test Business " + Date.now(),
      ownerEmail: "auth-test@example.com",
      ownerName: "Auth Test Owner",
      currency: "KES",
      timezone: "Africa/Nairobi",
      description: "Test business created with authentication"
    }

    console.log("📊 Business Data:")
    console.log(`   Name: ${businessData.name}`)
    console.log(`   Owner: ${businessData.ownerName} (${businessData.ownerEmail})`)

    const businessResponse = await fetch('http://localhost:3000/api/admin/businesses', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(businessData)
    })

    if (!businessResponse.ok) {
      const errorText = await businessResponse.text()
      throw new Error(`Business creation failed: ${businessResponse.status} - ${errorText}`)
    }

    const businessResult = await businessResponse.json()
    console.log("   ✅ Business created successfully!")
    console.log(`   Business ID: ${businessResult.businessId}`)
    console.log(`   Owner User ID: ${businessResult.ownerUserId}`)
    console.log(`   Message: ${businessResult.message}`)

    // Verify the business was created in Google Sheets
    console.log()
    console.log("3️⃣ Verifying business in Google Sheets...")
    
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    if (!SPREADSHEET_ID) {
      throw new Error("GOOGLE_SPREADSHEET_ID not set")
    }

    const sheets = getSheetsClient()
    const businessesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "businesses!A:ZZ",
    })

    const businesses = businessesResponse.data.values?.slice(1) || []
    const createdBusiness = businesses.find(b => b[0] === businessResult.businessId)
    
    if (createdBusiness) {
      console.log("   ✅ Business found in Google Sheets")
      console.log(`   Name: ${createdBusiness[1]}`)
      console.log(`   Currency: ${createdBusiness[3]}`)
      console.log(`   Timezone: ${createdBusiness[4]}`)
      console.log(`   Status: ${createdBusiness[6]}`)
    } else {
      console.log("   ❌ Business not found in Google Sheets")
    }

    // Check if magic link was created
    console.log()
    console.log("4️⃣ Checking magic link creation...")
    
    const magicLinksResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "magic_links!A:ZZ",
    })

    const magicLinks = magicLinksResponse.data.values?.slice(1) || []
    const createdMagicLink = magicLinks.find(m => m[1] === businessResult.ownerUserId)
    
    if (createdMagicLink) {
      console.log("   ✅ Magic link created")
      console.log(`   Token: ${createdMagicLink[2].substring(0, 20)}...`)
      console.log(`   Expires: ${createdMagicLink[3]}`)
    } else {
      console.log("   ❌ Magic link not found")
    }

    console.log()
    console.log("🎉 Authenticated business creation test completed successfully!")
    console.log()
    console.log("📋 Summary:")
    console.log(`   Business ID: ${businessResult.businessId}`)
    console.log(`   Owner User ID: ${businessResult.ownerUserId}`)
    console.log(`   Owner Email: ${businessData.ownerEmail}`)
    console.log(`   Currency: ${businessData.currency}`)
    console.log(`   Timezone: ${businessData.timezone}`)

  } catch (error) {
    console.error("❌ Test failed:", error)
    process.exit(1)
  }
}

testAuthenticatedBusinessCreation()
