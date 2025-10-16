/**
 * Initialize Google Sheets with required tabs and headers
 * Run this script once to set up your spreadsheet structure
 *
 * Usage: npx tsx scripts/sheets-init.ts
 */

import { getSheetsClient } from "../lib/google/auth"
import { SHEET_COLUMNS } from "../lib/google/sheets"

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID

async function initializeSheets() {
  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SPREADSHEET_ID is not set in environment variables")
  }

  const sheets = getSheetsClient()

  console.log("Initializing XianFeast spreadsheet...")

  // Get existing sheets
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  })

  const existingSheets = spreadsheet.data.sheets?.map((s) => s.properties?.title) || []

  // Create sheets if they don't exist
  const sheetsToCreate = Object.keys(SHEET_COLUMNS).filter((name) => !existingSheets.includes(name))

  if (sheetsToCreate.length > 0) {
    console.log(`Creating sheets: ${sheetsToCreate.join(", ")}`)

    const requests = sheetsToCreate.map((sheetName) => ({
      addSheet: {
        properties: {
          title: sheetName,
        },
      },
    }))

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests },
    })
  }

  // Add headers to each sheet
  console.log("Adding headers to sheets...")

  for (const [sheetName, columns] of Object.entries(SHEET_COLUMNS)) {
    const range = `${sheetName}!A1:ZZ1`

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: [columns],
      },
    })

    console.log(`✓ ${sheetName}`)
  }

  // Seed a super admin user (optional)
  console.log("\nSeeding super admin user...")

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@xianfeast.com"
  const superAdminId = "super-admin-1"

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "users!A:ZZ",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [
          superAdminId,
          superAdminEmail,
          "Super Admin",
          "", // hashed_password (will be set on first login)
          JSON.stringify(["super_admin"]),
          "false", // mfa_enabled
          "",
          "invited",
          "",
          "",
          "",
          new Date().toISOString(),
        ],
      ],
    },
  })

  console.log(`✓ Super admin created: ${superAdminEmail}`)
  console.log("\n✅ Spreadsheet initialization complete!")
  console.log("\nNext steps:")
  console.log("1. Send magic link invite to super admin")
  console.log("2. Set up password and enable MFA")
  console.log("3. Start creating businesses and stalls")
}

initializeSheets().catch((error) => {
  console.error("Error initializing sheets:", error)
  process.exit(1)
})
