#!/usr/bin/env tsx

import { config } from 'dotenv'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { hashPassword } from '../lib/auth/password'

// Load environment variables
config()

async function createSuperAdminDirect() {
  console.log('🔧 Creating Super Admin User Directly')
  console.log('==================================================')
  
  try {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'eu-north-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })

    const docClient = DynamoDBDocumentClient.from(client)
    
    const email = process.env.SUPER_ADMIN_EMAIL || 'dancangwe@gmail.com'
    const name = process.env.SUPER_ADMIN_NAME || 'Super Admin'
    const password = process.env.SUPER_ADMIN_PASSWORD || 'admin123'
    
    console.log('👤 Creating Super Admin user...')
    console.log(`   Email: ${email}`)
    console.log(`   Name: ${name}`)
    console.log(`   Password: ${password}`)
    
    // Check if user already exists
    console.log('\n🔍 Checking if user already exists...')
    const scanCommand = new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE_USERS || 'xianfeast_users',
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    })
    
    const existingUsers = await docClient.send(scanCommand)
    
    if (existingUsers.Items && existingUsers.Items.length > 0) {
      console.log('⚠️  User already exists! Skipping user creation.')
      console.log(`   Found ${existingUsers.Items.length} existing users with this email`)
      return
    }
    
    // Hash password
    console.log('🔐 Hashing password...')
    const hashedPassword = await hashPassword(password)
    
    // Create user
    const userId = uuidv4()
    const userCommand = new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_USERS || 'xianfeast_users',
      Item: {
        id: userId,
        email: email,
        name: name,
        hashed_password: hashedPassword,
        status: 'active',
        roles_json: JSON.stringify(['super_admin']),
        mfa_enabled: false,
        password_change_required: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    })
    
    await docClient.send(userCommand)
    console.log('✅ Super Admin user created!')
    
    // Create super admin role
    console.log('\n🔧 Creating super admin role...')
    const roleId = uuidv4()
    const roleCommand = new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_ROLES || 'xianfeast_roles',
      Item: {
        id: roleId,
        name: 'super_admin',
        display_name: 'Super Admin',
        description: 'Full system access',
        permissions_json: JSON.stringify(['*']),
        // Don't include business_id and stall_id for super admin role to avoid GSI issues
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    })
    
    await docClient.send(roleCommand)
    console.log('✅ Super admin role created!')
    
    // Create user-role relationship
    console.log('\n🔗 Creating user-role relationship...')
    const userRoleId = uuidv4()
    const userRoleCommand = new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_USER_ROLES || 'xianfeast_user_roles',
      Item: {
        id: userRoleId,
        user_id: userId,
        role_id: roleId,
        created_at: new Date().toISOString(),
      },
    })
    
    await docClient.send(userRoleCommand)
    console.log('✅ User-role relationship created!')
    
    console.log('\n🎉 Super Admin setup completed successfully!')
    console.log('🔑 Login Credentials:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log('⚠️  Please change the password after first login!')
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error)
    process.exit(1)
  }
}

createSuperAdminDirect()