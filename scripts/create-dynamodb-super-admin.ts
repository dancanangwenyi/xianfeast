#!/usr/bin/env tsx

/**
 * Create Super Admin User in DynamoDB
 * 
 * This script creates a super admin user in DynamoDB with:
 * - Auto-generated secure password
 * - Email sent to dancangwe@gmail.com with login credentials
 * - Force password change on first login
 * 
 * Usage: npx tsx scripts/create-dynamodb-super-admin.ts
 */

import { v4 as uuidv4 } from 'uuid'
import { hashPassword } from '../lib/auth/password'
import { sendEmail } from '../lib/email/send'
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

async function generateSecurePassword(): Promise<string> {
  // Generate a secure random password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  password += '0123456789'[Math.floor(Math.random() * 10)]
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]
  
  // Fill the rest randomly
  for (let i = 4; i < 16; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

async function createSuperAdminRole(): Promise<string> {
  const roleId = uuidv4()
  
  const role = {
    id: roleId,
    business_id: 'GLOBAL', // Use 'GLOBAL' instead of empty string for global roles
    name: 'super_admin',
    permissions_csv: 'admin.all,business.create,business.read,business.update,business.delete,user.create,user.read,user.update,user.delete,role.create,role.read,role.update,role.delete,analytics.read,webhooks.create,webhooks.read,webhooks.update,webhooks.delete',
    created_at: new Date().toISOString()
  }
  
  await putItem(TABLE_NAMES.ROLES, role)
  console.log(`✅ Created super_admin role: ${roleId}`)
  
  return roleId
}

async function createSuperAdminUser(password: string): Promise<string> {
  const userId = uuidv4()
  const hashedPassword = await hashPassword(password)
  
  const user = {
    id: userId,
    email: 'dancangwe@gmail.com',
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
    password_change_required: true // Force password change on first login
  }
  
  await putItem(TABLE_NAMES.USERS, user)
  console.log(`✅ Created super admin user: ${userId}`)
  
  return userId
}

async function createUserRoleRelationship(userId: string, roleId: string): Promise<void> {
  const userRole = {
    id: uuidv4(),
    user_id: userId,
    role_id: roleId,
    business_id: 'GLOBAL', // Use 'GLOBAL' instead of empty string for global roles
    assigned_at: new Date().toISOString()
  }
  
  await putItem(TABLE_NAMES.USER_ROLES, userRole)
  console.log(`✅ Created user-role relationship`)
}

async function sendSuperAdminEmail(password: string): Promise<void> {
  const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>XianFeast Super Admin Account Created</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials { background: #fff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to XianFeast!</h1>
            <p>Your Super Admin account has been created</p>
        </div>
        
        <div class="content">
            <h2>Account Details</h2>
            <div class="credentials">
                <p><strong>Email:</strong> dancangwe@gmail.com</p>
                <p><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>
                <p><strong>Login URL:</strong> <a href="http://localhost:3000/login">http://localhost:3000/login</a></p>
            </div>
            
            <div class="warning">
                <h3>⚠️ Important Security Notice</h3>
                <p>For security reasons, you <strong>MUST</strong> change your password on first login. The system will prompt you to set a new password.</p>
            </div>
            
            <h3>What's Next?</h3>
            <ol>
                <li>Click the login link above or go to <a href="http://localhost:3000/login">http://localhost:3000/login</a></li>
                <li>Enter your email and the temporary password</li>
                <li>You'll be prompted to change your password</li>
                <li>Start managing your XianFeast platform!</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/login" class="button">🚀 Login to XianFeast</a>
            </div>
            
            <h3>Super Admin Capabilities</h3>
            <ul>
                <li>✅ Create and manage businesses</li>
                <li>✅ Manage user accounts and roles</li>
                <li>✅ View system analytics and reports</li>
                <li>✅ Configure webhooks and integrations</li>
                <li>✅ Access all platform features</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>This is an automated message from XianFeast. Please do not reply to this email.</p>
            <p>If you didn't expect this email, please contact your system administrator.</p>
        </div>
    </div>
</body>
</html>
  `
  
  try {
    await sendEmail({
      to: 'dancangwe@gmail.com',
      subject: '🎉 XianFeast Super Admin Account Created - Action Required',
      html: emailContent
    })
    console.log('✅ Super admin email sent successfully to dancangwe@gmail.com')
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Creating Super Admin User in DynamoDB...\n')
  
  try {
    // Generate secure password
    console.log('1️⃣ Generating secure password...')
    const password = await generateSecurePassword()
    console.log(`✅ Generated secure password: ${password}`)
    
    // Create super admin role
    console.log('\n2️⃣ Creating super_admin role...')
    const roleId = await createSuperAdminRole()
    
    // Create super admin user
    console.log('\n3️⃣ Creating super admin user...')
    const userId = await createSuperAdminUser(password)
    
    // Create user-role relationship
    console.log('\n4️⃣ Creating user-role relationship...')
    await createUserRoleRelationship(userId, roleId)
    
    // Send email with credentials
    console.log('\n5️⃣ Sending email with login credentials...')
    await sendSuperAdminEmail(password)
    
    console.log('\n🎉 Super Admin setup completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`   • User ID: ${userId}`)
    console.log(`   • Email: dancangwe@gmail.com`)
    console.log(`   • Password: ${password}`)
    console.log(`   • Role: super_admin`)
    console.log(`   • Status: Active (password change required)`)
    
    console.log('\n📧 Email sent to dancangwe@gmail.com with login instructions')
    console.log('\n🔧 Next steps:')
    console.log('   1. Check your email for login credentials')
    console.log('   2. Go to http://localhost:3000/login')
    console.log('   3. Login with the provided credentials')
    console.log('   4. Change your password when prompted')
    console.log('   5. Start managing your XianFeast platform!')
    
  } catch (error) {
    console.error('\n❌ Failed to create super admin:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
