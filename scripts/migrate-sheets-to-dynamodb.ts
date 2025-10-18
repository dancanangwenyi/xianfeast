#!/usr/bin/env tsx

/**
 * Google Sheets to DynamoDB Migration Tool
 * 
 * This script migrates all data from Google Sheets to DynamoDB tables.
 * It handles all the existing data and ensures proper relationships.
 * 
 * Usage: npx tsx scripts/migrate-sheets-to-dynamodb.ts
 */

import { config } from 'dotenv'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import { google } from 'googleapis'
import { TABLE_NAMES } from '../lib/dynamodb/service'

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

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID

interface MigrationStats {
  users: number
  roles: number
  userRoles: number
  businesses: number
  stalls: number
  products: number
  orders: number
  orderItems: number
  errors: string[]
}

async function migrateData(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    users: 0,
    roles: 0,
    userRoles: 0,
    businesses: 0,
    stalls: 0,
    products: 0,
    orders: 0,
    orderItems: 0,
    errors: []
  }

  console.log('🚀 Starting Google Sheets to DynamoDB Migration...\n')

  try {
    // 1. Migrate Users
    console.log('1️⃣ Migrating Users...')
    await migrateUsers(stats)

    // 2. Migrate Roles
    console.log('\n2️⃣ Migrating Roles...')
    await migrateRoles(stats)

    // 3. Migrate User Roles
    console.log('\n3️⃣ Migrating User Roles...')
    await migrateUserRoles(stats)

    // 4. Migrate Businesses
    console.log('\n4️⃣ Migrating Businesses...')
    await migrateBusinesses(stats)

    // 5. Migrate Stalls
    console.log('\n5️⃣ Migrate Stalls...')
    await migrateStalls(stats)

    // 6. Migrate Products
    console.log('\n6️⃣ Migrating Products...')
    await migrateProducts(stats)

    // 7. Migrate Orders
    console.log('\n7️⃣ Migrating Orders...')
    await migrateOrders(stats)

    // 8. Migrate Order Items
    console.log('\n8️⃣ Migrating Order Items...')
    await migrateOrderItems(stats)

    console.log('\n🎉 Migration completed successfully!')
    console.log('\n📊 Migration Statistics:')
    console.log(`   • Users: ${stats.users}`)
    console.log(`   • Roles: ${stats.roles}`)
    console.log(`   • User Roles: ${stats.userRoles}`)
    console.log(`   • Businesses: ${stats.businesses}`)
    console.log(`   • Stalls: ${stats.stalls}`)
    console.log(`   • Products: ${stats.products}`)
    console.log(`   • Orders: ${stats.orders}`)
    console.log(`   • Order Items: ${stats.orderItems}`)

    if (stats.errors.length > 0) {
      console.log(`\n⚠️ Errors encountered: ${stats.errors.length}`)
      stats.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    stats.errors.push(`Migration failed: ${error}`)
  }

  return stats
}

async function migrateUsers(stats: MigrationStats): Promise<void> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'users!A:ZZ',
    })

    const rows = response.data.values || []
    const headers = rows[0] || []
    const dataRows = rows.slice(1)

    const users = dataRows.map(row => {
      const user: any = {}
      headers.forEach((header, index) => {
        user[header] = row[index] || ''
      })
      return user
    })

    // Batch write users
    const chunks = chunkArray(users, 25)
    for (const chunk of chunks) {
      const command = new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAMES.USERS]: chunk.map(user => ({
            PutRequest: { Item: user }
          }))
        }
      })
      await docClient.send(command)
    }

    stats.users = users.length
    console.log(`✅ Migrated ${users.length} users`)

  } catch (error) {
    const errorMsg = `Failed to migrate users: ${error}`
    console.error(`❌ ${errorMsg}`)
    stats.errors.push(errorMsg)
  }
}

async function migrateRoles(stats: MigrationStats): Promise<void> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'roles!A:ZZ',
    })

    const rows = response.data.values || []
    const headers = rows[0] || []
    const dataRows = rows.slice(1)

    const roles = dataRows.map(row => {
      const role: any = {}
      headers.forEach((header, index) => {
        role[header] = row[index] || ''
      })
      return role
    })

    // Batch write roles
    const chunks = chunkArray(roles, 25)
    for (const chunk of chunks) {
      const command = new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAMES.ROLES]: chunk.map(role => ({
            PutRequest: { Item: role }
          }))
        }
      })
      await docClient.send(command)
    }

    stats.roles = roles.length
    console.log(`✅ Migrated ${roles.length} roles`)

  } catch (error) {
    const errorMsg = `Failed to migrate roles: ${error}`
    console.error(`❌ ${errorMsg}`)
    stats.errors.push(errorMsg)
  }
}

async function migrateUserRoles(stats: MigrationStats): Promise<void> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'user_roles!A:ZZ',
    })

    const rows = response.data.values || []
    const headers = rows[0] || []
    const dataRows = rows.slice(1)

    const userRoles = dataRows.map(row => {
      const userRole: any = {}
      headers.forEach((header, index) => {
        userRole[header] = row[index] || ''
      })
      return userRole
    })

    // Batch write user roles
    const chunks = chunkArray(userRoles, 25)
    for (const chunk of chunks) {
      const command = new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAMES.USER_ROLES]: chunk.map(userRole => ({
            PutRequest: { Item: userRole }
          }))
        }
      })
      await docClient.send(command)
    }

    stats.userRoles = userRoles.length
    console.log(`✅ Migrated ${userRoles.length} user roles`)

  } catch (error) {
    const errorMsg = `Failed to migrate user roles: ${error}`
    console.error(`❌ ${errorMsg}`)
    stats.errors.push(errorMsg)
  }
}

async function migrateBusinesses(stats: MigrationStats): Promise<void> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'businesses!A:ZZ',
    })

    const rows = response.data.values || []
    const headers = rows[0] || []
    const dataRows = rows.slice(1)

    const businesses = dataRows.map(row => {
      const business: any = {}
      headers.forEach((header, index) => {
        business[header] = row[index] || ''
      })
      return business
    })

    // Batch write businesses
    const chunks = chunkArray(businesses, 25)
    for (const chunk of chunks) {
      const command = new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAMES.BUSINESSES]: chunk.map(business => ({
            PutRequest: { Item: business }
          }))
        }
      })
      await docClient.send(command)
    }

    stats.businesses = businesses.length
    console.log(`✅ Migrated ${businesses.length} businesses`)

  } catch (error) {
    const errorMsg = `Failed to migrate businesses: ${error}`
    console.error(`❌ ${errorMsg}`)
    stats.errors.push(errorMsg)
  }
}

async function migrateStalls(stats: MigrationStats): Promise<void> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'stalls!A:ZZ',
    })

    const rows = response.data.values || []
    const headers = rows[0] || []
    const dataRows = rows.slice(1)

    const stalls = dataRows.map(row => {
      const stall: any = {}
      headers.forEach((header, index) => {
        stall[header] = row[index] || ''
      })
      return stall
    })

    // Batch write stalls
    const chunks = chunkArray(stalls, 25)
    for (const chunk of chunks) {
      const command = new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAMES.STALLS]: chunk.map(stall => ({
            PutRequest: { Item: stall }
          }))
        }
      })
      await docClient.send(command)
    }

    stats.stalls = stalls.length
    console.log(`✅ Migrated ${stalls.length} stalls`)

  } catch (error) {
    const errorMsg = `Failed to migrate stalls: ${error}`
    console.error(`❌ ${errorMsg}`)
    stats.errors.push(errorMsg)
  }
}

async function migrateProducts(stats: MigrationStats): Promise<void> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'products!A:ZZ',
    })

    const rows = response.data.values || []
    const headers = rows[0] || []
    const dataRows = rows.slice(1)

    const products = dataRows.map(row => {
      const product: any = {}
      headers.forEach((header, index) => {
        product[header] = row[index] || ''
      })
      return product
    })

    // Batch write products
    const chunks = chunkArray(products, 25)
    for (const chunk of chunks) {
      const command = new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAMES.PRODUCTS]: chunk.map(product => ({
            PutRequest: { Item: product }
          }))
        }
      })
      await docClient.send(command)
    }

    stats.products = products.length
    console.log(`✅ Migrated ${products.length} products`)

  } catch (error) {
    const errorMsg = `Failed to migrate products: ${error}`
    console.error(`❌ ${errorMsg}`)
    stats.errors.push(errorMsg)
  }
}

async function migrateOrders(stats: MigrationStats): Promise<void> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'orders!A:ZZ',
    })

    const rows = response.data.values || []
    const headers = rows[0] || []
    const dataRows = rows.slice(1)

    const orders = dataRows.map(row => {
      const order: any = {}
      headers.forEach((header, index) => {
        order[header] = row[index] || ''
      })
      return order
    })

    // Batch write orders
    const chunks = chunkArray(orders, 25)
    for (const chunk of chunks) {
      const command = new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAMES.ORDERS]: chunk.map(order => ({
            PutRequest: { Item: order }
          }))
        }
      })
      await docClient.send(command)
    }

    stats.orders = orders.length
    console.log(`✅ Migrated ${orders.length} orders`)

  } catch (error) {
    const errorMsg = `Failed to migrate orders: ${error}`
    console.error(`❌ ${errorMsg}`)
    stats.errors.push(errorMsg)
  }
}

async function migrateOrderItems(stats: MigrationStats): Promise<void> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'order_items!A:ZZ',
    })

    const rows = response.data.values || []
    const headers = rows[0] || []
    const dataRows = rows.slice(1)

    const orderItems = dataRows.map(row => {
      const orderItem: any = {}
      headers.forEach((header, index) => {
        orderItem[header] = row[index] || ''
      })
      return orderItem
    })

    // Batch write order items
    const chunks = chunkArray(orderItems, 25)
    for (const chunk of chunks) {
      const command = new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAMES.ORDER_ITEMS]: chunk.map(orderItem => ({
            PutRequest: { Item: orderItem }
          }))
        }
      })
      await docClient.send(command)
    }

    stats.orderItems = orderItems.length
    console.log(`✅ Migrated ${orderItems.length} order items`)

  } catch (error) {
    const errorMsg = `Failed to migrate order items: ${error}`
    console.error(`❌ ${errorMsg}`)
    stats.errors.push(errorMsg)
  }
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

if (require.main === module) {
  migrateData()
}
