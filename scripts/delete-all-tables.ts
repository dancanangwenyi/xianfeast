#!/usr/bin/env tsx

import { config } from 'dotenv'
import { DynamoDBClient, ListTablesCommand, DeleteTableCommand } from '@aws-sdk/client-dynamodb'

// Load environment variables
config()

async function deleteAllTables() {
  console.log('🗑️  Deleting All DynamoDB Tables')
  console.log('==================================================')
  
  try {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'eu-north-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })

    // List all tables
    console.log('📡 Listing all tables...')
    const listCommand = new ListTablesCommand({})
    const listResult = await client.send(listCommand)
    
    const xianfeastTables = listResult.TableNames?.filter(name => name.startsWith('xianfeast_')) || []
    
    if (xianfeastTables.length === 0) {
      console.log('✅ No XianFeast tables found to delete.')
      return
    }
    
    console.log(`📊 Found ${xianfeastTables.length} XianFeast tables to delete:`)
    xianfeastTables.forEach((tableName, index) => {
      console.log(`   ${index + 1}. ${tableName}`)
    })
    
    // Delete each table
    console.log('\n🗑️  Deleting tables...')
    for (const tableName of xianfeastTables) {
      try {
        console.log(`   Deleting ${tableName}...`)
        const deleteCommand = new DeleteTableCommand({
          TableName: tableName
        })
        await client.send(deleteCommand)
        console.log(`   ✅ ${tableName} deleted successfully`)
      } catch (error) {
        console.error(`   ❌ Failed to delete ${tableName}:`, error.message)
      }
    }
    
    console.log('\n✅ All tables deletion initiated!')
    console.log('⏳ Note: Tables may take a few moments to be fully deleted.')
    
  } catch (error) {
    console.error('❌ Error deleting tables:', error)
    process.exit(1)
  }
}

deleteAllTables()