#!/usr/bin/env tsx

import { config } from 'dotenv'
import fetch from 'node-fetch'

// Load environment variables
config()

async function testCompleteFlow() {
  console.log('🔧 Testing Complete Authentication Flow')
  console.log('==================================================')
  
  try {
    const baseUrl = 'http://localhost:3000'
    
    // Step 1: Test login
    console.log('1️⃣ Testing login...')
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'dancangwe@gmail.com',
        password: 'admin123'
      })
    })
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed!')
      console.log(`   Status: ${loginResponse.status}`)
      console.log(`   Response: ${await loginResponse.text()}`)
      return
    }
    
    const loginData = await loginResponse.json()
    console.log('✅ Login successful!')
    console.log(`   User: ${loginData.user.name} (${loginData.user.email})`)
    console.log(`   Roles: ${loginData.user.roles.join(', ')}`)
    
    // Extract cookies
    const cookies = loginResponse.headers.get('set-cookie')
    if (!cookies) {
      console.log('❌ No session cookies received!')
      return
    }
    
    // Step 2: Test session verification
    console.log('\n2️⃣ Testing session verification...')
    const sessionResponse = await fetch(`${baseUrl}/api/auth/verify-session`, {
      headers: {
        'Cookie': cookies
      }
    })
    
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json()
      console.log('✅ Session verification successful!')
      console.log(`   Session valid: ${sessionData.valid}`)
    } else {
      console.log('❌ Session verification failed!')
      console.log(`   Status: ${sessionResponse.status}`)
    }
    
    // Step 3: Test user profile
    console.log('\n3️⃣ Testing user profile...')
    const profileResponse = await fetch(`${baseUrl}/api/users/me`, {
      headers: {
        'Cookie': cookies
      }
    })
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json()
      console.log('✅ User profile retrieval successful!')
      console.log(`   ID: ${profileData.id}`)
      console.log(`   Email: ${profileData.email}`)
      console.log(`   Roles: ${profileData.roles.join(', ')}`)
    } else {
      console.log('❌ User profile retrieval failed!')
      console.log(`   Status: ${profileResponse.status}`)
    }
    
    // Step 4: Test admin dashboard access
    console.log('\n4️⃣ Testing admin dashboard access...')
    const adminResponse = await fetch(`${baseUrl}/admin`, {
      headers: {
        'Cookie': cookies
      },
      redirect: 'manual' // Don't follow redirects
    })
    
    console.log(`   Admin page status: ${adminResponse.status}`)
    if (adminResponse.status === 200) {
      console.log('✅ Admin dashboard accessible!')
    } else if (adminResponse.status === 302 || adminResponse.status === 307) {
      const location = adminResponse.headers.get('location')
      console.log(`🔄 Redirected to: ${location}`)
    } else {
      console.log('❌ Admin dashboard access failed!')
    }
    
    // Step 5: Test dashboard access
    console.log('\n5️⃣ Testing regular dashboard access...')
    const dashboardResponse = await fetch(`${baseUrl}/dashboard`, {
      headers: {
        'Cookie': cookies
      },
      redirect: 'manual'
    })
    
    console.log(`   Dashboard status: ${dashboardResponse.status}`)
    if (dashboardResponse.status === 200) {
      console.log('✅ Dashboard accessible!')
    } else if (dashboardResponse.status === 302 || dashboardResponse.status === 307) {
      const location = dashboardResponse.headers.get('location')
      console.log(`🔄 Redirected to: ${location}`)
    } else {
      console.log('❌ Dashboard access failed!')
    }
    
    console.log('\n🎉 Complete flow test finished!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testCompleteFlow()