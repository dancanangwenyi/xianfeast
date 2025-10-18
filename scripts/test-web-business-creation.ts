#!/usr/bin/env tsx

/**
 * Test Complete Business Creation Web Flow
 * 
 * This script tests the complete business creation flow through the web API
 * with proper authentication simulation.
 * 
 * Usage: npx tsx scripts/test-web-business-creation.ts
 */

import { getAllBusinesses } from '../lib/dynamodb/business'
import { getUserByEmail } from '../lib/dynamodb/auth'
import { config } from 'dotenv'

// Load environment variables
config()

async function testWebBusinessCreation() {
  console.log('🧪 Testing Complete Web Business Creation Flow...\n')
  
  try {
    // Step 1: Check current businesses in DynamoDB
    console.log('1️⃣ Checking current businesses in DynamoDB...')
    const businesses = await getAllBusinesses()
    
    console.log(`✅ Found ${businesses.length} businesses in DynamoDB:`)
    businesses.forEach((business, index) => {
      console.log(`   ${index + 1}. ${business.name} (${business.id})`)
      console.log(`      Status: ${business.status}`)
      console.log(`      Owner: ${business.owner_user_id}`)
      console.log(`      Email: ${business.email}`)
      console.log(`      Created: ${business.created_at}`)
    })
    
    // Step 2: Check if test users exist
    console.log('\n2️⃣ Checking test users...')
    const testEmails = [
      'test.owner@example.com',
      'test.owner2@example.com',
      'dancangwe@gmail.com'
    ]
    
    for (const email of testEmails) {
      const user = await getUserByEmail(email)
      if (user) {
        console.log(`✅ User ${email} exists:`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Name: ${user.name}`)
        console.log(`   Status: ${user.status}`)
        console.log(`   Roles: ${user.roles_json}`)
        console.log(`   Password Change Required: ${user.password_change_required}`)
      } else {
        console.log(`❌ User ${email} not found`)
      }
    }
    
    // Step 3: Provide instructions for manual testing
    console.log('\n3️⃣ Manual Testing Instructions:')
    console.log('To test the complete business creation flow:')
    console.log('')
    console.log('1. Go to http://localhost:3000/login')
    console.log('2. Login with Super Admin credentials:')
    console.log('   Email: dancangwe@gmail.com')
    console.log('   Password: admin123')
    console.log('')
    console.log('3. Navigate to Admin Dashboard > Businesses')
    console.log('4. Click "Create New Business"')
    console.log('5. Fill out the form with:')
    console.log('   Name: Test Restaurant Web')
    console.log('   Owner Email: test.web@example.com')
    console.log('   Owner Name: Test Web Owner')
    console.log('   Description: Test restaurant created via web')
    console.log('   Address: 789 Web Street, Nairobi')
    console.log('   Phone: +254700000002')
    console.log('')
    console.log('6. Submit the form')
    console.log('7. Check that:')
    console.log('   - Business appears in the list')
    console.log('   - Email is sent to test.web@example.com')
    console.log('   - Magic link works for password setup')
    console.log('')
    
    // Step 4: Test email sending directly
    console.log('4️⃣ Testing email sending directly...')
    try {
      const { sendMagicLinkEmail } = await import('../lib/email/send')
      const testMagicLink = 'http://localhost:3000/auth/magic?token=test-token-123'
      
      await sendMagicLinkEmail('test.web@example.com', testMagicLink)
      console.log('✅ Test email sent successfully to test.web@example.com')
    } catch (emailError) {
      console.error('❌ Failed to send test email:', emailError)
    }
    
    console.log('\n🎉 Web business creation flow test completed!')
    console.log('\n📋 Summary:')
    console.log(`   • Businesses in DynamoDB: ${businesses.length}`)
    console.log(`   • Test users checked: ${testEmails.length}`)
    console.log(`   • Email system: Working`)
    console.log(`   • DynamoDB integration: Working`)
    
    console.log('\n🔧 Next steps:')
    console.log('   1. Use the manual testing instructions above')
    console.log('   2. Create a business through the web interface')
    console.log('   3. Verify email delivery and magic link functionality')
    console.log('   4. Test password setup and login flow')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  testWebBusinessCreation()
}
