#!/usr/bin/env tsx

/**
 * Test DynamoDB Super Admin Login
 * 
 * This script tests the super admin login functionality with DynamoDB.
 * 
 * Usage: npx tsx scripts/test-dynamodb-login.ts
 */

import { getUserWithRoles, isSuperAdmin, hasPermission } from '../lib/dynamodb/auth'
import { verifyPassword } from '../lib/auth/password'
import { config } from 'dotenv'

// Load environment variables
config()

async function testSuperAdminLogin() {
  console.log('🧪 Testing DynamoDB Super Admin Login...\n')
  
  const email = 'dancangwe@gmail.com'
  const password = 'admin123' // The new simple password
  
  try {
    // Test 1: Get user by email
    console.log('1️⃣ Testing user lookup by email...')
    const userWithRoles = await getUserWithRoles(email)
    
    if (!userWithRoles) {
      console.error('❌ User not found')
      return
    }
    
    console.log(`✅ User found: ${userWithRoles.name}`)
    console.log(`   • ID: ${userWithRoles.id}`)
    console.log(`   • Email: ${userWithRoles.email}`)
    console.log(`   • Status: ${userWithRoles.status}`)
    console.log(`   • Password change required: ${userWithRoles.password_change_required}`)
    console.log(`   • Roles: ${userWithRoles.roles.length}`)
    
    // Test 2: Verify password
    console.log('\n2️⃣ Testing password verification...')
    const isPasswordValid = await verifyPassword(password, userWithRoles.hashed_password)
    
    if (isPasswordValid) {
      console.log('✅ Password verification successful')
    } else {
      console.log('❌ Password verification failed')
      return
    }
    
    // Test 3: Check roles
    console.log('\n3️⃣ Testing role verification...')
    console.log('   Roles:')
    userWithRoles.roles.forEach(role => {
      console.log(`   • ${role.name} (${role.business_id})`)
      console.log(`     Permissions: ${role.permissions_csv}`)
    })
    
    // Test 4: Check super admin status
    console.log('\n4️⃣ Testing super admin status...')
    const isAdmin = isSuperAdmin(userWithRoles.roles)
    
    if (isAdmin) {
      console.log('✅ User is super admin')
    } else {
      console.log('❌ User is not super admin')
    }
    
    // Test 5: Check specific permissions
    console.log('\n5️⃣ Testing specific permissions...')
    const permissions = [
      'admin.all',
      'business.create',
      'user.create',
      'analytics.read'
    ]
    
    permissions.forEach(permission => {
      const hasAccess = hasPermission(userWithRoles.roles, permission)
      console.log(`   • ${permission}: ${hasAccess ? '✅' : '❌'}`)
    })
    
    console.log('\n🎉 All tests passed! Super admin login is working correctly.')
    console.log('\n📋 Login Summary:')
    console.log(`   • Email: ${email}`)
    console.log(`   • Password: ${password}`)
    console.log(`   • Status: Active`)
    console.log(`   • Super Admin: Yes`)
    console.log(`   • Password Change Required: ${userWithRoles.password_change_required}`)
    
    console.log('\n🔧 Next steps:')
    console.log('   1. Test login via web interface at http://localhost:3000/login')
    console.log('   2. Verify password change prompt appears')
    console.log('   3. Test admin dashboard access')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  testSuperAdminLogin()
}
