#!/usr/bin/env tsx

/**
 * Test Web Interface Business Creation
 * 
 * This script tests the web interface business creation by simulating
 * the exact flow a user would go through.
 * 
 * Usage: npx tsx scripts/test-web-interface-business-creation.ts
 */

import { config } from 'dotenv'
import { getAllBusinesses } from '../lib/dynamodb/business'
import { getUserByEmail } from '../lib/dynamodb/auth'
import { sendMagicLinkEmail } from '../lib/email/send'

// Load environment variables
config()

async function testWebInterfaceBusinessCreation() {
  console.log('🧪 Testing Web Interface Business Creation...\n')
  
  try {
    // Step 1: Check current state
    console.log('1️⃣ Checking current state...')
    const businesses = await getAllBusinesses()
    const superAdmin = await getUserByEmail('dancangwe@gmail.com')
    
    console.log(`✅ Found ${businesses.length} businesses in DynamoDB`)
    console.log(`✅ Super Admin exists: ${superAdmin ? 'Yes' : 'No'}`)
    
    if (superAdmin) {
      console.log(`   • ID: ${superAdmin.id}`)
      console.log(`   • Status: ${superAdmin.status}`)
      console.log(`   • Roles: ${superAdmin.roles_json}`)
    }
    
    // Step 2: Test API endpoints
    console.log('\n2️⃣ Testing API endpoints...')
    
    // Test GET /api/admin/businesses
    try {
      const response = await fetch('http://localhost:3000/api/admin/businesses', {
        method: 'GET',
        credentials: 'include',
      })
      
      console.log(`GET /api/admin/businesses: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ API returned ${data.businesses?.length || 0} businesses`)
      } else {
        console.log(`❌ API returned error: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ API call failed: ${error}`)
    }
    
    // Step 3: Test business creation via API
    console.log('\n3️⃣ Testing business creation via API...')
    
    const testBusiness = {
      name: 'Web Interface Test Restaurant',
      ownerEmail: 'web.test@example.com',
      ownerName: 'Web Test Owner',
      description: 'Test restaurant created via web interface',
      address: '123 Web Test Street, Nairobi',
      phone: '+254700000004',
      currency: 'KES',
      timezone: 'Africa/Nairobi'
    }
    
    try {
      const response = await fetch('http://localhost:3000/api/admin/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(testBusiness),
      })
      
      console.log(`POST /api/admin/businesses: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Business created successfully via API')
        console.log(`   • Business ID: ${data.business?.id}`)
        console.log(`   • Message: ${data.message}`)
        
        // Step 4: Verify business was created in DynamoDB
        console.log('\n4️⃣ Verifying business in DynamoDB...')
        const updatedBusinesses = await getAllBusinesses()
        const createdBusiness = updatedBusinesses.find(b => b.name === testBusiness.name)
        
        if (createdBusiness) {
          console.log('✅ Business found in DynamoDB')
          console.log(`   • ID: ${createdBusiness.id}`)
          console.log(`   • Status: ${createdBusiness.status}`)
          console.log(`   • Owner Email: ${createdBusiness.email}`)
          console.log(`   • Created: ${createdBusiness.created_at}`)
        } else {
          console.log('❌ Business not found in DynamoDB')
        }
        
        // Step 5: Test email sending
        console.log('\n5️⃣ Testing email sending...')
        try {
          await sendMagicLinkEmail(testBusiness.ownerEmail, 'http://localhost:3000/auth/magic?token=test-token')
          console.log('✅ Test email sent successfully')
        } catch (emailError) {
          console.log(`❌ Email sending failed: ${emailError}`)
        }
        
      } else {
        const errorData = await response.json()
        console.log(`❌ Business creation failed: ${errorData.error}`)
      }
    } catch (error) {
      console.log(`❌ Business creation API call failed: ${error}`)
    }
    
    // Step 6: Final verification
    console.log('\n6️⃣ Final verification...')
    const finalBusinesses = await getAllBusinesses()
    console.log(`✅ Total businesses in DynamoDB: ${finalBusinesses.length}`)
    
    console.log('\n📋 Current businesses:')
    finalBusinesses.forEach((business, index) => {
      console.log(`   ${index + 1}. ${business.name} (${business.status})`)
      console.log(`      ID: ${business.id}`)
      console.log(`      Owner: ${business.email}`)
      console.log(`      Created: ${business.created_at}`)
    })
    
    console.log('\n🎉 Web interface business creation test completed!')
    
    console.log('\n🔧 Next steps for manual testing:')
    console.log('1. Go to http://localhost:3000/login')
    console.log('2. Login with Super Admin credentials:')
    console.log('   Email: dancangwe@gmail.com')
    console.log('   Password: admin123')
    console.log('3. Navigate to Admin Dashboard > Businesses')
    console.log('4. You should see the real businesses from DynamoDB')
    console.log('5. Click "Create New Business" to test the form')
    console.log('6. Fill out the form and submit')
    console.log('7. Check that the business appears in the list')
    console.log('8. Check that an email is sent to the business owner')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
  }
}

if (require.main === module) {
  testWebInterfaceBusinessCreation()
}
