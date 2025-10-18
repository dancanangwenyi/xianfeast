#!/usr/bin/env tsx

/**
 * Debug DynamoDB User Record
 * 
 * This script helps debug the user record in DynamoDB.
 * 
 * Usage: npx tsx scripts/debug-dynamodb-user.ts
 */

import { getUserByEmail } from '../lib/dynamodb/auth'
import { config } from 'dotenv'

// Load environment variables
config()

async function debugUserRecord() {
  console.log('🔍 Debugging DynamoDB User Record...\n')
  
  const email = 'dancangwe@gmail.com'
  
  try {
    const user = await getUserByEmail(email)
    
    if (!user) {
      console.error('❌ User not found')
      return
    }
    
    console.log('📋 User Record Details:')
    console.log(`   • ID: ${user.id}`)
    console.log(`   • Email: ${user.email}`)
    console.log(`   • Name: ${user.name}`)
    console.log(`   • Status: ${user.status}`)
    console.log(`   • Password Change Required: ${user.password_change_required}`)
    console.log(`   • Created At: ${user.created_at}`)
    console.log(`   • Last Login: ${user.last_login || 'Never'}`)
    console.log(`   • MFA Enabled: ${user.mfa_enabled}`)
    console.log(`   • Roles JSON: ${user.roles_json}`)
    console.log(`   • Password Hash: ${user.hashed_password.substring(0, 20)}...`)
    console.log(`   • Password Hash Length: ${user.hashed_password.length}`)
    
    // Test password verification with different passwords
    console.log('\n🧪 Testing password verification...')
    
    const { verifyPassword } = await import('../lib/auth/password')
    
    const testPasswords = [
      '0JJ5yf04Jh&d1!ia', // Current password
      'admin123',          // Common password
      'password',          // Common password
      '123456'            // Common password
    ]
    
    for (const testPassword of testPasswords) {
      try {
        const isValid = await verifyPassword(testPassword, user.hashed_password)
        console.log(`   • "${testPassword}": ${isValid ? '✅ Valid' : '❌ Invalid'}`)
      } catch (error) {
        console.log(`   • "${testPassword}": ❌ Error - ${error.message}`)
      }
    }
    
  } catch (error) {
    console.error('\n❌ Debug failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  debugUserRecord()
}
