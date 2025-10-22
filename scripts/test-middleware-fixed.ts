#!/usr/bin/env tsx

/**
 * Test middleware with proper cookie handling
 */

const BASE_URL = 'http://localhost:3000'

async function testMiddlewareFixed() {
  console.log('🧪 Testing Middleware with Fixed Cookie Handling')
  console.log('===============================================')

  try {
    // Test 1: Login first to get session
    console.log('\n1️⃣ Logging in to get session...')
    
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

    // Extract session cookie properly
    const setCookieHeaders = loginResponse.headers.get('set-cookie')
    let sessionCookie = ''
    
    if (setCookieHeaders) {
      const cookies = setCookieHeaders.split(', ')
      for (const cookie of cookies) {
        if (cookie.startsWith('xianfeast_session=')) {
          const [nameValue] = cookie.split(';')
          sessionCookie = nameValue
          break
        }
      }
    }

    console.log('✅ Login successful')
    console.log('Session cookie:', sessionCookie.substring(0, 50) + '...')

    // Test 2: Access protected route without session
    console.log('\n2️⃣ Testing protected route without session...')
    
    const unauthResponse = await fetch(`${BASE_URL}/customer/dashboard`, {
      method: 'GET',
      redirect: 'manual',
    })

    console.log(`Status: ${unauthResponse.status}`)
    if (unauthResponse.status >= 300 && unauthResponse.status < 400) {
      const location = unauthResponse.headers.get('location')
      console.log(`✅ Redirected to: ${location}`)
    } else {
      console.log('❌ Should have been redirected')
    }

    // Test 3: Access protected route with session
    console.log('\n3️⃣ Testing protected route with session...')
    
    const authResponse = await fetch(`${BASE_URL}/customer/dashboard`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
      },
      redirect: 'manual',
    })

    console.log(`Status: ${authResponse.status}`)
    if (authResponse.status === 200) {
      console.log('✅ Access granted with session')
    } else if (authResponse.status >= 300 && authResponse.status < 400) {
      const location = authResponse.headers.get('location')
      console.log(`❌ Redirected to: ${location}`)
    } else {
      console.log('❌ Access denied with session')
    }

    // Test 4: Access login page with session (should redirect)
    console.log('\n4️⃣ Testing login page with session...')
    
    const loginPageResponse = await fetch(`${BASE_URL}/customer/login`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
      },
      redirect: 'manual',
    })

    console.log(`Status: ${loginPageResponse.status}`)
    if (loginPageResponse.status >= 300 && loginPageResponse.status < 400) {
      const location = loginPageResponse.headers.get('location')
      console.log(`✅ Redirected to: ${location}`)
    } else {
      console.log('❌ Should have been redirected')
    }

    // Test 5: Access admin route as customer (should redirect)
    console.log('\n5️⃣ Testing admin route as customer...')
    
    const adminResponse = await fetch(`${BASE_URL}/admin/dashboard`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
      },
      redirect: 'manual',
    })

    console.log(`Status: ${adminResponse.status}`)
    if (adminResponse.status >= 300 && adminResponse.status < 400) {
      const location = adminResponse.headers.get('location')
      console.log(`✅ Redirected to: ${location}`)
    } else {
      console.log('❌ Should have been redirected')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testMiddlewareFixed()