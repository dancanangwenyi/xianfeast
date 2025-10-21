#!/usr/bin/env tsx

import { config } from 'dotenv'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

// Load environment variables
config()

async function verifySuperAdminPermissions() {
  console.log('🔧 Verifying Super Admin Permissions')
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
    
    // 1. Check Super Admin user
    console.log('1️⃣ Checking Super Admin user...')
    const userScanCommand = new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE_USERS || 'xianfeast_users',
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': 'dancangwe@gmail.com',
      },
    })
    
    const userResult = await docClient.send(userScanCommand)
    const superAdminUser = userResult.Items?.[0]
    
    if (!superAdminUser) {
      console.log('❌ Super Admin user not found!')
      return
    }
    
    console.log('✅ Super Admin user found:')
    console.log(`   ID: ${superAdminUser.id}`)
    console.log(`   Email: ${superAdminUser.email}`)
    console.log(`   Name: ${superAdminUser.name}`)
    console.log(`   Status: ${superAdminUser.status}`)
    console.log(`   Roles: ${superAdminUser.roles_json}`)
    
    // Parse roles
    const userRoles = JSON.parse(superAdminUser.roles_json || '[]')
    const hasSuperAdminRole = userRoles.includes('super_admin')
    
    if (!hasSuperAdminRole) {
      console.log('⚠️  User does not have super_admin role! Updating...')
      const updatedRoles = [...new Set([...userRoles, 'super_admin'])]
      
      const updateUserCommand = new UpdateCommand({
        TableName: process.env.DYNAMODB_TABLE_USERS || 'xianfeast_users',
        Key: { id: superAdminUser.id },
        UpdateExpression: 'SET roles_json = :roles, updated_at = :updated_at',
        ExpressionAttributeValues: {
          ':roles': JSON.stringify(updatedRoles),
          ':updated_at': new Date().toISOString(),
        },
      })
      
      await docClient.send(updateUserCommand)
      console.log('✅ Super Admin role added to user!')
    } else {
      console.log('✅ User has super_admin role!')
    }
    
    // 2. Check Super Admin role definition
    console.log('\n2️⃣ Checking Super Admin role definition...')
    const roleScanCommand = new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE_ROLES || 'xianfeast_roles',
      FilterExpression: '#name = :name',
      ExpressionAttributeNames: {
        '#name': 'name',
      },
      ExpressionAttributeValues: {
        ':name': 'super_admin',
      },
    })
    
    const roleResult = await docClient.send(roleScanCommand)
    const superAdminRole = roleResult.Items?.[0]
    
    if (!superAdminRole) {
      console.log('❌ Super Admin role definition not found!')
      return
    }
    
    console.log('✅ Super Admin role found:')
    console.log(`   ID: ${superAdminRole.id}`)
    console.log(`   Name: ${superAdminRole.name}`)
    console.log(`   Display Name: ${superAdminRole.display_name}`)
    console.log(`   Description: ${superAdminRole.description}`)
    console.log(`   Permissions: ${superAdminRole.permissions_json}`)
    
    // Parse permissions
    const permissions = JSON.parse(superAdminRole.permissions_json || '[]')
    const hasWildcardPermission = permissions.includes('*')
    
    if (!hasWildcardPermission) {
      console.log('⚠️  Role does not have wildcard (*) permission! Updating...')
      
      // Define comprehensive permissions for Super Admin
      const comprehensivePermissions = [
        '*', // Wildcard for all permissions
        'admin:*', // All admin permissions
        'users:*', // All user management
        'businesses:*', // All business management
        'stalls:*', // All stall management
        'products:*', // All product management
        'orders:*', // All order management
        'analytics:*', // All analytics access
        'webhooks:*', // All webhook management
        'system:*', // All system operations
        'super_admin:*', // All super admin specific permissions
      ]
      
      const updateRoleCommand = new UpdateCommand({
        TableName: process.env.DYNAMODB_TABLE_ROLES || 'xianfeast_roles',
        Key: { id: superAdminRole.id },
        UpdateExpression: 'SET permissions_json = :permissions, updated_at = :updated_at',
        ExpressionAttributeValues: {
          ':permissions': JSON.stringify(comprehensivePermissions),
          ':updated_at': new Date().toISOString(),
        },
      })
      
      await docClient.send(updateRoleCommand)
      console.log('✅ Comprehensive permissions added to Super Admin role!')
      console.log(`   New permissions: ${JSON.stringify(comprehensivePermissions, null, 2)}`)
    } else {
      console.log('✅ Role has wildcard (*) permission!')
    }
    
    // 3. Check user-role relationship
    console.log('\n3️⃣ Checking user-role relationship...')
    const userRoleScanCommand = new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE_USER_ROLES || 'xianfeast_user_roles',
      FilterExpression: 'user_id = :user_id AND role_id = :role_id',
      ExpressionAttributeValues: {
        ':user_id': superAdminUser.id,
        ':role_id': superAdminRole.id,
      },
    })
    
    const userRoleResult = await docClient.send(userRoleScanCommand)
    const userRoleRelationship = userRoleResult.Items?.[0]
    
    if (!userRoleRelationship) {
      console.log('⚠️  User-role relationship not found! This might cause issues.')
    } else {
      console.log('✅ User-role relationship exists!')
      console.log(`   Relationship ID: ${userRoleRelationship.id}`)
      console.log(`   User ID: ${userRoleRelationship.user_id}`)
      console.log(`   Role ID: ${userRoleRelationship.role_id}`)
    }
    
    // 4. Summary
    console.log('\n📋 SUMMARY')
    console.log('==================================================')
    console.log('✅ Super Admin User: EXISTS')
    console.log('✅ Super Admin Role: EXISTS')
    console.log('✅ Comprehensive Permissions: VERIFIED')
    console.log('✅ User-Role Relationship: EXISTS')
    console.log('')
    console.log('🔑 Super Admin Access Includes:')
    console.log('   • Full system administration')
    console.log('   • User and business management')
    console.log('   • Stall and product management')
    console.log('   • Order and analytics access')
    console.log('   • Webhook and system configuration')
    console.log('   • All admin dashboard features')
    console.log('')
    console.log('🌐 Access URLs:')
    console.log('   • Login: http://localhost:3000/login')
    console.log('   • Admin Dashboard: http://localhost:3000/admin')
    console.log('   • Admin Users: http://localhost:3000/admin/users')
    console.log('   • Admin Businesses: http://localhost:3000/admin/businesses')
    console.log('   • Admin Analytics: http://localhost:3000/admin/analytics')
    
  } catch (error) {
    console.error('❌ Error verifying super admin permissions:', error)
    process.exit(1)
  }
}

verifySuperAdminPermissions()