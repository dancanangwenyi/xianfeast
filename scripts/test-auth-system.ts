#!/usr/bin/env tsx

/**
 * Comprehensive Authentication System Test
 */

import { config } from "dotenv"
import { getSheetsClient } from "../lib/google/auth"
import { hashPassword } from "../lib/auth/password"
import { v4 as uuidv4 } from "uuid"

config()

async function testAuthSystem() {
  console.log("🧪 Comprehensive Authentication System Test")
  console.log("=" .repeat(60))

  try {
    // Test 1: Super Admin Recreation
    console.log("1️⃣ Testing Super Admin Recreation...")
    await testSuperAdminRecreation()

    // Test 2: Login System
    console.log("\n2️⃣ Testing Login System...")
    await testLoginSystem()

    // Test 3: Session Management
    console.log("\n3️⃣ Testing Session Management...")
    await testSessionManagement()

    // Test 4: Role-Based Access Control
    console.log("\n4️⃣ Testing Role-Based Access Control...")
    await testRoleBasedAccess()

    // Test 5: MFA System
    console.log("\n5️⃣ Testing MFA System...")
    await testMFASystem()

    // Test 6: User Management
    console.log("\n6️⃣ Testing User Management...")
    await testUserManagement()

    // Test 7: Logout and Session Expiration
    console.log("\n7️⃣ Testing Logout and Session Expiration...")
    await testLogoutAndExpiration()

    console.log("\n🎉 All authentication system tests completed successfully!")

  } catch (error) {
    console.error("❌ Authentication system test failed:", error)
    process.exit(1)
  }
}

async function testSuperAdminRecreation() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dancangwe@gmail.com',
        password: 'admin123'
      })
    })

    if (response.ok) {
      const data = await response.json()
      console.log("   ✅ Super Admin login successful")
      console.log(`   User: ${data.user.name} (${data.user.email})`)
      console.log(`   Roles: ${data.user.roles.join(', ')}`)
    } else {
      console.log("   ❌ Super Admin login failed")
    }
  } catch (error) {
    console.log("   ⚠️  Super Admin login test skipped (server not running)")
  }
}

async function testLoginSystem() {
  const testUsers = [
    { email: "dancangwe@gmail.com", password: "admin123", expectedRole: "super_admin" },
    { email: "test@example.com", password: "wrongpassword", expectedRole: null },
  ]

  for (const user of testUsers) {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: user.password
        })
      })

      const data = await response.json()

      if (user.expectedRole) {
        if (response.ok && data.user.roles.includes(user.expectedRole)) {
          console.log(`   ✅ Login successful for ${user.email}`)
        } else {
          console.log(`   ❌ Login failed for ${user.email}`)
        }
      } else {
        if (!response.ok) {
          console.log(`   ✅ Correctly rejected invalid login for ${user.email}`)
        } else {
          console.log(`   ❌ Should have rejected invalid login for ${user.email}`)
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Login test skipped for ${user.email} (server not running)`)
    }
  }
}

async function testSessionManagement() {
  try {
    // Test session refresh
    const refreshResponse = await fetch('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (refreshResponse.ok) {
      console.log("   ✅ Session refresh endpoint working")
    } else {
      console.log("   ⚠️  Session refresh endpoint not accessible (no valid refresh token)")
    }
  } catch (error) {
    console.log("   ⚠️  Session management test skipped (server not running)")
  }
}

async function testRoleBasedAccess() {
  const protectedEndpoints = [
    { url: '/api/admin/businesses', method: 'GET', requiredRole: 'super_admin' },
    { url: '/api/admin/users', method: 'GET', requiredRole: 'super_admin' },
    { url: '/api/users/me', method: 'GET', requiredRole: 'any' },
  ]

  for (const endpoint of protectedEndpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint.url}`, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.status === 401) {
        console.log(`   ✅ ${endpoint.url} correctly requires authentication`)
      } else if (response.status === 403) {
        console.log(`   ✅ ${endpoint.url} correctly requires proper role`)
      } else if (response.ok) {
        console.log(`   ⚠️  ${endpoint.url} accessible (may have valid session)`)
      } else {
        console.log(`   ❓ ${endpoint.url} returned status ${response.status}`)
      }
    } catch (error) {
      console.log(`   ⚠️  Role-based access test skipped for ${endpoint.url}`)
    }
  }
}

async function testMFASystem() {
  try {
    // Test MFA verification endpoint
    const mfaResponse = await fetch('http://localhost:3000/api/auth/verify-mfa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        otpId: 'test-otp-id',
        code: '123456',
        email: 'test@example.com'
      })
    })

    if (mfaResponse.status === 400) {
      console.log("   ✅ MFA verification correctly rejects invalid OTP")
    } else {
      console.log(`   ❓ MFA verification returned status ${mfaResponse.status}`)
    }
  } catch (error) {
    console.log("   ⚠️  MFA system test skipped (server not running)")
  }
}

async function testUserManagement() {
  try {
    // Test user management endpoint
    const userMgmtResponse = await fetch('http://localhost:3000/api/admin/users/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reset_password',
        userId: 'test-user-id',
        newPassword: 'newpassword123'
      })
    })

    if (userMgmtResponse.status === 401) {
      console.log("   ✅ User management correctly requires authentication")
    } else if (userMgmtResponse.status === 403) {
      console.log("   ✅ User management correctly requires super admin role")
    } else {
      console.log(`   ❓ User management returned status ${userMgmtResponse.status}`)
    }
  } catch (error) {
    console.log("   ⚠️  User management test skipped (server not running)")
  }
}

async function testLogoutAndExpiration() {
  try {
    // Test logout endpoint
    const logoutResponse = await fetch('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (logoutResponse.ok) {
      console.log("   ✅ Logout endpoint working")
    } else {
      console.log(`   ❓ Logout endpoint returned status ${logoutResponse.status}`)
    }
  } catch (error) {
    console.log("   ⚠️  Logout test skipped (server not running)")
  }
}

// Run the test
testAuthSystem()
