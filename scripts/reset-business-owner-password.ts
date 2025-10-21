#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { getUserByEmail, updateUser } from '../lib/dynamodb/users'
import { hashPassword } from '../lib/auth/password'

// Load environment variables
dotenv.config()

async function resetBusinessOwnerPassword() {
  console.log('🔧 Resetting Business Owner Password')
  console.log('==================================================')

  const email = 'eccsgl.dancan@gmail.com'
  const newPassword = 'Majivuno@24116817'

  try {
    // Find the user
    console.log('1️⃣ Finding user...')
    const user = await getUserByEmail(email)
    
    if (!user) {
      console.log('❌ User not found!')
      return
    }
    
    console.log('✅ User found!')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}`)

    // Hash the new password
    console.log('\n2️⃣ Hashing new password...')
    const hashedPassword = await hashPassword(newPassword)
    console.log('✅ Password hashed successfully!')

    // Update the user's password
    console.log('\n3️⃣ Updating user password...')
    const updatedUser = await updateUser(user.id, {
      hashed_password: hashedPassword,
      password_change_required: false
    })

    if (updatedUser) {
      console.log('✅ Password updated successfully!')
      console.log(`   User: ${updatedUser.email}`)
      console.log(`   Password change required: ${updatedUser.password_change_required}`)
    } else {
      console.log('❌ Failed to update password!')
    }

    console.log('\n🎉 Business owner password reset completed!')
    console.log(`   Email: ${email}`)
    console.log(`   New Password: ${newPassword}`)

  } catch (error) {
    console.error('❌ Password reset failed:', error)
    process.exit(1)
  }
}

// Run the reset
resetBusinessOwnerPassword()