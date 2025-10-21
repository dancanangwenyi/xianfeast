#!/usr/bin/env tsx

import { config } from 'dotenv'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'

// Load environment variables
config()

async function testScanUsers() {
  console.log('🔧 Testing Direct User Scan')
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
    
    console.log('📡 Scanning users table...')
    console.log(`   Table: ${process.env.DYNAMODB_TABLE_USERS}`)
    
    const command = new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE_USERS || 'xianfeast_users',
    })
    
    const result = await docClient.send(command)
    
    console.log('✅ Scan successful!')
    console.log(`📊 Found ${result.Items?.length || 0} users:`)
    
    if (result.Items) {
      result.Items.forEach((user, index) => {
        console.log(`\n👤 User ${index + 1}:`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Name: ${user.name}`)
        console.log(`   Status: ${user.status}`)
        console.log(`   Has Password: ${user.hashed_password ? 'Yes' : 'No'}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Scan failed:', error)
    process.exit(1)
  }
}

testScanUsers()