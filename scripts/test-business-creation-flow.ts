#!/usr/bin/env tsx

/**
 * Test Business Creation Flow
 * 
 * This script tests the complete business creation flow with DynamoDB and email.
 * 
 * Usage: npx tsx scripts/test-business-creation-flow.ts
 */

import { createBusiness, getAllBusinesses } from '../lib/dynamodb/business'
import { getUserByEmail } from '../lib/dynamodb/auth'
import { createMagicLink } from '../lib/dynamodb/business'
import { sendMagicLinkEmail } from '../lib/email/send'
import { v4 as uuidv4 } from 'uuid'
import { hashPassword } from '../lib/auth/password'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { config } from 'dotenv'

// Load environment variables
config()

// Create DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  endpoint: process.env.DYNAMODB_ENDPOINT,
})

const docClient = DynamoDBDocumentClient.from(client)

// Table names
const TABLE_NAMES = {
  USERS: process.env.DYNAMODB_TABLE_USERS || 'xianfeast_users',
  USER_ROLES: process.env.DYNAMODB_TABLE_USER_ROLES || 'xianfeast_user_roles',
  ROLES: process.env.DYNAMODB_TABLE_ROLES || 'xianfeast_roles',
} as const

// Helper function to put item
async function putItem(tableName: string, item: any): Promise<void> {
  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  })
  await docClient.send(command)
}

async function testBusinessCreationFlow() {
  console.log('🧪 Testing Business Creation Flow...\n')
  
  const testBusiness = {
    name: 'Test Restaurant 3',
    ownerEmail: 'test.owner3@example.com',
    ownerName: 'Test Owner 3',
    description: 'Third test restaurant for XianFeast',
    address: '789 Test Boulevard, Nairobi',
    phone: '+254700000002',
    currency: 'KES',
    timezone: 'Africa/Nairobi'
  }
  
  try {
    // Step 1: Check if user already exists
    console.log('1️⃣ Checking if user already exists...')
    const existingUser = await getUserByEmail(testBusiness.ownerEmail)
    
    if (existingUser) {
      console.log(`⚠️ User ${testBusiness.ownerEmail} already exists. Skipping creation.`)
      return
    }
    
    console.log('✅ User does not exist, proceeding with creation')
    
    // Step 2: Create business owner user
    console.log('\n2️⃣ Creating business owner user...')
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
    console.log(`✅ Created user: ${ownerUserId}`)

    // Step 3: Create business
    console.log('\n3️⃣ Creating business...')
    const business = await createBusiness({
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
      })
    })
    
    console.log(`✅ Created business: ${business.id}`)

    // Step 4: Create business_owner role
    console.log('\n4️⃣ Creating business_owner role...')
    const roleId = uuidv4()
    const role = {
      id: roleId,
      business_id: business.id,
      name: 'business_owner',
      permissions_csv: 'business.read,business.update,stall.create,stall.read,stall.update,stall.delete,product.create,product.read,product.update,product.delete,user.invite,user.read,user.update,order.read,analytics.read',
      created_at: new Date().toISOString()
    }

    await putItem(TABLE_NAMES.ROLES, role)
    console.log(`✅ Created role: ${roleId}`)

    // Step 5: Create user-role relationship
    console.log('\n5️⃣ Creating user-role relationship...')
    const userRole = {
      id: uuidv4(),
      user_id: ownerUserId,
      role_id: roleId,
      business_id: business.id,
      assigned_at: new Date().toISOString()
    }

    await putItem(TABLE_NAMES.USER_ROLES, userRole)
    console.log('✅ Created user-role relationship')

    // Step 6: Create magic link
    console.log('\n6️⃣ Creating magic link...')
    const magicToken = uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

    const magicLink = await createMagicLink({
      token: magicToken,
      user_id: ownerUserId,
      business_id: business.id,
      type: 'business_invitation',
      expires_at: expiresAt,
      used: false
    })
    
    console.log(`✅ Created magic link: ${magicToken}`)

    // Step 7: Send invitation email
    console.log('\n7️⃣ Sending invitation email...')
    try {
      const magicLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/magic?token=${magicToken}`
      
      await sendMagicLinkEmail(testBusiness.ownerEmail, magicLinkUrl)
      
      console.log(`✅ Email sent to ${testBusiness.ownerEmail}`)
      console.log(`   Magic Link: ${magicLinkUrl}`)
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError)
    }

    // Step 8: Verify data in DynamoDB
    console.log('\n8️⃣ Verifying data in DynamoDB...')
    const allBusinesses = await getAllBusinesses()
    const createdBusiness = allBusinesses.find(b => b.id === business.id)
    
    if (createdBusiness) {
      console.log('✅ Business found in DynamoDB')
      console.log(`   Name: ${createdBusiness.name}`)
      console.log(`   Status: ${createdBusiness.status}`)
      console.log(`   Owner: ${createdBusiness.owner_user_id}`)
    } else {
      console.log('❌ Business not found in DynamoDB')
    }

    console.log('\n🎉 Business creation flow test completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`   • Business ID: ${business.id}`)
    console.log(`   • Business Name: ${business.name}`)
    console.log(`   • Owner Email: ${testBusiness.ownerEmail}`)
    console.log(`   • Owner Name: ${testBusiness.ownerName}`)
    console.log(`   • Magic Link Token: ${magicToken}`)
    console.log(`   • Status: ${business.status}`)
    
    console.log('\n🔧 Next steps:')
    console.log('   1. Check email inbox for invitation')
    console.log('   2. Click magic link to set up password')
    console.log('   3. Complete MFA verification if enabled')
    console.log('   4. Access business dashboard')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  testBusinessCreationFlow()
}
