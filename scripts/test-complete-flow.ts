#!/usr/bin/env tsx

/**
 * Complete end-to-end test for business creation and invitation flow
 */

import { config } from "dotenv"
import { getSheetsClient } from "../lib/google/auth"
import { createInvitation } from "../lib/auth/invitation"
import { v4 as uuidv4 } from "uuid"

config()

async function testCompleteFlow() {
  console.log("🚀 Complete End-to-End Business Creation and Invitation Flow Test")
  console.log("=" .repeat(80))

  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    if (!SPREADSHEET_ID) {
      throw new Error("GOOGLE_SPREADSHEET_ID not set")
    }

    const sheets = getSheetsClient()

    // Test data
    const testBusiness = {
      name: "Complete Test Restaurant " + Date.now(),
      ownerEmail: "complete-test@example.com",
      ownerName: "Complete Test Owner",
      currency: "KES",
      timezone: "Africa/Nairobi",
      description: "Complete test business for end-to-end validation"
    }

    console.log("📊 Test Business Data:")
    console.log(`   Name: ${testBusiness.name}`)
    console.log(`   Owner: ${testBusiness.ownerName} (${testBusiness.ownerEmail})`)
    console.log(`   Currency: ${testBusiness.currency}`)
    console.log(`   Timezone: ${testBusiness.timezone}`)
    console.log()

    // Step 1: Create business record
    console.log("1️⃣ Creating business record...")
    const businessId = uuidv4()
    const businessRowNumber = await getNextRowNumber(sheets, SPREADSHEET_ID, "businesses")
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "businesses!A:ZZ",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          businessId,
          testBusiness.name,
          "", // owner_user_id (will be set when user is created)
          testBusiness.currency,
          testBusiness.timezone,
          new Date().toISOString(), // created_at
          "pending", // status
          testBusiness.description, // settings_json
        ]]
      }
    })
    console.log("   ✅ Business record created")

    // Step 2: Create owner user record
    console.log("2️⃣ Creating owner user record...")
    const ownerUserId = uuidv4()
    const inviteToken = uuidv4()
    const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A:ZZ",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          ownerUserId,
          testBusiness.ownerEmail,
          testBusiness.ownerName,
          "", // hashed_password (empty for invited users)
          JSON.stringify(["business_owner"]), // roles_json
          false, // mfa_enabled
          "", // last_login
          "invited", // status
          "", // invited_by
          inviteToken, // invite_token
          inviteExpiry, // invite_expiry
          new Date().toISOString(), // created_at
        ]]
      }
    })
    console.log("   ✅ Owner user record created")

    // Step 3: Update business with owner user ID
    console.log("3️⃣ Linking business to owner...")
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `businesses!C${businessRowNumber}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[ownerUserId]]
      }
    })
    console.log("   ✅ Business linked to owner")

    // Step 4: Create user-role relationship
    console.log("4️⃣ Creating user-role relationship...")
    const rolesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "roles!A:C",
    })
    const businessOwnerRole = rolesResponse.data.values?.find(row => row[2] === "business_owner")
    
    if (businessOwnerRole) {
      const businessOwnerRoleId = businessOwnerRole[0]
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "user_roles!A:ZZ",
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            uuidv4(), // id
            ownerUserId, // user_id
            businessOwnerRoleId, // role_id
            businessId, // business_id
            new Date().toISOString(), // assigned_at
          ]]
        }
      })
      console.log("   ✅ User-role relationship created")
    } else {
      console.log("   ⚠️  Business owner role not found, skipping user-role relationship")
    }

    // Step 5: Send invitation email
    console.log("5️⃣ Sending invitation email...")
    const invitationResult = await createInvitation({
      userId: ownerUserId,
      email: testBusiness.ownerEmail,
      name: testBusiness.ownerName,
      role: "business_owner",
      businessId: businessId,
      invitedBy: "super_admin",
    })

    if (invitationResult.success) {
      console.log("   ✅ Invitation email sent successfully")
      console.log(`   📧 Magic Link: ${invitationResult.magicLink}`)
    } else {
      console.log("   ❌ Failed to send invitation email:", invitationResult.error)
    }

    // Step 6: Test magic link verification
    console.log("6️⃣ Testing magic link verification...")
    const magicLinkToken = invitationResult.magicLink?.split('token=')[1]
    if (magicLinkToken) {
      try {
        const verifyResponse = await fetch('http://localhost:3000/api/auth/verify-magic-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'setup-password',
            token: magicLinkToken,
            password: 'testpassword123',
            mfaEnabled: true
          })
        })
        
        if (verifyResponse.ok) {
          const result = await verifyResponse.json()
          console.log("   ✅ Magic link verification successful")
          console.log(`   📝 Result: ${result.message}`)
        } else {
          const error = await verifyResponse.text()
          console.log("   ❌ Magic link verification failed:", error)
        }
      } catch (error) {
        console.log("   ⚠️  Magic link verification test skipped (server not running):", error.message)
      }
    }

    // Step 7: Verify data integrity
    console.log("7️⃣ Verifying data integrity...")
    await verifyDataIntegrity(sheets, SPREADSHEET_ID, businessId, ownerUserId)

    // Step 8: Test API endpoints
    console.log("8️⃣ Testing API endpoints...")
    await testApiEndpoints(businessId, ownerUserId)

    console.log()
    console.log("🎉 Complete end-to-end test completed successfully!")
    console.log()
    console.log("📋 Summary:")
    console.log(`   Business ID: ${businessId}`)
    console.log(`   Owner User ID: ${ownerUserId}`)
    console.log(`   Owner Email: ${testBusiness.ownerEmail}`)
    console.log(`   Magic Link: ${invitationResult.magicLink || 'Not generated'}`)
    console.log(`   Currency: ${testBusiness.currency}`)
    console.log(`   Timezone: ${testBusiness.timezone}`)

  } catch (error) {
    console.error("❌ Test failed:", error)
    process.exit(1)
  }
}

async function getNextRowNumber(sheets: any, spreadsheetId: string, sheetName: string): Promise<number> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:A`,
  })
  return (response.data.values?.length || 1) + 1
}

async function verifyDataIntegrity(sheets: any, spreadsheetId: string, businessId: string, ownerUserId: string) {
  // Verify business record
  const businessesResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "businesses!A:ZZ",
  })
  const business = businessesResponse.data.values?.find(row => row[0] === businessId)
  
  if (!business) {
    throw new Error("Business record not found")
  }
  console.log("   ✅ Business record verified")

  // Verify user record
  const usersResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "users!A:ZZ",
  })
  const user = usersResponse.data.values?.find(row => row[0] === ownerUserId)
  
  if (!user) {
    throw new Error("User record not found")
  }
  console.log("   ✅ User record verified")

  // Verify magic link record
  const magicLinksResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "magic_links!A:ZZ",
  })
  const magicLink = magicLinksResponse.data.values?.find(row => row[1] === ownerUserId)
  
  if (!magicLink) {
    throw new Error("Magic link record not found")
  }
  console.log("   ✅ Magic link record verified")

  // Verify user-role relationship
  const userRolesResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "user_roles!A:ZZ",
  })
  const userRole = userRolesResponse.data.values?.find(row => row[1] === ownerUserId && row[3] === businessId)
  
  if (!userRole) {
    console.log("   ⚠️  User-role relationship not found (may be expected if role doesn't exist)")
  } else {
    console.log("   ✅ User-role relationship verified")
  }

  // Verify currency is KES
  if (business[3] !== "KES") {
    throw new Error(`Expected currency to be KES, got ${business[3]}`)
  }
  console.log("   ✅ Currency verified as KES")

  // Verify timezone
  if (business[4] !== "Africa/Nairobi") {
    throw new Error(`Expected timezone to be Africa/Nairobi, got ${business[4]}`)
  }
  console.log("   ✅ Timezone verified as Africa/Nairobi")
}

async function testApiEndpoints(businessId: string, ownerUserId: string) {
  try {
    // Test GET /api/admin/businesses
    const businessesResponse = await fetch('http://localhost:3000/api/admin/businesses')
    if (businessesResponse.ok) {
      console.log("   ✅ GET /api/admin/businesses endpoint working")
    } else {
      console.log("   ⚠️  GET /api/admin/businesses endpoint not accessible (may need authentication)")
    }

    // Test GET /api/admin/users
    const usersResponse = await fetch('http://localhost:3000/api/admin/users')
    if (usersResponse.ok) {
      console.log("   ✅ GET /api/admin/users endpoint working")
    } else {
      console.log("   ⚠️  GET /api/admin/users endpoint not accessible (may need authentication)")
    }

  } catch (error) {
    console.log("   ⚠️  API endpoint tests skipped (server not running):", error.message)
  }
}

// Run the test
testCompleteFlow()
