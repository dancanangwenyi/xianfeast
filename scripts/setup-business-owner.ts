#!/usr/bin/env tsx

import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function setupBusinessOwner() {
  console.log('🔧 Setting up Business Owner Account')
  console.log('==================================================')

  try {
    // Step 1: Try to login as super admin first
    console.log('1️⃣ Logging in as Super Admin...')
    const adminLoginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'dancangwe@gmail.com',
        password: 'password123'
      })
    })

    if (!adminLoginResponse.ok) {
      throw new Error(`Admin login failed: ${adminLoginResponse.status}`)
    }

    const adminLoginData = await adminLoginResponse.json()
    console.log('✅ Super Admin login successful!')

    // Extract cookies from admin login
    const adminCookies = adminLoginResponse.headers.get('set-cookie')
    if (!adminCookies) {
      throw new Error('No cookies received from admin login')
    }

    // Step 2: Check if business owner exists and get their info
    console.log('\n2️⃣ Checking business owner through admin API...')
    const usersResponse = await fetch('http://localhost:3000/api/users', {
      method: 'GET',
      headers: {
        'Cookie': adminCookies
      }
    })

    if (usersResponse.ok) {
      const usersData = await usersResponse.json()
      const businessOwner = usersData.users?.find((user: any) => user.email === 'eccsgl.dancan@gmail.com')
      
      if (businessOwner) {
        console.log('✅ Business owner found in system!')
        console.log(`   ID: ${businessOwner.id}`)
        console.log(`   Email: ${businessOwner.email}`)
        console.log(`   Name: ${businessOwner.name}`)
        console.log(`   Roles: ${businessOwner.roles?.join(', ') || 'None'}`)
        console.log(`   Status: ${businessOwner.status}`)
      } else {
        console.log('❌ Business owner not found in users list!')
      }
    }

    // Step 3: Try to reset business owner password
    console.log('\n3️⃣ Attempting to reset business owner password...')
    const resetResponse = await fetch('http://localhost:3000/api/auth/set-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'eccsgl.dancan@gmail.com',
        password: 'password123'
      })
    })

    if (resetResponse.ok) {
      console.log('✅ Business owner password reset successful!')
    } else {
      console.log(`❌ Password reset failed: ${resetResponse.status}`)
      const errorText = await resetResponse.text()
      console.log(`   Error: ${errorText}`)
    }

    // Step 4: Now try to login as business owner
    console.log('\n4️⃣ Testing business owner login...')
    const ownerLoginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'eccsgl.dancan@gmail.com',
        password: 'password123'
      })
    })

    if (ownerLoginResponse.ok) {
      const ownerLoginData = await ownerLoginResponse.json()
      console.log('✅ Business owner login successful!')
      console.log(`   User: ${ownerLoginData.email}`)
      console.log(`   Roles: ${ownerLoginData.roles?.join(', ') || 'None'}`)
      
      // Test dashboard access
      const ownerCookies = ownerLoginResponse.headers.get('set-cookie')
      if (ownerCookies) {
        console.log('\n5️⃣ Testing dashboard redirect...')
        const dashboardResponse = await fetch('http://localhost:3000/dashboard', {
          method: 'GET',
          headers: {
            'Cookie': ownerCookies
          },
          redirect: 'manual'
        })
        
        console.log(`   Dashboard response: ${dashboardResponse.status}`)
        if (dashboardResponse.status === 307 || dashboardResponse.status === 302) {
          const location = dashboardResponse.headers.get('location')
          console.log(`   Redirected to: ${location}`)
        }
      }
    } else {
      console.log(`❌ Business owner login failed: ${ownerLoginResponse.status}`)
      const errorText = await ownerLoginResponse.text()
      console.log(`   Error: ${errorText}`)
    }

    console.log('\n🎉 Business owner setup completed!')

  } catch (error) {
    console.error('❌ Business owner setup failed:', error)
    process.exit(1)
  }
}

// Run the setup
setupBusinessOwner()