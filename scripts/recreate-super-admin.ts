#!/usr/bin/env tsx

/**
 * Recreate Super Admin User with proper Google Sheets integration
 */

import { config } from "dotenv"
import { getSheetsClient } from "../lib/google/auth"
import { hashPassword } from "../lib/auth/password"
import { v4 as uuidv4 } from "uuid"

config()

async function recreateSuperAdmin() {
  console.log("🔧 Recreating Super Admin User")
  console.log("=" .repeat(50))

  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    if (!SPREADSHEET_ID) {
      throw new Error("GOOGLE_SPREADSHEET_ID not set")
    }

    const sheets = getSheetsClient()

    // Super Admin details
    const superAdminData = {
      id: uuidv4(),
      email: "dancangwe@gmail.com",
      name: "Super Admin",
      password: "admin123",
      roles: ["super_admin"],
      businessId: null, // Super admin doesn't belong to a specific business
    }

    console.log("👤 Super Admin Details:")
    console.log(`   ID: ${superAdminData.id}`)
    console.log(`   Email: ${superAdminData.email}`)
    console.log(`   Name: ${superAdminData.name}`)
    console.log(`   Password: ${superAdminData.password}`)
    console.log(`   Roles: ${superAdminData.roles.join(', ')}`)

    // Hash password
    const hashedPassword = await hashPassword(superAdminData.password)
    console.log(`   Password Hash: ${hashedPassword.substring(0, 20)}...`)

    // Check if super admin already exists
    const usersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A:ZZ",
    })

    const users = usersResponse.data.values || []
    const existingSuperAdminIndex = users.findIndex((user, index) => {
      if (index === 0) return false // Skip header
      const roles = user[4] ? JSON.parse(user[4]) : []
      return roles.includes("super_admin")
    })

    if (existingSuperAdminIndex > 0) {
      console.log("🔄 Updating existing Super Admin...")
      
      // Update existing super admin
      const rowNumber = existingSuperAdminIndex + 1
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `users!A${rowNumber}:L${rowNumber}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            superAdminData.id,
            superAdminData.email,
            superAdminData.name,
            hashedPassword,
            JSON.stringify(superAdminData.roles),
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
      console.log("   ✅ Super Admin updated")
    } else {
      console.log("➕ Creating new Super Admin...")
      
      // Create new super admin
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "users!A:ZZ",
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            superAdminData.id,
            superAdminData.email,
            superAdminData.name,
            hashedPassword,
            JSON.stringify(superAdminData.roles),
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
      console.log("   ✅ Super Admin created")
    }

    // Ensure super_admin role exists in roles sheet
    console.log("🔐 Ensuring super_admin role exists...")
    
    const rolesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "roles!A:ZZ",
    })

    const roles = rolesResponse.data.values || []
    const superAdminRoleExists = roles.some((role, index) => {
      if (index === 0) return false // Skip header
      return role[2] === "super_admin" // Check name column
    })

    if (!superAdminRoleExists) {
      console.log("   ➕ Creating super_admin role...")
      
      const superAdminRoleId = uuidv4()
      const superAdminPermissions = [
        "business:read", "business:update", "business:disable",
        "stall:create", "stall:read", "stall:update", "stall:delete",
        "product:create", "product:update", "product:delete", "product:approve",
        "orders:create", "orders:view", "orders:fulfil", "orders:export",
        "users:invite", "users:role:update", "manage_webhooks"
      ]

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "roles!A:ZZ",
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            superAdminRoleId,
            "", // business_id (empty for global roles)
            "super_admin",
            superAdminPermissions.join(","),
            new Date().toISOString(), // created_at
          ]]
        }
      })
      console.log("   ✅ super_admin role created")
    } else {
      console.log("   ✅ super_admin role already exists")
    }

    // Ensure super_admin role exists in roles_permissions sheet
    console.log("🔐 Ensuring super_admin role permissions...")
    
    const rolePermissionsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "roles_permissions!A:ZZ",
    })

    const rolePermissions = rolePermissionsResponse.data.values || []
    const superAdminRolePermExists = rolePermissions.some((role, index) => {
      if (index === 0) return false // Skip header
      return role[2] === "super_admin" // Check role_name column
    })

    if (!superAdminRolePermExists) {
      console.log("   ➕ Creating super_admin role permissions...")
      
      const superAdminPermissions = [
        "business:read", "business:update", "business:disable",
        "stall:create", "stall:read", "stall:update", "stall:delete",
        "product:create", "product:update", "product:delete", "product:approve",
        "orders:create", "orders:view", "orders:fulfil", "orders:export",
        "users:invite", "users:role:update", "manage_webhooks"
      ]

      // Get super_admin role ID
      const superAdminRole = roles.find((role, index) => {
        if (index === 0) return false
        return role[2] === "super_admin"
      })
      const superAdminRoleId = superAdminRole ? superAdminRole[0] : uuidv4()

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "roles_permissions!A:ZZ",
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            superAdminRoleId,
            "", // business_id (empty for global roles)
            "super_admin",
            superAdminPermissions.join(","),
          ]]
        }
      })
      console.log("   ✅ super_admin role permissions created")
    } else {
      console.log("   ✅ super_admin role permissions already exist")
    }

    // Create user-role relationship
    console.log("🔗 Creating user-role relationship...")
    
    const userRolesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "user_roles!A:ZZ",
    })

    const userRoles = userRolesResponse.data.values || []
    const superAdminUserRoleExists = userRoles.some((userRole, index) => {
      if (index === 0) return false // Skip header
      return userRole[1] === superAdminData.id // Check user_id column
    })

    if (!superAdminUserRoleExists) {
      // Get super_admin role ID
      const superAdminRole = roles.find((role, index) => {
        if (index === 0) return false
        return role[2] === "super_admin"
      })
      const superAdminRoleId = superAdminRole ? superAdminRole[0] : uuidv4()

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "user_roles!A:ZZ",
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            uuidv4(), // id
            superAdminData.id, // user_id
            superAdminRoleId, // role_id
            "", // business_id (empty for super admin)
            new Date().toISOString(), // assigned_at
          ]]
        }
      })
      console.log("   ✅ User-role relationship created")
    } else {
      console.log("   ✅ User-role relationship already exists")
    }

    console.log()
    console.log("🎉 Super Admin recreated successfully!")
    console.log()
    console.log("🔑 Login Credentials:")
    console.log(`   Email: ${superAdminData.email}`)
    console.log(`   Password: ${superAdminData.password}`)
    console.log()
    console.log("⚠️  Please change the password after first login!")

  } catch (error) {
    console.error("❌ Error recreating super admin:", error)
    process.exit(1)
  }
}

recreateSuperAdmin()
