#!/usr/bin/env tsx

import { config } from 'dotenv'
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb'

// Load environment variables
config()

async function testDynamoDBConnection() {
  console.log('🔧 Testing DynamoDB Connection')
  console.log('==================================================')
  
  try {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'eu-north-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })

    console.log('📡 Attempting to connect to DynamoDB...')
    console.log(`   Region: ${process.env.AWS_REGION}`)
    console.log(`   Access Key ID: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 8)}...`)
    
    const command = new ListTablesCommand({})
    const result = await client.send(command)
    
    console.log('✅ Connection successful!')
    console.log(`📊 Found ${result.TableNames?.length || 0} tables:`)
    
    if (result.TableNames) {
      result.TableNames.forEach((tableName, index) => {
        console.log(`   ${index + 1}. ${tableName}`)
      })
    }
    
  } catch (error) {
    console.error('❌ DynamoDB connection failed:', error)
    process.exit(1)
  }
}

testDynamoDBConnection()