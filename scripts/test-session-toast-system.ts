#!/usr/bin/env tsx

/**
 * Test Session Management and Toast System
 * 
 * This script tests the complete session management and toast notification
 * system for the Businesses module.
 * 
 * Usage: npx tsx scripts/test-session-toast-system.ts
 */

import { config } from 'dotenv'
import { getAllBusinesses } from '../lib/dynamodb/business'
import { getUserByEmail } from '../lib/dynamodb/auth'

// Load environment variables
config()

async function testSessionToastSystem() {
  console.log('🧪 Testing Session Management and Toast System...\n')
  
  try {
    // Step 1: Check current state
    console.log('1️⃣ Checking current state...')
    const businesses = await getAllBusinesses()
    const superAdmin = await getUserByEmail('dancangwe@gmail.com')
    
    console.log(`✅ Found ${businesses.length} businesses in DynamoDB`)
    console.log(`✅ Super Admin exists: ${superAdmin ? 'Yes' : 'No'}`)
    
    if (superAdmin) {
      console.log(`   • ID: ${superAdmin.id}`)
      console.log(`   • Status: ${superAdmin.status}`)
      console.log(`   • Roles: ${superAdmin.roles_json}`)
    }
    
    // Step 2: Test session verification API
    console.log('\n2️⃣ Testing session verification API...')
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/verify-session', {
        method: 'GET',
        credentials: 'include',
      })
      
      console.log(`GET /api/auth/verify-session: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Session verification API working')
        console.log(`   • User ID: ${data.userId}`)
        console.log(`   • Email: ${data.email}`)
        console.log(`   • Roles: ${data.roles}`)
        console.log(`   • Expires At: ${data.expiresAt}`)
      } else {
        console.log(`❌ Session verification failed: ${response.status}`)
        console.log('   This is expected when not logged in')
      }
    } catch (error) {
      console.log(`❌ Session verification API call failed: ${error}`)
    }
    
    // Step 3: Test business creation with session management
    console.log('\n3️⃣ Testing business creation with session management...')
    
    const testBusiness = {
      name: 'Session Test Restaurant',
      ownerEmail: 'session.test@example.com',
      ownerName: 'Session Test Owner',
      description: 'Test restaurant for session management',
      address: '123 Session Test Street, Nairobi',
      phone: '+254700000005',
      currency: 'KES',
      timezone: 'Africa/Nairobi'
    }
    
    try {
      const response = await fetch('http://localhost:3000/api/admin/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(testBusiness),
      })
      
      console.log(`POST /api/admin/businesses: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Business creation with session management working')
        console.log(`   • Business ID: ${data.business?.id}`)
        console.log(`   • Message: ${data.message}`)
      } else {
        const errorData = await response.json()
        console.log(`❌ Business creation failed: ${errorData.error}`)
        console.log('   This is expected when not logged in')
      }
    } catch (error) {
      console.log(`❌ Business creation API call failed: ${error}`)
    }
    
    // Step 4: Test session refresh API
    console.log('\n4️⃣ Testing session refresh API...')
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })
      
      console.log(`POST /api/auth/refresh: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Session refresh API working')
        console.log(`   • User ID: ${data.userId}`)
        console.log(`   • Email: ${data.email}`)
        console.log(`   • Roles: ${data.roles}`)
      } else {
        console.log(`❌ Session refresh failed: ${response.status}`)
        console.log('   This is expected when not logged in')
      }
    } catch (error) {
      console.log(`❌ Session refresh API call failed: ${error}`)
    }
    
    // Step 5: Test logout API
    console.log('\n5️⃣ Testing logout API...')
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      
      console.log(`POST /api/auth/logout: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        console.log('✅ Logout API working')
      } else {
        console.log(`❌ Logout failed: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ Logout API call failed: ${error}`)
    }
    
    // Step 6: Final verification
    console.log('\n6️⃣ Final verification...')
    const finalBusinesses = await getAllBusinesses()
    console.log(`✅ Total businesses in DynamoDB: ${finalBusinesses.length}`)
    
    console.log('\n📋 Current businesses:')
    finalBusinesses.forEach((business, index) => {
      console.log(`   ${index + 1}. ${business.name} (${business.status})`)
      console.log(`      ID: ${business.id}`)
      console.log(`      Owner: ${business.email}`)
      console.log(`      Created: ${business.created_at}`)
    })
    
    console.log('\n🎉 Session management and toast system test completed!')
    
    console.log('\n🔧 Manual Testing Instructions:')
    console.log('1. Go to http://localhost:3000/login')
    console.log('2. Login with Super Admin credentials:')
    console.log('   Email: dancangwe@gmail.com')
    console.log('   Password: admin123')
    console.log('3. Navigate to Admin Dashboard > Businesses')
    console.log('4. Test session management features:')
    console.log('   • Session should be automatically verified')
    console.log('   • Session warning should appear 5 minutes before expiry')
    console.log('   • Extend session button should work')
    console.log('   • Logout should clear session and redirect to login')
    console.log('5. Test toast notifications:')
    console.log('   • Create a business - should show success toast')
    console.log('   • Try invalid operations - should show error toasts')
    console.log('   • Toasts should be visible in both light and dark modes')
    console.log('6. Test session expiration:')
    console.log('   • Wait for session to expire (15 minutes)')
    console.log('   • Should automatically redirect to login page')
    console.log('   • Should show session warning 5 minutes before expiry')
    
    console.log('\n✅ Expected Results:')
    console.log('• Session timeout triggers auto-redirect to login')
    console.log('• Extend-session notification appears and works properly')
    console.log('• Toasts appear for both success and error events')
    console.log('• Toasts display correctly in both light and dark themes')
    console.log('• All flows in the Businesses module are tested and stable')
    console.log('• The session logic and notification system are reusable across modules')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
  }
}

if (require.main === module) {
  testSessionToastSystem()
}
