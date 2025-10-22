#!/usr/bin/env tsx

/**
 * Reset Customer Password Script
 * Resets the password for a specific customer
 */

import { dynamoClient } from '../lib/dynamodb/client'
import { getUserByEmail, updateUserPassword } from '../lib/dynamodb/users'
import * as argon2 from 'argon2'

async function resetCustomerPassword(email: string, newPassword: string) {
  console.log('🔐 Resetting customer password...')
  console.log(`📧 Email: ${email}`)
  
  try {
    // Check if customer exists
    console.log('🔍 Looking up customer...')
    const customer = await getUserByEmail(email)
    
    if (!customer) {
      console.error('❌ Customer not found')
      return false
    }
    
    console.log('✅ Customer found:')
    console.log(`   ID: ${customer.id}`)
    console.log(`   Name: ${customer.name}`)
    console.log(`   Role: ${customer.role}`)
    console.log(`   Status: ${customer.status}`)
    
    // Hash the new password
    console.log('🔐 Hashing new password...')
    const hashedPassword = await argon2.hash(newPassword)
    
    // Update the password
    console.log('💾 Updating password in database...')
    const success = await updateUserPassword(customer.id, hashedPassword)
    
    if (success) {
      console.log('✅ Password updated successfully!')
      console.log('\n🔑 New Login Credentials:')
      console.log(`   Email: ${email}`)
      console.log(`   Password: ${newPassword}`)
      console.log('   URL: http://localhost:3000/customer/login')
      return true
    } else {
      console.error('❌ Failed to update password')
      return false
    }
    
  } catch (error) {
    console.error('❌ Error resetting password:', error)
    return false
  }
}

async function main() {
  const email = 'dangwenyi@emtechhouse.co.ke'
  const newPassword = 'Majivuno@24116817'
  
  console.log('🔧 Customer Password Reset Tool')
  console.log('================================\n')
  
  const success = await resetCustomerPassword(email, newPassword)
  
  if (success) {
    console.log('\n🎉 Password reset completed successfully!')
    console.log('You can now login with the new password.')
  } else {
    console.log('\n❌ Password reset failed.')
    console.log('Please check the error messages above.')
  }
}

if (require.main === module) {
  main().catch(console.error)
}