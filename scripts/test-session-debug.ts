#!/usr/bin/env tsx

/**
 * Debug session and cookie handling
 */

const BASE_URL = 'http://localhost:3000'

async function debugSession() {
  console.log('🧪 Debugging Session and Cookies')
  console.log('================================')

  try {
    // Test 1: Login and examine cookies
    console.log('\n1️⃣ Logging in and examining cookies...')
    
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

    const setCookieHeaders = loginResponse.headers.get('set-cookie')
    console.log('Set-Cookie headers:', setCookieHeaders)

    // Parse cookies
    const cookies = setCookieHeaders?.split(', ').map(cookie => {
      const [nameValue] = cookie.split(';')
      return nameValue
    }).join('; ')

    console.log('Parsed cookies for requests:', cookies)

    // Test 2: Verify session API
    console.log('\n2️⃣ Testing session verification API...')
    
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/verify-session`, {
      method: 'GET',
      headers: {
        'Cookie': cookies || '',
      },
    })

    console.log(`Session API Status: ${sessionResponse.status}`)
    const sessionData = await sessionResponse.json()
    console.log('Session data:', JSON.stringify(sessionData, null, 2))

    // Test 3: Test individual cookie values
    if (setCookieHeaders) {
      console.log('\n3️⃣ Analyzing individual cookies...')
      
      const cookieLines = setCookieHeaders.split(', ')
      for (const cookieLine of cookieLines) {
        const [nameValue] = cookieLine.split(';')
        const [name, value] = nameValue.split('=')
        console.log(`Cookie: ${name} = ${value.substring(0, 50)}...`)
        
        if (name === 'xianfeast_session') {
          console.log('Found session cookie!')
          
          // Test this specific cookie
          const testResponse = await fetch(`${BASE_URL}/api/auth/verify-session`, {
            method: 'GET',
            headers: {
              'Cookie': `${name}=${value}`,
            },
          })
          
          console.log(`Test with session cookie only: ${testResponse.status}`)
          if (testResponse.ok) {
            const testData = await testResponse.json()
            console.log('Session verified with session cookie:', testData)
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugSession()