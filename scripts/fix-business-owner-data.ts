#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { getUserByEmail, updateUser } from '../lib/dynamodb/users'

// Load environment variables
dotenv.config()

async function fixBusinessOwnerData() {
  console.log('🔧 Fixing Business Owner Data')
  console.log('==================================================')

  try {
    // Get the business owner user
    const businessOwnerEmail = 'eccsgl.dancan@gmail.com'
    const targetBusinessId = 'biz_1760954255340_65gul96eq'

    console.log(`1️⃣ Looking for user: ${businessOwnerEmail}`)
    const user = await getUserByEmail(businessOwnerEmail)

    if (!user) {
      console.log('❌ Business owner user not found!')
      return
    }

    console.log('✅ Business owner user found:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Current Business ID: ${user.business_id || 'Not set'}`)
    console.log(`   Status: ${user.status}`)
    console.log(`   Roles: ${user.roles_json}`)

    // Update the user with the correct business_id
    console.log(`\n2️⃣ Setting business_id to: ${targetBusinessId}`)
    const updatedUser = await updateUser(user.id, {
      business_id: targetBusinessId,
      status: 'active' // Ensure user is active
    })

    if (updatedUser) {
      console.log('✅ Business owner updated successfully!')
      console.log(`   New Business ID: ${updatedUser.business_id}`)
      console.log(`   Status: ${updatedUser.status}`)
    } else {
      console.log('❌ Failed to update business owner')
    }

    console.log('\n🎉 Business owner data fix completed!')

  } catch (error) {
    console.error('❌ Error fixing business owner data:', error)
    process.exit(1)
  }
}

// Run the fix
fixBusinessOwnerData()