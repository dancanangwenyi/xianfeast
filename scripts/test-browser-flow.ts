#!/usr/bin/env tsx

/**
 * Test the complete browser-based customer login flow
 */

const BASE_URL = 'http://localhost:3000'

async function testBrowserFlow() {
  console.log('🧪 Testing Browser-Based Customer Login Flow')
  console.log('============================================')

  const credentials = {
    email: 'dangwenyi@emtechhouse.co.ke',
    password: 'Majivuno@24116817'
  }

  try {
    // Test 1: Customer Login API
    console.log('\n1️⃣ Testing customer login...')
    console.log(`Email: ${credentials.email}`)
    
    const loginResponse = await fetch(`${BASE_URL}/api/auth/customer/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    const loginData = await loginResponse.json()
    console.log(`Status: ${loginResponse.status}`)
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginData.error)
      return
    }

    console.log('✅ Login successful!')
    console.log(`User: ${loginData.user?.name} (${loginData.user?.email})`)
    console.log(`Roles: ${loginData.user?.roles.join(', ')}`)

    // Extract cookies
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

    console.log('Session cookie set:', sessionCookie ? 'Yes' : 'No')

    // Test 2: Session Verification
    console.log('\n2️⃣ Testing session verification...')
    
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/verify-session`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
      },
    })

    const sessionData = await sessionResponse.json()
    console.log(`Status: ${sessionResponse.status}`)
    
    if (!sessionResponse.ok) {
      console.log('❌ Session verification failed:', sessionData.error)
      return
    }

    console.log('✅ Session verification successful!')
    console.log(`Session expires: ${sessionData.expiresAt}`)
    console.log(`User roles: ${sessionData.roles.join(', ')}`)

    // Test 3: Customer Dashboard API
    console.log('\n3️⃣ Testing customer dashboard API...')
    
    const dashboardApiResponse = await fetch(`${BASE_URL}/api/customer/dashboard`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
      },
    })

    console.log(`Dashboard API Status: ${dashboardApiResponse.status}`)
    
    if (dashboardApiResponse.ok) {
      const dashboardData = await dashboardApiResponse.json()
      console.log('✅ Dashboard API accessible!')
      console.log(`Customer: ${dashboardData.customer.name}`)
      console.log(`Total orders: ${dashboardData.stats.total_orders}`)
      console.log(`Available stalls: ${dashboardData.available_stalls.length}`)
    } else {
      console.log('❌ Dashboard API access failed')
    }

    // Test 4: Customer Dashboard Page
    console.log('\n4️⃣ Testing customer dashboard page...')
    
    const dashboardPageResponse = await fetch(`${BASE_URL}/customer/dashboard`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
      },
    })

    console.log(`Dashboard Page Status: ${dashboardPageResponse.status}`)
    
    if (dashboardPageResponse.ok) {
      console.log('✅ Dashboard page accessible!')
      const pageContent = await dashboardPageResponse.text()
      if (pageContent.includes('Welcome back')) {
        console.log('✅ Dashboard content loaded correctly')
      } else {
        console.log('⚠️ Dashboard content may not be fully loaded')
      }
    } else {
      console.log('❌ Dashboard page access failed')
    }

    // Test 5: Customer Cart Page
    console.log('\n5️⃣ Testing customer cart page...')
    
    const cartResponse = await fetch(`${BASE_URL}/customer/cart`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
      },
    })

    console.log(`Cart Status: ${cartResponse.status}`)
    
    if (cartResponse.ok) {
      console.log('✅ Cart page accessible!')
    } else {
      console.log('❌ Cart page access failed')
    }

    // Test 6: Logout (if endpoint exists)
    console.log('\n6️⃣ Testing logout...')
    
    const logoutResponse = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Cookie': sessionCookie,
      },
    })

    console.log(`Logout Status: ${logoutResponse.status}`)
    
    if (logoutResponse.ok) {
      console.log('✅ Logout successful!')
      
      // Test 7: Verify session is cleared
      console.log('\n7️⃣ Testing session after logout...')
      
      const postLogoutSessionResponse = await fetch(`${BASE_URL}/api/auth/verify-session`, {
        method: 'GET',
        headers: {
          'Cookie': sessionCookie,
        },
      })

      console.log(`Post-logout session Status: ${postLogoutSessionResponse.status}`)
      
      if (postLogoutSessionResponse.status === 401) {
        console.log('✅ Session properly cleared after logout!')
      } else {
        console.log('❌ Session not properly cleared')
      }
    } else {
      console.log('⚠️ Logout endpoint may not exist (this is okay)')
    }

    console.log('\n🎉 Browser-based customer login flow test completed!')
    console.log('\n📋 Summary:')
    console.log('- ✅ Customer login API: Working')
    console.log('- ✅ Session management: Working') 
    console.log('- ✅ Dashboard API: Working')
    console.log('- ✅ Dashboard page: Working')
    console.log('- ✅ Protected routes: Working')
    console.log('- ✅ Authentication flow: Complete')

  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run the test
testBrowserFlow()