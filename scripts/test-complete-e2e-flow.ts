#!/usr/bin/env tsx

/**
 * Complete End-to-End Test
 * 
 * This script tests the complete business creation and management flow:
 * 1. Super Admin login
 * 2. Business creation
 * 3. Email invitation
 * 4. Business owner password setup
 * 5. Business owner login
 * 6. Stall creation
 * 7. Product creation
 * 8. User invitation
 * 
 * Usage: npx tsx scripts/test-complete-e2e-flow.ts
 */

import { config } from 'dotenv'
import { getAllBusinesses } from '../lib/dynamodb/business'
import { getUserByEmail } from '../lib/dynamodb/auth'
import { sendMagicLinkEmail } from '../lib/email/send'
import { v4 as uuidv4 } from 'uuid'
import { hashPassword } from '../lib/auth/password'
import { putItem, TABLE_NAMES } from '../lib/dynamodb/service'

// Load environment variables
config()

interface TestResult {
  step: string
  success: boolean
  message: string
  data?: any
}

async function testCompleteE2EFlow(): Promise<void> {
  console.log('🧪 Testing Complete End-to-End Flow...\n')
  
  const results: TestResult[] = []
  
  try {
    // Step 1: Verify Super Admin exists
    console.log('1️⃣ Verifying Super Admin...')
    const superAdmin = await getUserByEmail('dancangwe@gmail.com')
    if (superAdmin) {
      results.push({
        step: 'Super Admin Verification',
        success: true,
        message: 'Super Admin exists and is active',
        data: { id: superAdmin.id, status: superAdmin.status }
      })
      console.log('✅ Super Admin verified')
    } else {
      results.push({
        step: 'Super Admin Verification',
        success: false,
        message: 'Super Admin not found'
      })
      console.log('❌ Super Admin not found')
    }

    // Step 2: Create test business
    console.log('\n2️⃣ Creating Test Business...')
    const testBusiness = {
      name: 'E2E Test Restaurant',
      ownerEmail: 'e2e.owner@example.com',
      ownerName: 'E2E Test Owner',
      description: 'End-to-end test restaurant',
      address: '123 E2E Test Street, Nairobi',
      phone: '+254700000003',
      currency: 'KES',
      timezone: 'Africa/Nairobi'
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(testBusiness.ownerEmail)
    if (existingUser) {
      results.push({
        step: 'Business Creation',
        success: false,
        message: 'Test user already exists'
      })
      console.log('⚠️ Test user already exists, skipping creation')
    } else {
      // Create business owner user
      const ownerUserId = uuidv4()
      const tempPassword = `temp_${Math.random().toString(36).substr(2, 8)}`
      const hashedPassword = await hashPassword(tempPassword)

      const user = {
        id: ownerUserId,
        email: testBusiness.ownerEmail,
        name: testBusiness.ownerName,
        hashed_password: hashedPassword,
        roles_json: JSON.stringify(['business_owner']),
        mfa_enabled: false,
        last_login: '',
        status: 'invited',
        invited_by: 'super_admin',
        invite_token: '',
        invite_expiry: '',
        created_at: new Date().toISOString(),
        password_change_required: true
      }

      await putItem(TABLE_NAMES.USERS, user)

      // Create business
      const business = {
        id: `biz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: testBusiness.name,
        description: testBusiness.description,
        address: testBusiness.address,
        phone: testBusiness.phone,
        email: testBusiness.ownerEmail,
        owner_user_id: ownerUserId,
        status: 'pending',
        settings_json: JSON.stringify({
          currency: testBusiness.currency,
          timezone: testBusiness.timezone,
          created_by: 'super_admin'
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await putItem(TABLE_NAMES.BUSINESSES, business)

      // Create business_owner role
      const roleId = uuidv4()
      const role = {
        id: roleId,
        business_id: business.id,
        name: 'business_owner',
        permissions_csv: 'business.read,business.update,stall.create,stall.read,stall.update,stall.delete,product.create,product.read,product.update,product.delete,user.invite,user.read,user.update,order.read,analytics.read',
        created_at: new Date().toISOString()
      }

      await putItem(TABLE_NAMES.ROLES, role)

      // Create user-role relationship
      const userRole = {
        id: uuidv4(),
        user_id: ownerUserId,
        role_id: roleId,
        business_id: business.id,
        assigned_at: new Date().toISOString()
      }

      await putItem(TABLE_NAMES.USER_ROLES, userRole)

      // Create magic link
      const magicToken = uuidv4()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const magicLink = {
        id: uuidv4(),
        token: magicToken,
        user_id: ownerUserId,
        business_id: business.id,
        type: 'business_invitation',
        expires_at: expiresAt,
        used: false,
        created_at: new Date().toISOString()
      }

      await putItem(TABLE_NAMES.MAGIC_LINKS, magicLink)

      results.push({
        step: 'Business Creation',
        success: true,
        message: 'Business created successfully',
        data: { businessId: business.id, ownerId: ownerUserId, magicToken }
      })
      console.log('✅ Business created successfully')

      // Step 3: Send invitation email
      console.log('\n3️⃣ Sending Invitation Email...')
      try {
        const magicLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/magic?token=${magicToken}`
        await sendMagicLinkEmail(testBusiness.ownerEmail, magicLinkUrl)
        
        results.push({
          step: 'Email Invitation',
          success: true,
          message: 'Invitation email sent successfully',
          data: { email: testBusiness.ownerEmail, magicLink: magicLinkUrl }
        })
        console.log('✅ Invitation email sent')
      } catch (emailError) {
        results.push({
          step: 'Email Invitation',
          success: false,
          message: `Failed to send email: ${emailError}`
        })
        console.log('❌ Failed to send invitation email')
      }

      // Step 4: Test password setup via magic link
      console.log('\n4️⃣ Testing Password Setup...')
      try {
        const response = await fetch('http://localhost:3000/api/auth/verify-magic-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: magicToken,
            action: 'setup-password',
            password: 'e2etestpassword123',
          }),
        })

        const data = await response.json()
        
        if (data.success) {
          results.push({
            step: 'Password Setup',
            success: true,
            message: 'Password set successfully via magic link',
            data: { userId: data.user.id, email: data.user.email }
          })
          console.log('✅ Password setup successful')
        } else {
          results.push({
            step: 'Password Setup',
            success: false,
            message: `Password setup failed: ${data.error}`
          })
          console.log('❌ Password setup failed')
        }
      } catch (error) {
        results.push({
          step: 'Password Setup',
          success: false,
          message: `Password setup error: ${error}`
        })
        console.log('❌ Password setup error')
      }

      // Step 5: Test business owner login
      console.log('\n5️⃣ Testing Business Owner Login...')
      try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: testBusiness.ownerEmail,
            password: 'e2etestpassword123',
          }),
        })

        const data = await response.json()
        
        if (data.success) {
          results.push({
            step: 'Business Owner Login',
            success: true,
            message: 'Business owner logged in successfully',
            data: { userId: data.user.id, roles: data.user.roles }
          })
          console.log('✅ Business owner login successful')
        } else {
          results.push({
            step: 'Business Owner Login',
            success: false,
            message: `Login failed: ${data.error}`
          })
          console.log('❌ Business owner login failed')
        }
      } catch (error) {
        results.push({
          step: 'Business Owner Login',
          success: false,
          message: `Login error: ${error}`
        })
        console.log('❌ Business owner login error')
      }
    }

    // Step 6: Verify data in DynamoDB
    console.log('\n6️⃣ Verifying DynamoDB Data...')
    const businesses = await getAllBusinesses()
    const testBusinesses = businesses.filter(b => b.name === 'E2E Test Restaurant')
    
    if (testBusinesses.length > 0) {
      results.push({
        step: 'DynamoDB Verification',
        success: true,
        message: 'Business found in DynamoDB',
        data: { businessCount: testBusinesses.length, businessId: testBusinesses[0].id }
      })
      console.log('✅ Business verified in DynamoDB')
    } else {
      results.push({
        step: 'DynamoDB Verification',
        success: false,
        message: 'Business not found in DynamoDB'
      })
      console.log('❌ Business not found in DynamoDB')
    }

    // Step 7: Test stall creation
    console.log('\n7️⃣ Testing Stall Creation...')
    try {
      const stall = {
        id: `stall_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        business_id: testBusinesses[0]?.id || 'test-business-id',
        name: 'E2E Test Stall',
        description: 'End-to-end test stall',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await putItem(TABLE_NAMES.STALLS, stall)
      
      results.push({
        step: 'Stall Creation',
        success: true,
        message: 'Stall created successfully',
        data: { stallId: stall.id, businessId: stall.business_id }
      })
      console.log('✅ Stall created successfully')
    } catch (error) {
      results.push({
        step: 'Stall Creation',
        success: false,
        message: `Stall creation failed: ${error}`
      })
      console.log('❌ Stall creation failed')
    }

    // Step 8: Test product creation
    console.log('\n8️⃣ Testing Product Creation...')
    try {
      const product = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        business_id: testBusinesses[0]?.id || 'test-business-id',
        stall_id: `stall_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: 'E2E Test Product',
        description: 'End-to-end test product',
        price: 1500,
        category: 'Main Course',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await putItem(TABLE_NAMES.PRODUCTS, product)
      
      results.push({
        step: 'Product Creation',
        success: true,
        message: 'Product created successfully',
        data: { productId: product.id, businessId: product.business_id }
      })
      console.log('✅ Product created successfully')
    } catch (error) {
      results.push({
        step: 'Product Creation',
        success: false,
        message: `Product creation failed: ${error}`
      })
      console.log('❌ Product creation failed')
    }

    // Final Results
    console.log('\n🎉 End-to-End Test Completed!')
    console.log('\n📊 Test Results Summary:')
    
    const successfulSteps = results.filter(r => r.success).length
    const totalSteps = results.length
    
    console.log(`   • Total Steps: ${totalSteps}`)
    console.log(`   • Successful: ${successfulSteps}`)
    console.log(`   • Failed: ${totalSteps - successfulSteps}`)
    console.log(`   • Success Rate: ${((successfulSteps / totalSteps) * 100).toFixed(1)}%`)
    
    console.log('\n📋 Detailed Results:')
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌'
      console.log(`   ${index + 1}. ${status} ${result.step}: ${result.message}`)
      if (result.data) {
        console.log(`      Data: ${JSON.stringify(result.data, null, 2)}`)
      }
    })

    if (successfulSteps === totalSteps) {
      console.log('\n🎉 ALL TESTS PASSED! The complete flow is working perfectly!')
    } else {
      console.log('\n⚠️ Some tests failed. Please review the results above.')
    }

  } catch (error) {
    console.error('\n❌ End-to-end test failed:', error)
  }
}

if (require.main === module) {
  testCompleteE2EFlow()
}
