/**
 * DynamoDB API Service
 * Provides high-level functions for API routes
 */

import { 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand, 
  ScanCommand 
} from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { dynamoClient, TABLE_NAMES } from './client'

export interface DataRow {
  [key: string]: any
}

/**
 * Get all rows from a table
 */
export async function getAllRows(tableName: string): Promise<DataRow[]> {
  const command = new ScanCommand({
    TableName: tableName,
  })
  
  const result = await dynamoClient.send(command)
  return result.Items || []
}

/**
 * Query rows with conditions
 */
export async function queryRows(tableName: string, conditions: { [key: string]: any }): Promise<DataRow[]> {
  // For simple queries, we'll use scan with filter
  const command = new ScanCommand({
    TableName: tableName,
  })
  
  const result = await dynamoClient.send(command)
  const items = result.Items || []
  
  // Filter items based on conditions
  return items.filter(item => {
    return Object.entries(conditions).every(([key, value]) => {
      if (value === null || value === undefined) {
        return item[key] === null || item[key] === undefined
      }
      return item[key] === value
    })
  })
}

/**
 * Get a single row by ID
 */
export async function getRow(tableName: string, id: string): Promise<DataRow | null> {
  const command = new GetCommand({
    TableName: tableName,
    Key: { id },
  })
  
  const result = await dynamoClient.send(command)
  return result.Item || null
}

/**
 * Append a new row
 */
export async function appendRow(tableName: string, data: DataRow): Promise<string> {
  const id = data.id || uuidv4()
  const timestamp = new Date().toISOString()
  
  const item = {
    ...data,
    id,
    created_at: data.created_at || timestamp,
    updated_at: timestamp,
  }
  
  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  })
  
  await dynamoClient.send(command)
  return id
}

/**
 * Update an existing row
 */
export async function updateRow(tableName: string, id: string, updates: DataRow): Promise<void> {
  const updatesWithTimestamp = {
    ...updates,
    updated_at: new Date().toISOString(),
  }
  
  const updateExpression = Object.keys(updatesWithTimestamp)
    .map(key => `#${key} = :${key}`)
    .join(', ')
  
  const expressionAttributeNames = Object.keys(updatesWithTimestamp).reduce((acc, key) => {
    acc[`#${key}`] = key
    return acc
  }, {} as Record<string, string>)

  const expressionAttributeValues = Object.keys(updatesWithTimestamp).reduce((acc, key) => {
    acc[`:${key}`] = updatesWithTimestamp[key]
    return acc
  }, {} as Record<string, any>)

  const command = new UpdateCommand({
    TableName: tableName,
    Key: { id },
    UpdateExpression: `SET ${updateExpression}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  })
  
  await dynamoClient.send(command)
}

/**
 * Delete a row
 */
export async function deleteRow(tableName: string, id: string): Promise<void> {
  const command = new DeleteCommand({
    TableName: tableName,
    Key: { id },
  })
  
  await dynamoClient.send(command)
}

/**
 * Get rows with pagination
 */
export async function getRows(tableName: string, limit?: number): Promise<DataRow[]> {
  const command = new ScanCommand({
    TableName: tableName,
    Limit: limit,
  })
  
  const result = await dynamoClient.send(command)
  return result.Items || []
}

// Table name mappings for backward compatibility
export const SHEET_TO_TABLE = {
  'users': TABLE_NAMES.USERS,
  'roles': TABLE_NAMES.ROLES,
  'user_roles': TABLE_NAMES.USER_ROLES,
  'businesses': TABLE_NAMES.BUSINESSES,
  'stalls': TABLE_NAMES.STALLS,
  'products': TABLE_NAMES.PRODUCTS,
  'product_images': TABLE_NAMES.PRODUCT_IMAGES,
  'orders': TABLE_NAMES.ORDERS,
  'order_items': TABLE_NAMES.ORDER_ITEMS,
  'magic_links': TABLE_NAMES.MAGIC_LINKS,
  'otp_codes': TABLE_NAMES.OTP_CODES,
  'analytics_events': TABLE_NAMES.ANALYTICS_EVENTS,
  'webhooks': TABLE_NAMES.WEBHOOKS,
  'webhook_logs': TABLE_NAMES.WEBHOOK_LOGS,
} as const

/**
 * Helper function to get table name from sheet name
 */
export function getTableName(sheetName: string): string {
  return SHEET_TO_TABLE[sheetName as keyof typeof SHEET_TO_TABLE] || sheetName
}

// Convenience functions that automatically map sheet names to table names
export async function getAllRowsFromSheet(sheetName: string): Promise<DataRow[]> {
  return getAllRows(getTableName(sheetName))
}

export async function queryRowsFromSheet(sheetName: string, conditions: { [key: string]: any }): Promise<DataRow[]> {
  return queryRows(getTableName(sheetName), conditions)
}

export async function getRowFromSheet(sheetName: string, id: string): Promise<DataRow | null> {
  return getRow(getTableName(sheetName), id)
}

export async function appendRowToSheet(sheetName: string, data: DataRow): Promise<string> {
  return appendRow(getTableName(sheetName), data)
}

export async function updateRowInSheet(sheetName: string, id: string, updates: DataRow): Promise<void> {
  return updateRow(getTableName(sheetName), id, updates)
}

export async function deleteRowFromSheet(sheetName: string, id: string): Promise<void> {
  return deleteRow(getTableName(sheetName), id)
}

export default {
  getAllRows,
  queryRows,
  getRow,
  appendRow,
  updateRow,
  deleteRow,
  getRows,
  getAllRowsFromSheet,
  queryRowsFromSheet,
  getRowFromSheet,
  appendRowToSheet,
  updateRowInSheet,
  deleteRowFromSheet,
  getTableName,
  SHEET_TO_TABLE,
}