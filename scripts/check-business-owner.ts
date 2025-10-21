#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { getUserById, getAllUsers } from '../lib/dynamodb/users'

// Load environment variables
dotenv.config()

async function checkBusinessOwner() {
  console.log('🔧 Checking Business Owner Setup')
  console.log('==================================================')

  try {
    // Get all users
    const users = await getAllUsers()
    
    // Find business owner
    const businessOwner = users.find(user => user.email === 'eccsgl.dancan@gmail.com')
    
    if (!businessOwner) {
      console.log('❌ Business owner not found!')
      return
    }

    console.log('✅ Business owner found:')
    console.log(`   ID: ${businessOwner.id}`)
    console.log(`   Email: ${businessOwner.email}`)
    console.log(`   Name: ${businessOwner.name}`)
    console.log(`   Status: ${businessOwner.status}`)
    console.log(`   Business ID: ${businessOwner.business_id || 'Not set'}`)
    console.log(`   Roles JSON: ${businessOwner.roles_json || 'Not set'}`)
    console.log(`   Has Password: ${businessOwner.password_hash ? 'Yes' : 'No'}`)
    console.log(`   Created: ${businessOwner.created_at}`)

    // Parse roles
    let roles = []
    try {
      roles = JSON.parse(businessOwner.roles_json || '[]')
      console.log(`   Parsed Roles: ${roles.join(', ')}`)
    } catch (error) {
      console.log(`   ❌ Error parsing roles: ${error}`)
    }

    // Check if user has business_owner role
    if (roles.includes('business_owner')) {
      console.log('✅ User has business_owner role!')
    } else {
      console.log('❌ User does NOT have business_owner role!')
    }

    // Check business_id
    if (businessOwner.business_id) {
      console.log('✅ User has business_id assigned!')
    } else {
      console.log('❌ User does NOT have business_id assigned!')
    }

  } catch (error) {
    console.error('❌ Error checking business owner:', error)
    process.exit(1)
  }
}

// Run the check
checkBusinessOwner()