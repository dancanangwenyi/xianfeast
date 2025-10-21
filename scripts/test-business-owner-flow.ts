#!/usr/bin/env tsx

import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testBusinessOwnerFlow() {
  console.log('🔧 Testing Business Owner Complete Flow')
  console.log('==================================================')

  try {
    // Step 1: Login as business owner
    console.log('1️⃣ Testing business owner login...')
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'eccsgl.dancan@gmail.com', // Business owner email
        password: 'Majivuno@24116817'
      })
    })

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`)
    }

    const loginData = await loginResponse.json()
    console.log('✅ Business owner login successful!')
    console.log(`   User: ${loginData.email}`)
    console.log(`   Roles: ${loginData.roles.join(', ')}`)

    // Extract cookies from login response
    const cookies = loginResponse.headers.get('set-cookie')
    if (!cookies) {
      throw new Error('No cookies received from login')
    }

    // Step 2: Test business dashboard access
    console.log('\n2️⃣ Testing business dashboard access...')
    const dashboardResponse = await fetch('http://localhost:3000/business/dashboard', {
      method: 'GET',
      headers: {
        'Cookie': cookies
      }
    })

    console.log(`   Dashboard status: ${dashboardResponse.status}`)
    if (dashboardResponse.status === 200) {
      console.log('✅ Business dashboard accessible!')
    } else {
      console.log('❌ Business dashboard access failed!')
    }

    // Step 3: Test business info API
    console.log('\n3️⃣ Testing business info API...')
    const businessInfoResponse = await fetch('http://localhost:3000/api/businesses/my-business', {
      method: 'GET',
      headers: {
        'Cookie': cookies
      }
    })

    if (businessInfoResponse.ok) {
      const businessData = await businessInfoResponse.json()
      console.log('✅ Business info API working!')
      console.log(`   Business: ${businessData.business.name}`)
      console.log(`   Status: ${businessData.business.status}`)
    } else {
      console.log('❌ Business info API failed!')
    }

    // Step 4: Test dashboard stats API
    console.log('\n4️⃣ Testing dashboard stats API...')
    const statsResponse = await fetch('http://localhost:3000/api/businesses/dashboard-stats', {
      method: 'GET',
      headers: {
        'Cookie': cookies
      }
    })

    if (statsResponse.ok) {
      const statsData = await statsResponse.json()
      console.log('✅ Dashboard stats API working!')
      console.log(`   Total Stalls: ${statsData.stats.totalStalls}`)
      console.log(`   Total Products: ${statsData.stats.totalProducts}`)
      console.log(`   Total Orders: ${statsData.stats.totalOrders}`)
    } else {
      console.log('❌ Dashboard stats API failed!')
    }

    // Step 5: Test stalls API
    console.log('\n5️⃣ Testing stalls API...')
    const stallsResponse = await fetch('http://localhost:3000/api/businesses/my-stalls', {
      method: 'GET',
      headers: {
        'Cookie': cookies
      }
    })

    if (stallsResponse.ok) {
      const stallsData = await stallsResponse.json()
      console.log('✅ Stalls API working!')
      console.log(`   Number of stalls: ${stallsData.stalls.length}`)
    } else {
      console.log('❌ Stalls API failed!')
    }

    // Step 6: Test stalls page access
    console.log('\n6️⃣ Testing stalls page access...')
    const stallsPageResponse = await fetch('http://localhost:3000/business/dashboard/stalls', {
      method: 'GET',
      headers: {
        'Cookie': cookies
      }
    })

    console.log(`   Stalls page status: ${stallsPageResponse.status}`)
    if (stallsPageResponse.status === 200) {
      console.log('✅ Stalls page accessible!')
    } else {
      console.log('❌ Stalls page access failed!')
    }

    console.log('\n🎉 Business owner flow test completed!')

  } catch (error) {
    console.error('❌ Business owner flow test failed:', error)
    process.exit(1)
  }
}

// Run the test
testBusinessOwnerFlow()