#!/usr/bin/env tsx

import { config } from 'dotenv'
import fetch from 'node-fetch'

// Load environment variables
config()

async function testLogin() {
  console.log('🔧 Testing Login Functionality')
  console.log('==================================================')
  
  try {
    const loginUrl = 'http://localhost:3000/api/auth/login'
    
    console.log('📡 Testing login with Super Admin credentials...')
    console.log('   Email: dancangwe@gmail.com')
    console.log('   Password: admin123')
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'dancangwe@gmail.com',
        password: 'admin123'
      })
    })
    
    const responseText = await response.text()
    console.log(`\n📊 Response Status: ${response.status}`)
    console.log(`📊 Response Headers:`)
    response.headers.forEach((value, key) => {
      console.log(`   ${key}: ${value}`)
    })
    console.log(`📊 Response Body: ${responseText}`)
    
    if (response.ok) {
      console.log('✅ Login successful!')
      
      // Try to access a protected route
      const cookies = response.headers.get('set-cookie')
      if (cookies) {
        console.log('\n🍪 Testing protected route with session...')
        const meResponse = await fetch('http://localhost:3000/api/users/me', {
          headers: {
            'Cookie': cookies
          }
        })
        
        const meData = await meResponse.text()
        console.log(`📊 /api/users/me Status: ${meResponse.status}`)
        console.log(`📊 /api/users/me Response: ${meData}`)
      }
    } else {
      console.log('❌ Login failed!')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testLogin()