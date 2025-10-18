#!/usr/bin/env tsx

/**
 * Recreate Super Admin with Simple Password
 * 
 * This script recreates the super admin with a simple password for testing.
 * 
 * Usage: npx tsx scripts/recreate-dynamodb-admin.ts
 */

import { v4 as uuidv4 } from 'uuid'
import { hashPassword } from '../lib/auth/password'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
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

// Helper function to delete item
async function deleteItem(tableName: string, key: any): Promise<void> {
  const command = new DeleteCommand({
    TableName: tableName,
    Key: key,
  })
  await docClient.send(command)
}

async function recreateSuperAdmin() {
  console.log('🔄 Recreating Super Admin with Simple Password...\n')
  
  const email = 'dancangwe@gmail.com'
  const simplePassword = 'admin123'
  
  try {
    // Step 1: Delete existing user and related records
    console.log('1️⃣ Cleaning up existing records...')
    
    // Get existing user
    const { getUserByEmail, getUserRoles } = await import('../lib/dynamodb/auth')
    const existingUser = await getUserByEmail(email)
    
    if (existingUser) {
      console.log(`   Found existing user: ${existingUser.id}`)
      
      // Delete user-role relationships
      const userRoles = await getUserRoles(existingUser.id)
      for (const role of userRoles) {
        // Find user-role relationship
        const { QueryCommand } = await import('@aws-sdk/lib-dynamodb')
        const queryCommand = new QueryCommand({
          TableName: TABLE_NAMES.USER_ROLES,
          IndexName: 'user-id-index',
          KeyConditionExpression: 'user_id = :user_id',
          ExpressionAttributeValues: {
            ':user_id': existingUser.id
          }
        })
        
        const result = await docClient.send(queryCommand)
        const userRoleRelations = result.Items || []
        
        for (const userRole of userRoleRelations) {
          await deleteItem(TABLE_NAMES.USER_ROLES, { id: userRole.id })
          console.log(`   Deleted user-role relationship: ${userRole.id}`)
        }
      }
      
      // Delete user
      await deleteItem(TABLE_NAMES.USERS, { id: existingUser.id })
      console.log(`   Deleted user: ${existingUser.id}`)
    }
    
    // Step 2: Create new super admin role
    console.log('\n2️⃣ Creating super_admin role...')
    const roleId = uuidv4()
    
    const role = {
      id: roleId,
      business_id: 'GLOBAL',
      name: 'super_admin',
      permissions_csv: 'admin.all,business.create,business.read,business.update,business.delete,user.create,user.read,user.update,user.delete,role.create,role.read,role.update,role.delete,analytics.read,webhooks.create,webhooks.read,webhooks.update,webhooks.delete',
      created_at: new Date().toISOString()
    }
    
    await putItem(TABLE_NAMES.ROLES, role)
    console.log(`✅ Created super_admin role: ${roleId}`)
    
    // Step 3: Create new super admin user
    console.log('\n3️⃣ Creating super admin user...')
    const userId = uuidv4()
    
    console.log(`   Hashing password: ${simplePassword}`)
    const hashedPassword = await hashPassword(simplePassword)
    console.log(`   Password hash: ${hashedPassword.substring(0, 20)}...`)
    
    const user = {
      id: userId,
      email: email,
      name: 'Super Admin',
      hashed_password: hashedPassword,
      roles_json: JSON.stringify(['super_admin']),
      mfa_enabled: false,
      last_login: '',
      status: 'active',
      invited_by: '',
      invite_token: '',
      invite_expiry: '',
      created_at: new Date().toISOString(),
      password_change_required: true
    }
    
    await putItem(TABLE_NAMES.USERS, user)
    console.log(`✅ Created super admin user: ${userId}`)
    
    // Step 4: Create user-role relationship
    console.log('\n4️⃣ Creating user-role relationship...')
    const userRole = {
      id: uuidv4(),
      user_id: userId,
      role_id: roleId,
      business_id: 'GLOBAL',
      assigned_at: new Date().toISOString()
    }
    
    await putItem(TABLE_NAMES.USER_ROLES, userRole)
    console.log(`✅ Created user-role relationship`)
    
    // Step 5: Test password verification
    console.log('\n5️⃣ Testing password verification...')
    const { verifyPassword } = await import('../lib/auth/password')
    const isPasswordValid = await verifyPassword(simplePassword, hashedPassword)
    
    if (isPasswordValid) {
      console.log('✅ Password verification successful')
    } else {
      console.log('❌ Password verification failed')
    }
    
    console.log('\n🎉 Super Admin recreated successfully!')
    console.log('\n📋 New Credentials:')
    console.log(`   • Email: ${email}`)
    console.log(`   • Password: ${simplePassword}`)
    console.log(`   • User ID: ${userId}`)
    console.log(`   • Role ID: ${roleId}`)
    console.log(`   • Status: Active (password change required)`)
    
    console.log('\n🔧 Next steps:')
    console.log('   1. Test login with the new credentials')
    console.log('   2. Go to http://localhost:3000/login')
    console.log('   3. Login with email and password above')
    console.log('   4. Change password when prompted')
    
  } catch (error) {
    console.error('\n❌ Failed to recreate super admin:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  recreateSuperAdmin()
}
