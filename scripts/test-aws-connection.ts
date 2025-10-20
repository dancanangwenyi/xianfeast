#!/usr/bin/env tsx

/**
 * Test AWS DynamoDB connection
 */

import { config } from "dotenv"
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb'

config()

async function testAWSConnection() {
  console.log("🔍 Testing AWS DynamoDB Connection")
  console.log("=" .repeat(50))
  
  console.log("📋 Configuration:")
  console.log(`   AWS_REGION: ${process.env.AWS_REGION}`)
  console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 8)}...`)
  console.log(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '[SET]' : '[NOT SET]'}`)
  console.log(`   DYNAMODB_ENDPOINT: ${process.env.DYNAMODB_ENDPOINT}`)

  try {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      endpoint: process.env.DYNAMODB_ENDPOINT,
    })

    console.log("\n🔗 Testing connection...")
    const command = new ListTablesCommand({})
    const response = await client.send(command)
    
    console.log("✅ Connection successful!")
    console.log(`📊 Found ${response.TableNames?.length || 0} tables:`)
    
    if (response.TableNames) {
      response.TableNames.forEach(tableName => {
        console.log(`   - ${tableName}`)
      })
    }
    
    // Check if our tables exist
    const ourTables = [
      'xianfeast_users',
      'xianfeast_roles', 
      'xianfeast_user_roles'
    ]
    
    console.log("\n🔍 Checking required tables:")
    ourTables.forEach(tableName => {
      const exists = response.TableNames?.includes(tableName)
      console.log(`   ${exists ? '✅' : '❌'} ${tableName}`)
    })
    
  } catch (error) {
    console.error("❌ Connection failed:", error.message)
    
    if (error.message.includes('UnrecognizedClientException')) {
      console.log("\n🔧 Possible Issues:")
      console.log("   1. AWS Access Key ID is incorrect")
      console.log("   2. AWS Secret Access Key is incorrect")
      console.log("   3. The credentials have expired")
      console.log("   4. The user doesn't have DynamoDB permissions")
    } else if (error.message.includes('InvalidSignatureException')) {
      console.log("\n🔧 Possible Issues:")
      console.log("   1. AWS Secret Access Key is incorrect")
      console.log("   2. System clock is out of sync")
    } else if (error.message.includes('AccessDeniedException')) {
      console.log("\n🔧 Possible Issues:")
      console.log("   1. The user doesn't have DynamoDB permissions")
      console.log("   2. The region is incorrect")
    }
  }
}

if (require.main === module) {
  testAWSConnection().catch(console.error)
}

export { testAWSConnection }