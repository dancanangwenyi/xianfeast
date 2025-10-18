#!/usr/bin/env tsx

/**
 * Test Super Admin Access and Session Management
 * 
 * This script tests the complete super admin access flow including
 * login, session verification, and business access.
 * 
 * Usage: npx tsx scripts/test-super-admin-access.ts
 */

import { config } from 'dotenv'
import { getAllBusinesses } from '../lib/dynamodb/business'
import { getUserByEmail } from '../lib/dynamodb/auth'

// Load environment variables
config()

async function testSuperAdminAccess() {
  console.log('🧪 Testing Super Admin Access and Session Management...\n')
  
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
      console.log(`   • Password Change Required: ${superAdmin.password_change_required}`)
    }
    
    // Step 2: Test login API
    console.log('\n2️⃣ Testing login API...')
    
    const loginData = {
      email: 'dancangwe@gmail.com',
      password: 'admin123'
    }
    
    try {
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(loginData),
      })
      
      console.log(`POST /api/auth/login: ${loginResponse.status} ${loginResponse.statusText}`)
      
      if (loginResponse.ok) {
        const loginResult = await loginResponse.json()
        console.log('✅ Login successful')
        console.log(`   • User ID: ${loginResult.user?.id}`)
        console.log(`   • Email: ${loginResult.user?.email}`)
        console.log(`   • Roles: ${loginResult.user?.roles}`)
        
        // Step 3: Test session verification after login
        console.log('\n3️⃣ Testing session verification after login...')
        
        // Extract cookies from login response
        const setCookieHeader = loginResponse.headers.get('set-cookie')
        console.log(`   • Set-Cookie header: ${setCookieHeader}`)
        
        // Test session verification with cookies
        const sessionResponse = await fetch('http://localhost:3000/api/auth/verify-session', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cookie': setCookieHeader || ''
          }
        })
        
        console.log(`GET /api/auth/verify-session: ${sessionResponse.status} ${sessionResponse.statusText}`)
        
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json()
          console.log('✅ Session verification successful')
          console.log(`   • User ID: ${sessionData.userId}`)
          console.log(`   • Email: ${sessionData.email}`)
          console.log(`   • Roles: ${sessionData.roles}`)
          console.log(`   • Expires At: ${sessionData.expiresAt}`)
          
          // Step 4: Test business access
          console.log('\n4️⃣ Testing business access...')
          
          const businessResponse = await fetch('http://localhost:3000/api/admin/businesses', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Cookie': setCookieHeader || ''
            }
          })
          
          console.log(`GET /api/admin/businesses: ${businessResponse.status} ${businessResponse.statusText}`)
          
          if (businessResponse.ok) {
            const businessData = await businessResponse.json()
            console.log('✅ Business access successful')
            console.log(`   • Found ${businessData.businesses?.length || 0} businesses`)
          } else {
            const errorData = await businessResponse.json()
            console.log(`❌ Business access failed: ${errorData.error}`)
          }
          
        } else {
          const errorData = await sessionResponse.json()
          console.log(`❌ Session verification failed: ${errorData.error}`)
        }
        
      } else {
        const errorData = await loginResponse.json()
        console.log(`❌ Login failed: ${errorData.error}`)
      }
    } catch (error) {
      console.log(`❌ Login API call failed: ${error}`)
    }
    
    // Step 5: Test session refresh
    console.log('\n5️⃣ Testing session refresh...')
    
    try {
      const refreshResponse = await fetch('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })
      
      console.log(`POST /api/auth/refresh: ${refreshResponse.status} ${refreshResponse.statusText}`)
      
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        console.log('✅ Session refresh successful')
        console.log(`   • User ID: ${refreshData.userId}`)
        console.log(`   • Email: ${refreshData.email}`)
        console.log(`   • Roles: ${refreshData.roles}`)
      } else {
        const errorData = await refreshResponse.json()
        console.log(`❌ Session refresh failed: ${errorData.error}`)
      }
    } catch (error) {
      console.log(`❌ Session refresh API call failed: ${error}`)
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
    
    console.log('\n🎉 Super admin access test completed!')
    
    console.log('\n🔧 Manual Testing Instructions:')
    console.log('1. Go to http://localhost:3000/login')
    console.log('2. Login with Super Admin credentials:')
    console.log('   Email: dancangwe@gmail.com')
    console.log('   Password: admin123')
    console.log('3. Check browser developer tools > Application > Cookies')
    console.log('   • Should see xianfeast_session cookie')
    console.log('   • Should see xianfeast_refresh cookie')
    console.log('4. Navigate to Admin Dashboard > Businesses')
    console.log('5. Check browser developer tools > Network tab')
    console.log('   • Should see successful calls to /api/auth/verify-session')
    console.log('   • Should see successful calls to /api/admin/businesses')
    console.log('6. If still getting "Access Denied":')
    console.log('   • Clear all cookies and try again')
    console.log('   • Check if session cookies are being set properly')
    console.log('   • Verify the session verification API is working')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
  }
}

if (require.main === module) {
  testSuperAdminAccess()
}
