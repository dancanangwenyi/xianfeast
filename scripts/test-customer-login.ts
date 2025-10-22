#!/usr/bin/env tsx

/**
 * Test script for customer login flow
 * Tests the complete customer authentication process
 */

const BASE_URL = 'http://localhost:3000'

interface LoginResponse {
  success?: boolean
  user?: {
    id: string
    email: string
    name: string
    roles: string[]
  }
  message?: string
  error?: string
}

interface SessionResponse {
  userId?: string
  email?: string
  roles?: string[]
  businessId?: string
  expiresAt?: string
  isAuthenticated?: boolean
  error?: string
}

async function testCustomerLogin() {
  console.log('🧪 Testing Customer Login Flow')
  console.log('================================')

  const credentials = {
    email: 'dangwenyi@emtechhouse.co.ke',
    password: 'Majivuno@24116817'
  }

  try {
    // Test 1: Customer Login
    console.log('\n1️⃣ Testing customer login...')
    console.log(`Email: ${credentials.email}`)
    
    const loginResponse = await fetch(`${BASE_URL}/api/auth/customer/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    const loginData: LoginResponse = await loginResponse.json()
    console.log(`Status: ${loginResponse.status}`)
    console.log('Response:', JSON.stringify(loginData, null, 2))

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginData.error)
      return
    }

    console.log('✅ Login successful!')

    // Extract cookies from response
    const cookies = loginResponse.headers.get('set-cookie')
    console.log('Cookies set:', cookies ? 'Yes' : 'No')

    if (!cookies) {
      console.log('❌ No session cookies set!')
      return
    }

    // Test 2: Session Verification
    console.log('\n2️⃣ Testing session verification...')
    
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/verify-session`, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
      },
    })

    const sessionData: SessionResponse = await sessionResponse.json()
    console.log(`Status: ${sessionResponse.status}`)
    console.log('Response:', JSON.stringify(sessionData, null, 2))

    if (!sessionResponse.ok) {
      console.log('❌ Session verification failed:', sessionData.error)
      return
    }

    console.log('✅ Session verification successful!')

    // Test 3: Customer Dashboard Access
    console.log('\n3️⃣ Testing customer dashboard access...')
    
    const dashboardResponse = await fetch(`${BASE_URL}/customer/dashboard`, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
      },
      redirect: 'manual', // Don't follow redirects
    })

    console.log(`Dashboard Status: ${dashboardResponse.status}`)
    
    if (dashboardResponse.status === 200) {
      console.log('✅ Customer dashboard accessible!')
    } else if (dashboardResponse.status >= 300 && dashboardResponse.status < 400) {
      const location = dashboardResponse.headers.get('location')
      console.log(`🔄 Redirected to: ${location}`)
    } else {
      console.log('❌ Dashboard access failed')
    }

    // Test 4: Check user roles
    console.log('\n4️⃣ Checking user roles...')
    if (sessionData.roles) {
      console.log('User roles:', sessionData.roles)
      if (sessionData.roles.includes('customer')) {
        console.log('✅ User has customer role')
      } else {
        console.log('❌ User missing customer role')
      }
    }

    console.log('\n🎉 Customer login flow test completed!')

  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run the test
testCustomerLogin()