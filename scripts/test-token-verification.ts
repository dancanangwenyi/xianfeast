#!/usr/bin/env tsx

/**
 * Test JWT token verification directly
 */

import { verifySessionToken } from '../lib/auth/session-server'

const BASE_URL = 'http://localhost:3000'

async function testTokenVerification() {
  console.log('🧪 Testing JWT Token Verification')
  console.log('=================================')

  try {
    // Test 1: Login and get token
    console.log('\n1️⃣ Logging in to get token...')
    
    const loginResponse = await fetch(`${BASE_URL}/api/auth/customer/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'dangwenyi@emtechhouse.co.ke',
        password: 'Majivuno@24116817'
      }),
    })

    if (!loginResponse.ok) {
      console.log('❌ Login failed')
      return
    }

    // Extract session token
    const setCookieHeaders = loginResponse.headers.get('set-cookie')
    let sessionToken = ''
    
    if (setCookieHeaders) {
      const cookies = setCookieHeaders.split(', ')
      for (const cookie of cookies) {
        if (cookie.startsWith('xianfeast_session=')) {
          const [nameValue] = cookie.split(';')
          sessionToken = nameValue.split('=')[1]
          break
        }
      }
    }

    console.log('✅ Login successful')
    console.log('Token length:', sessionToken.length)
    console.log('Token preview:', sessionToken.substring(0, 50) + '...')

    // Test 2: Verify token using the same function as middleware
    console.log('\n2️⃣ Testing token verification...')
    
    try {
      const session = verifySessionToken(sessionToken)
      console.log('Session verification result:', session ? 'SUCCESS' : 'FAILED')
      
      if (session) {
        console.log('Session data:', {
          userId: session.userId,
          email: session.email,
          roles: session.roles,
          exp: new Date(session.exp * 1000).toISOString()
        })
      } else {
        console.log('❌ Token verification returned null')
      }
    } catch (error) {
      console.log('❌ Token verification threw error:', error)
    }

    // Test 3: Check environment variables
    console.log('\n3️⃣ Checking environment...')
    console.log('JWT_SECRET defined:', process.env.JWT_SECRET ? 'Yes' : 'No')
    console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0)

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testTokenVerification()