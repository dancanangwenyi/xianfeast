#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { getUserByEmail, getUserWithRoles } from '../lib/dynamodb/users'
import { verifyPassword } from '../lib/auth/password'

// Load environment variables
dotenv.config()

async function debugUserLogin() {
  console.log('🔧 Debugging User Login Process')
  console.log('==================================================')

  const email = 'eccsgl.dancan@gmail.com'
  const password = 'Majivuno@24116817'

  try {
    // Step 1: Check if user exists
    console.log('1️⃣ Checking if user exists...')
    const user = await getUserByEmail(email)
    
    if (!user) {
      console.log('❌ User not found!')
      return
    }
    
    console.log('✅ User found!')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Status: ${user.status}`)
    console.log(`   Has Password: ${user.hashed_password ? 'Yes' : 'No'}`)
    console.log(`   MFA Enabled: ${user.mfa_enabled}`)

    // Step 2: Check password
    console.log('\n2️⃣ Verifying password...')
    if (!user.hashed_password) {
      console.log('❌ No password hash found!')
      return
    }

    const isValidPassword = await verifyPassword(password, user.hashed_password)
    console.log(`   Password valid: ${isValidPassword ? '✅ Yes' : '❌ No'}`)

    if (!isValidPassword) {
      console.log('❌ Password verification failed!')
      return
    }

    // Step 3: Get user with roles
    console.log('\n3️⃣ Getting user with roles...')
    const userWithRoles = await getUserWithRoles(email)
    
    if (!userWithRoles) {
      console.log('❌ Failed to get user with roles!')
      return
    }

    console.log('✅ User with roles retrieved!')
    console.log(`   Roles count: ${userWithRoles.roles.length}`)
    userWithRoles.roles.forEach((role, index) => {
      console.log(`   Role ${index + 1}: ${role.name}`)
    })

    // Step 4: Test actual login API call
    console.log('\n4️⃣ Testing login API call...')
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    })

    console.log(`   Response status: ${loginResponse.status}`)
    const loginData = await loginResponse.text()
    console.log(`   Response body: ${loginData}`)

    if (loginResponse.ok) {
      console.log('✅ Login API call successful!')
    } else {
      console.log('❌ Login API call failed!')
    }

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

// Run the debug
debugUserLogin()