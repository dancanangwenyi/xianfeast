#!/usr/bin/env tsx

/**
 * Setup Super Admin User using DynamoDB
 */

import { config } from "dotenv"
import { createUser, createRole, createUserRole, getUserByEmail, getAllRoles } from "../lib/dynamodb/users"
import { hashPassword } from "../lib/auth/password"

config()

async function setupSuperAdmin() {
  console.log("🔧 Setting up Super Admin User")
  console.log("=".repeat(50))

  const email = process.env.SUPER_ADMIN_EMAIL
  const name = process.env.SUPER_ADMIN_NAME || "Super Admin"
  const password = process.env.SUPER_ADMIN_PASSWORD || "admin123"

  if (!email) {
    console.error("❌ SUPER_ADMIN_EMAIL environment variable is required")
    process.exit(1)
  }

  try {
    // Check if super admin already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      console.log("✅ Super Admin already exists:")
      console.log(`   Email: ${existingUser.email}`)
      console.log(`   Name: ${existingUser.name}`)
      console.log(`   Status: ${existingUser.status}`)
      return
    }

    // Hash the password
    const hashedPassword = await hashPassword(password)

    console.log("👤 Creating Super Admin user...")
    console.log(`   Email: ${email}`)
    console.log(`   Name: ${name}`)
    console.log(`   Password: ${password}`)

    // Create super admin user
    const user = await createUser({
      email,
      name,
      hashed_password: hashedPassword,
      roles_json: JSON.stringify(["super_admin"]),
      mfa_enabled: false,
      status: "active",
    })

    // Check if super admin role exists, create if not
    console.log("🔧 Checking super admin role...")
    const allRoles = await getAllRoles()
    let superAdminRole = allRoles.find(role => role.role_name === "super_admin")

    if (!superAdminRole) {
      console.log("🔧 Creating super admin role...")
      superAdminRole = await createRole({
        business_id: "global",
        role_name: "super_admin",
        permissions_csv: "admin.all,users.manage,businesses.manage,system.manage",
      })
    } else {
      console.log("✅ Super admin role already exists")
    }

    // Assign super admin role to user
    console.log("🔗 Assigning super admin role...")
    await createUserRole({
      user_id: user.id,
      role_id: superAdminRole.id,
      business_id: "global",
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
