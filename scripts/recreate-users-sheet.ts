import { config } from "dotenv"
import { getSheetsClient } from "../lib/google/auth"
import { hashPassword } from "../lib/auth/password"
import { v4 as uuidv4 } from "uuid"

// Load environment variables first
config()

async function recreateUsersSheet() {
  console.log("🔄 Recreating users sheet...")

  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    if (!SPREADSHEET_ID) {
      throw new Error("GOOGLE_SPREADSHEET_ID is not set in environment variables")
    }

    const sheets = getSheetsClient()

    // Step 1: Get spreadsheet info to find the users sheet ID
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })

    const usersSheet = spreadsheet.data.sheets?.find(sheet => 
      sheet.properties?.title === "users"
    )

    if (usersSheet) {
      console.log("🗑️ Deleting existing users sheet...")
      
      // Delete the users sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              deleteSheet: {
                sheetId: usersSheet.properties?.sheetId
              }
            }
          ]
        }
      })
      
      console.log("✅ Users sheet deleted")
    }

    // Step 2: Create new users sheet with correct structure
    console.log("📋 Creating new users sheet...")
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: "users",
              },
            },
          },
        ],
      },
    })

    // Step 3: Add headers
    const headers = [
      "id",
      "email", 
      "name",
      "hashed_password",
      "roles_json",
      "mfa_enabled",
      "last_login",
      "status",
      "invited_by",
      "invite_token",
      "invite_expiry",
      "created_at"
    ]

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A1:L1",
      valueInputOption: "RAW",
      requestBody: {
        values: [headers]
      }
    })

    console.log("✅ Users sheet created with headers:", headers.join(", "))

    // Step 4: Create super admin user
    console.log("\n👤 Creating super admin user...")
    
    const adminEmail = "dancangwe@gmail.com"
    const adminName = "Super Admin"
    const adminPassword = "Mayoza@24116817"
    
    const userId = uuidv4()
    const hashedPassword = await hashPassword(adminPassword)
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A:ZZ",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          userId,                    // id
          adminEmail,                // email
          adminName,                 // name
          hashedPassword,            // hashed_password
          JSON.stringify(["super_admin"]), // roles_json
          false,                     // mfa_enabled
          "",                        // last_login
          "active",                  // status
          "",                        // invited_by
          "",                        // invite_token
          "",                        // invite_expiry
          new Date().toISOString()   // created_at
        ]]
      }
    })

    console.log("✅ Super admin user created!")

    console.log("\n🎉 Users sheet recreation complete!")
    console.log("\n📋 Login Details:")
    console.log(`Email: ${adminEmail}`)
    console.log(`Password: ${adminPassword}`)
    console.log("\n🔗 Next Steps:")
    console.log("1. Go to http://localhost:3000/login")
    console.log("2. Login with the credentials above")
    console.log("3. You'll have full super admin access")

  } catch (error) {
    console.error("❌ Error recreating users sheet:", error)
    process.exit(1)
  }
}

recreateUsersSheet()
