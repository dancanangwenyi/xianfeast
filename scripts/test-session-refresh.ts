#!/usr/bin/env tsx

import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testSessionRefresh() {
  console.log('🔧 Testing Session Refresh Functionality')
  console.log('==================================================')

  try {
    // Step 1: Login to get initial session
    console.log('1️⃣ Logging in to get initial session...')
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'dancangwe@gmail.com',
        password: 'password123'
      })
    })

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`)
    }

    const loginData = await loginResponse.json()
    console.log('✅ Login successful!')
    console.log(`   User: ${loginData.email}`)
    console.log(`   Roles: ${loginData.roles.join(', ')}`)

    // Extract cookies from login response
    const cookies = loginResponse.headers.get('set-cookie')
    if (!cookies) {
      throw new Error('No cookies received from login')
    }

    // Step 2: Test session refresh
    console.log('\n2️⃣ Testing session refresh...')
    const refreshResponse = await fetch('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Cookie': cookies
      }
    })

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text()
      throw new Error(`Refresh failed: ${refreshResponse.status} - ${errorText}`)
    }

    const refreshData = await refreshResponse.json()
    console.log('✅ Session refresh successful!')
    console.log(`   User: ${refreshData.email}`)
    console.log(`   Roles: ${refreshData.roles.join(', ')}`)
    console.log(`   Expires at: ${refreshData.expiresAt}`)
    console.log(`   Is authenticated: ${refreshData.isAuthenticated}`)

    // Step 3: Verify the refreshed session works
    console.log('\n3️⃣ Verifying refreshed session...')
    const newCookies = refreshResponse.headers.get('set-cookie') || cookies
    
    const verifyResponse = await fetch('http://localhost:3000/api/auth/verify-session', {
      method: 'GET',
      headers: {
        'Cookie': newCookies
      }
    })

    if (!verifyResponse.ok) {
      throw new Error(`Session verification failed: ${verifyResponse.status}`)
    }

    const verifyData = await verifyResponse.json()
    console.log('✅ Refreshed session verification successful!')
    console.log(`   User: ${verifyData.email}`)
    console.log(`   Session valid: ${verifyData.isAuthenticated}`)

    console.log('\n🎉 Session refresh test completed successfully!')

  } catch (error) {
    console.error('❌ Session refresh test failed:', error)
    process.exit(1)
  }
}

// Run the test
testSessionRefresh()