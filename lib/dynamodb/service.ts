import { 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand, 
  ScanCommand,
  BatchWriteCommand,
  BatchGetCommand,
  DynamoDBDocumentClient 
} from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
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

export const dynamoClient = DynamoDBDocumentClient.from(client)

// Table names
export const TABLE_NAMES = {
  USERS: process.env.DYNAMODB_TABLE_USERS || 'xianfeast_users',
  USER_ROLES: process.env.DYNAMODB_TABLE_USER_ROLES || 'xianfeast_user_roles',
  ROLES: process.env.DYNAMODB_TABLE_ROLES || 'xianfeast_roles',
  BUSINESSES: process.env.DYNAMODB_TABLE_BUSINESSES || 'xianfeast_businesses',
  STALLS: process.env.DYNAMODB_TABLE_STALLS || 'xianfeast_stalls',
  PRODUCTS: process.env.DYNAMODB_TABLE_PRODUCTS || 'xianfeast_products',
  PRODUCT_IMAGES: process.env.DYNAMODB_TABLE_PRODUCT_IMAGES || 'xianfeast_product_images',
  ORDERS: process.env.DYNAMODB_TABLE_ORDERS || 'xianfeast_orders',
  ORDER_ITEMS: process.env.DYNAMODB_TABLE_ORDER_ITEMS || 'xianfeast_order_items',
  MAGIC_LINKS: process.env.DYNAMODB_TABLE_MAGIC_LINKS || 'xianfeast_magic_links',
  OTP_CODES: process.env.DYNAMODB_TABLE_OTP_CODES || 'xianfeast_otp_codes',
  ANALYTICS_EVENTS: process.env.DYNAMODB_TABLE_ANALYTICS_EVENTS || 'xianfeast_analytics_events',
  WEBHOOKS: process.env.DYNAMODB_TABLE_WEBHOOKS || 'xianfeast_webhooks',
  WEBHOOK_LOGS: process.env.DYNAMODB_TABLE_WEBHOOK_LOGS || 'xianfeast_webhook_logs',
} as const

export interface DynamoDBItem {
  [key: string]: any
}

/**
 * Generic DynamoDB operations
 */
export class DynamoDBService {
  constructor(private client: DynamoDBDocumentClient) {}

  /**
   * Put (create/update) an item
   */
  async putItem(tableName: string, item: DynamoDBItem): Promise<void> {
    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    })
    await this.client.send(command)
  }

  /**
   * Get an item by primary key
   */
  async getItem(tableName: string, key: DynamoDBItem): Promise<DynamoDBItem | null> {
    const command = new GetCommand({
      TableName: tableName,
      Key: key,
    })
    const result = await this.client.send(command)
    return result.Item || null
  }

  /**
   * Update an item
   */
  async updateItem(
    tableName: string, 
    key: DynamoDBItem, 
    updates: DynamoDBItem,
    conditionExpression?: string,
    expressionAttributeValues?: DynamoDBItem
  ): Promise<void> {
    const updateExpression = Object.keys(updates)
      .map(key => `#${key} = :${key}`)
      .join(', ')
    
    const expressionAttributeNames = Object.keys(updates).reduce((acc, key) => {
      acc[`#${key}`] = key
      return acc
    }, {} as DynamoDBItem)

    const command = new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: `SET ${updateExpression}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: {
        ...Object.keys(updates).reduce((acc, key) => {
          acc[`:${key}`] = updates[key]
          return acc
        }, {} as DynamoDBItem),
        ...expressionAttributeValues,
      },
      ConditionExpression: conditionExpression,
    })
    await this.client.send(command)
  }

  /**
   * Delete an item
   */
  async deleteItem(tableName: string, key: DynamoDBItem): Promise<void> {
    const command = new DeleteCommand({
      TableName: tableName,
      Key: key,
    })
    await this.client.send(command)
  }

  /**
   * Query items by GSI
   */
  async queryItems(
    tableName: string,
    indexName: string,
    keyConditionExpression: string,
    expressionAttributeValues: DynamoDBItem,
    expressionAttributeNames?: DynamoDBItem
  ): Promise<DynamoDBItem[]> {
    const command = new QueryCommand({
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
    })
    const result = await this.client.send(command)
    return result.Items || []
  }

  /**
   * Scan all items (use sparingly)
   */
  async scanItems(tableName: string, limit?: number): Promise<DynamoDBItem[]> {
    const command = new ScanCommand({
      TableName: tableName,
      Limit: limit,
    })
    const result = await this.client.send(command)
    return result.Items || []
  }

  /**
   * Batch write items
   */
  async batchWriteItems(tableName: string, items: DynamoDBItem[]): Promise<void> {
    const chunks = this.chunkArray(items, 25) // DynamoDB batch limit
    
    for (const chunk of chunks) {
      const command = new BatchWriteCommand({
        RequestItems: {
          [tableName]: chunk.map(item => ({
            PutRequest: { Item: item }
          }))
        }
      })
      await this.client.send(command)
    }
  }

  /**
   * Batch get items
   */
  async batchGetItems(tableName: string, keys: DynamoDBItem[]): Promise<DynamoDBItem[]> {
    const chunks = this.chunkArray(keys, 100) // DynamoDB batch limit
    const allItems: DynamoDBItem[] = []
    
    for (const chunk of chunks) {
      const command = new BatchGetCommand({
        RequestItems: {
          [tableName]: {
            Keys: chunk
          }
        }
      })
      const result = await this.client.send(command)
      if (result.Responses?.[tableName]) {
        allItems.push(...result.Responses[tableName])
      }
    }
    
    return allItems
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

// Create a singleton instance
export const dynamoService = new DynamoDBService(dynamoClient)

// Convenience functions for common operations
export async function putItem(tableName: string, item: DynamoDBItem): Promise<void> {
  return dynamoService.putItem(tableName, item)
}

export async function getItem(tableName: string, key: DynamoDBItem): Promise<DynamoDBItem | null> {
  return dynamoService.getItem(tableName, key)
}

export async function updateItem(
  tableName: string, 
  key: DynamoDBItem, 
  updates: DynamoDBItem,
  conditionExpression?: string,
  expressionAttributeValues?: DynamoDBItem
): Promise<void> {
  return dynamoService.updateItem(tableName, key, updates, conditionExpression, expressionAttributeValues)
}

export async function deleteItem(tableName: string, key: DynamoDBItem): Promise<void> {
  return dynamoService.deleteItem(tableName, key)
}

export async function queryItems(
  tableName: string,
  indexName: string,
  keyConditionExpression: string,
  expressionAttributeValues: DynamoDBItem,
  expressionAttributeNames?: DynamoDBItem
): Promise<DynamoDBItem[]> {
  return dynamoService.queryItems(tableName, indexName, keyConditionExpression, expressionAttributeValues, expressionAttributeNames)
}

export async function scanItems(tableName: string, limit?: number): Promise<DynamoDBItem[]> {
  return dynamoService.scanItems(tableName, limit)
}

export async function batchWriteItems(tableName: string, items: DynamoDBItem[]): Promise<void> {
  return dynamoService.batchWriteItems(tableName, items)
}

export async function batchGetItems(tableName: string, keys: DynamoDBItem[]): Promise<DynamoDBItem[]> {
  return dynamoService.batchGetItems(tableName, keys)
}
