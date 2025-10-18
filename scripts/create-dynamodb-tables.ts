#!/usr/bin/env tsx

/**
 * DynamoDB Table Creation Script for XianFeast
 * 
 * This script creates all required DynamoDB tables with proper schemas and indexes.
 * Run this once to set up your DynamoDB infrastructure.
 * 
 * Usage: npx tsx scripts/create-dynamodb-tables.ts
 */

import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb'
import { config } from 'dotenv'

// Load environment variables
config()

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  endpoint: process.env.DYNAMODB_ENDPOINT,
})

const TABLE_DEFINITIONS = [
  // Users table
  {
    TableName: 'xianfeast_users',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'email-index',
        KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      }
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
  },

  // User roles table
  {
    TableName: 'xianfeast_user_roles',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'user_id', AttributeType: 'S' },
      { AttributeName: 'role_id', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'user-id-index',
        KeySchema: [{ AttributeName: 'user_id', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      },
      {
        IndexName: 'role-id-index',
        KeySchema: [{ AttributeName: 'role_id', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      }
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
  },

  // Roles table
  {
    TableName: 'xianfeast_roles',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'business_id', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'business-id-index',
        KeySchema: [{ AttributeName: 'business_id', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      }
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
  },

  // Businesses table
  {
    TableName: 'xianfeast_businesses',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'owner_user_id', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'owner-user-id-index',
        KeySchema: [{ AttributeName: 'owner_user_id', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      }
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
  },

  // Stalls table
  {
    TableName: 'xianfeast_stalls',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'business_id', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'business-id-index',
        KeySchema: [{ AttributeName: 'business_id', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      }
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
  },

  // Products table
  {
    TableName: 'xianfeast_products',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'business_id', AttributeType: 'S' },
      { AttributeName: 'stall_id', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'business-id-index',
        KeySchema: [{ AttributeName: 'business_id', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      },
      {
        IndexName: 'stall-id-index',
        KeySchema: [{ AttributeName: 'stall_id', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      }
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
  },

  // Product images table
  {
    TableName: 'xianfeast_product_images',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'product_id', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'product-id-index',
        KeySchema: [{ AttributeName: 'product_id', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      }
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
  },

  // Orders table
  {
    TableName: 'xianfeast_orders',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'business_id', AttributeType: 'S' },
      { AttributeName: 'customer_user_id', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'business-id-index',
        KeySchema: [{ AttributeName: 'business_id', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      },
      {
        IndexName: 'customer-user-id-index',
        KeySchema: [{ AttributeName: 'customer_user_id', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      }
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
  },

  // Order items table
  {
    TableName: 'xianfeast_order_items',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'order_id', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'order-id-index',
        KeySchema: [{ AttributeName: 'order_id', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      }
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
  },

  // Magic links table
  {
    TableName: 'xianfeast_magic_links',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'token', AttributeType: 'S' },
      { AttributeName: 'user_id', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'token-index',
        KeySchema: [{ AttributeName: 'token', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      },
      {
        IndexName: 'user-id-index',
        KeySchema: [{ AttributeName: 'user_id', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      }
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
  },

  // OTP codes table
  {
    TableName: 'xianfeast_otp_codes',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'user_id', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'user-id-index',
        KeySchema: [{ AttributeName: 'user_id', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      }
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
  },

  // Analytics events table
  {
    TableName: 'xianfeast_analytics_events',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'event_type', AttributeType: 'S' },
      { AttributeName: 'created_at', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'event-type-index',
        KeySchema: [{ AttributeName: 'event_type', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      },
      {
        IndexName: 'created-at-index',
        KeySchema: [{ AttributeName: 'created_at', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      }
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
  },

  // Webhooks table
  {
    TableName: 'xianfeast_webhooks',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'business_id', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'business-id-index',
        KeySchema: [{ AttributeName: 'business_id', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      }
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
  },

  // Webhook logs table
  {
    TableName: 'xianfeast_webhook_logs',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'business_id', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'business-id-index',
        KeySchema: [{ AttributeName: 'business_id', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      }
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
  }
]

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }))
    return true
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      return false
    }
    throw error
  }
}

async function createTable(tableDefinition: any): Promise<void> {
  const { TableName } = tableDefinition
  
  try {
    if (await tableExists(TableName)) {
      console.log(`✓ Table ${TableName} already exists`)
      return
    }

    console.log(`Creating table ${TableName}...`)
    await client.send(new CreateTableCommand(tableDefinition))
    
    // Wait for table to be active
    let isActive = false
    while (!isActive) {
      const result = await client.send(new DescribeTableCommand({ TableName }))
      isActive = result.Table?.TableStatus === 'ACTIVE'
      if (!isActive) {
        console.log(`  Waiting for ${TableName} to be active...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    console.log(`✓ Table ${TableName} created successfully`)
  } catch (error: any) {
    console.error(`✗ Failed to create table ${TableName}:`, error.message)
    throw error
  }
}

async function main() {
  console.log('🚀 Creating DynamoDB tables for XianFeast...\n')

  // Check environment variables
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ AWS credentials not found in environment variables')
    console.error('Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file')
    process.exit(1)
  }

  console.log(`📍 AWS Region: ${process.env.AWS_REGION || 'us-east-1'}`)
  console.log(`🔗 DynamoDB Endpoint: ${process.env.DYNAMODB_ENDPOINT || 'default'}\n`)

  try {
    for (const tableDefinition of TABLE_DEFINITIONS) {
      await createTable(tableDefinition)
    }

    console.log('\n🎉 All DynamoDB tables created successfully!')
    console.log('\n📋 Created tables:')
    TABLE_DEFINITIONS.forEach(table => {
      console.log(`  • ${table.TableName}`)
    })

    console.log('\n🔧 Next steps:')
    console.log('  1. Update your .env file with your actual AWS credentials')
    console.log('  2. Run the migration script to copy data from Google Sheets')
    console.log('  3. Update your application to use DynamoDB instead of Google Sheets')

  } catch (error) {
    console.error('\n❌ Failed to create tables:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
