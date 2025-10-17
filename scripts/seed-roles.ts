/**
 * Seed predefined roles and permissions into the system
 * Run this after initializing sheets to set up the RBAC system
 */

import { config } from "dotenv"
import { getSheetsClient } from "../lib/google/auth"
import { v4 as uuidv4 } from "uuid"

// Load environment variables
config()

const PREDEFINED_ROLES = {
  super_admin: [
    "business:read",
    "business:update", 
    "business:disable",
    "stall:create",
    "stall:update",
    "stall:delete",
    "product:create",
    "product:update",
    "product:delete",
    "product:approve",
    "orders:create",
    "orders:view",
    "orders:fulfil",
    "orders:export",
    "users:invite",
    "users:role:update",
  ],
  business_owner: [
    "business:read",
    "business:update",
    "stall:create",
    "stall:update",
    "stall:delete",
    "product:create",
    "product:update",
    "product:delete",
    "product:approve",
    "orders:view",
    "orders:fulfil",
    "orders:export",
    "users:invite",
    "users:role:update",
  ],
  stall_manager: [
    "stall:read",
    "stall:update",
    "product:create",
    "product:update",
    "product:approve",
    "orders:view",
    "orders:fulfil",
    "users:invite",
  ],
  menu_editor: [
    "product:create",
    "product:update",
    "orders:view",
  ],
  order_fulfiller: [
    "orders:view",
    "orders:fulfil",
  ],
  customer: [
    "orders:create",
    "orders:view",
  ],
}

async function seedRoles() {
  console.log("🌱 Seeding predefined roles and permissions...")

  const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SPREADSHEET_ID is not set in environment variables")
  }

  const sheets = getSheetsClient()

  try {
    // Check if roles already exist
    const existingRolesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "roles_permissions!C:C", // Check 'role_name' column
    })
    const existingRoleNames = existingRolesResponse.data.values?.flat() || []

    // Create roles that don't exist
    for (const [roleName, permissions] of Object.entries(PREDEFINED_ROLES)) {
      if (!existingRoleNames.includes(roleName)) {
        const roleId = uuidv4()
        const permissionsCsv = permissions.join(",")

        // Add to roles sheet
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: "roles!A:ZZ",
          valueInputOption: "RAW",
          requestBody: {
            values: [[
              roleId,
              "", // business_id (empty for global roles)
              roleName,
              permissionsCsv,
              new Date().toISOString(),
            ]]
          }
        })

        // Add to roles_permissions sheet
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: "roles_permissions!A:ZZ",
          valueInputOption: "RAW",
          requestBody: {
            values: [[
              roleId,
              "", // business_id (empty for global roles)
              roleName,
              permissionsCsv,
            ]]
          }
        })

        console.log(`✅ Created role: ${roleName}`)
      } else {
        console.log(`☑️ Role "${roleName}" already exists`)
      }
    }

    console.log("\n🎉 Role seeding complete!")
    console.log("\n📋 Created Roles:")
    for (const roleName in PREDEFINED_ROLES) {
      console.log(`  - ${roleName}: ${PREDEFINED_ROLES[roleName as keyof typeof PREDEFINED_ROLES].length} permissions`)
    }

  } catch (error) {
    console.error("❌ Error seeding roles:", error)
    process.exit(1)
  }
}

seedRoles()
