#!/usr/bin/env tsx

/**
 * DynamoDB Connection Test Script
 * 
 * This script tests the DynamoDB connection and basic operations.
 * Run this after setting up your AWS credentials to verify everything works.
 * 
 * Usage: npx tsx scripts/test-dynamodb-connection.ts
 */

import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { config } from 'dotenv'

// Load environment variables
config()

async function testDynamoDBConnection() {
  console.log('🧪 Testing DynamoDB Connection...\n')

  // Check environment variables
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ AWS credentials not found in environment variables')
    console.error('Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file')
    process.exit(1)
  }

  console.log(`📍 AWS Region: ${process.env.AWS_REGION || 'us-east-1'}`)
  console.log(`🔗 DynamoDB Endpoint: ${process.env.DYNAMODB_ENDPOINT || 'default'}`)
  console.log(`🔑 Access Key ID: ${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...`)
  console.log('')

  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    endpoint: process.env.DYNAMODB_ENDPOINT,
  })

  const docClient = DynamoDBDocumentClient.from(client)

  try {
    // Test 1: List tables
    console.log('1️⃣ Testing table listing...')
    const listCommand = new ListTablesCommand({})
    const result = await client.send(listCommand)
    
    const xianfeastTables = result.TableNames?.filter(name => name.startsWith('xianfeast_')) || []
    
    if (xianfeastTables.length > 0) {
      console.log(`✅ Found ${xianfeastTables.length} XianFeast tables:`)
      xianfeastTables.forEach(table => console.log(`   • ${table}`))
    } else {
      console.log('⚠️  No XianFeast tables found. Run `npm run create-dynamodb-tables` to create them.')
    }

    // Test 2: Basic read/write operation (if tables exist)
    if (xianfeastTables.length > 0) {
      console.log('\n2️⃣ Testing basic read/write operations...')
      
      const testTable = 'xianfeast_users'
      const testId = `test-${Date.now()}`
      
      // Write test item
      const putCommand = new PutCommand({
        TableName: testTable,
        Item: {
          id: testId,
          email: 'test@example.com',
          name: 'Test User',
          created_at: new Date().toISOString(),
          status: 'active'
        }
      })
      
      await docClient.send(putCommand)
      console.log(`✅ Successfully wrote test item to ${testTable}`)
      
      // Read test item
      const getCommand = new GetCommand({
        TableName: testTable,
        Key: { id: testId }
      })
      
      const getResult = await docClient.send(getCommand)
      
      if (getResult.Item) {
        console.log(`✅ Successfully read test item: ${getResult.Item.name}`)
      } else {
        console.log('❌ Failed to read test item')
      }
    }

    console.log('\n🎉 DynamoDB connection test completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('  1. If no tables found, run: npm run create-dynamodb-tables')
    console.log('  2. Start migrating data from Google Sheets')
    console.log('  3. Update your application code to use DynamoDB')

  } catch (error: any) {
    console.error('\n❌ DynamoDB connection test failed:')
    console.error(`   Error: ${error.message}`)
    
    if (error.name === 'CredentialsProviderError') {
      console.error('\n🔧 Troubleshooting:')
      console.error('   • Check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY')
      console.error('   • Verify the credentials are valid and have DynamoDB permissions')
      console.error('   • Test with AWS CLI: aws sts get-caller-identity')
    } else if (error.name === 'ResourceNotFoundException') {
      console.error('\n🔧 Troubleshooting:')
      console.error('   • Run: npm run create-dynamodb-tables')
      console.error('   • Check your AWS region setting')
    } else if (error.name === 'AccessDeniedException') {
      console.error('\n🔧 Troubleshooting:')
      console.error('   • Check IAM permissions for DynamoDB')
      console.error('   • Ensure your user has the required DynamoDB actions')
    }
    
    process.exit(1)
  }
}

if (require.main === module) {
  testDynamoDBConnection()
}
