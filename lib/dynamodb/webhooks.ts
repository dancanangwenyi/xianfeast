import { dynamoClient, TABLE_NAMES } from './client'
import { 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand, 
  ScanCommand 
} from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'

export interface Webhook {
  id: string
  business_id: string
  event: string
  url: string
  secret: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface WebhookLog {
  id: string
  webhook_id: string
  event: string
  payload_json: string
  response_status: number
  response_body: string
  success: boolean
  created_at: string
}

/**
 * Create a new webhook
 */
export async function createWebhook(webhookData: Omit<Webhook, 'id' | 'created_at' | 'updated_at'>): Promise<Webhook> {
  const webhook: Webhook = {
    id: uuidv4(),
    ...webhookData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const command = new PutCommand({
    TableName: TABLE_NAMES.WEBHOOKS,
    Item: webhook,
  })

  await dynamoClient.send(command)
  return webhook
}

/**
 * Get webhook by ID
 */
export async function getWebhookById(id: string): Promise<Webhook | null> {
  const command = new GetCommand({
    TableName: TABLE_NAMES.WEBHOOKS,
    Key: { id },
  })

  const result = await dynamoClient.send(command)
  return result.Item as Webhook || null
}

/**
 * Get webhooks by business ID
 */
export async function getWebhooksByBusinessId(businessId: string): Promise<Webhook[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.WEBHOOKS,
    IndexName: 'business-id-index',
    KeyConditionExpression: 'business_id = :business_id',
    ExpressionAttributeValues: {
      ':business_id': businessId,
    },
  })

  const result = await dynamoClient.send(command)
  return result.Items as Webhook[] || []
}

/**
 * Get webhooks by event
 */
export async function getWebhooksByEvent(event: string): Promise<Webhook[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.WEBHOOKS,
    IndexName: 'event-index',
    KeyConditionExpression: '#event = :event',
    ExpressionAttributeNames: {
      '#event': 'event',
    },
    ExpressionAttributeValues: {
      ':event': event,
    },
  })

  const result = await dynamoClient.send(command)
  return result.Items as Webhook[] || []
}

/**
 * Update webhook
 */
export async function updateWebhook(id: string, updates: Partial<Webhook>): Promise<Webhook | null> {
  const updateExpressions: string[] = []
  const expressionAttributeValues: Record<string, any> = {}
  const expressionAttributeNames: Record<string, string> = {}

  // Build update expression dynamically
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      updateExpressions.push(`#${key} = :${key}`)
      expressionAttributeNames[`#${key}`] = key
      expressionAttributeValues[`:${key}`] = value
    }
  })

  if (updateExpressions.length === 0) {
    return null
  }

  updateExpressions.push('#updated_at = :updated_at')
  expressionAttributeNames['#updated_at'] = 'updated_at'
  expressionAttributeValues[':updated_at'] = new Date().toISOString()

  const command = new UpdateCommand({
    TableName: TABLE_NAMES.WEBHOOKS,
    Key: { id },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  })

  const result = await dynamoClient.send(command)
  return result.Attributes as Webhook || null
}

/**
 * Delete webhook
 */
export async function deleteWebhook(id: string): Promise<void> {
  const command = new DeleteCommand({
    TableName: TABLE_NAMES.WEBHOOKS,
    Key: { id },
  })

  await dynamoClient.send(command)
}

/**
 * Get all webhooks
 */
export async function getAllWebhooks(): Promise<Webhook[]> {
  const command = new ScanCommand({
    TableName: TABLE_NAMES.WEBHOOKS,
  })

  const result = await dynamoClient.send(command)
  return result.Items as Webhook[] || []
}

/**
 * Create webhook log
 */
export async function createWebhookLog(logData: Omit<WebhookLog, 'id' | 'created_at'>): Promise<WebhookLog> {
  const log: WebhookLog = {
    id: uuidv4(),
    ...logData,
    created_at: new Date().toISOString(),
  }

  const command = new PutCommand({
    TableName: TABLE_NAMES.WEBHOOK_LOGS,
    Item: log,
  })

  await dynamoClient.send(command)
  return log
}

/**
 * Get webhook logs by webhook ID
 */
export async function getWebhookLogs(webhookId: string, limit?: number): Promise<WebhookLog[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.WEBHOOK_LOGS,
    IndexName: 'webhook-id-index',
    KeyConditionExpression: 'webhook_id = :webhook_id',
    ExpressionAttributeValues: {
      ':webhook_id': webhookId,
    },
    Limit: limit,
    ScanIndexForward: false, // Get most recent first
  })

  const result = await dynamoClient.send(command)
  return result.Items as WebhookLog[] || []
}

/**
 * Get all webhook logs
 */
export async function getAllWebhookLogs(limit?: number): Promise<WebhookLog[]> {
  const command = new ScanCommand({
    TableName: TABLE_NAMES.WEBHOOK_LOGS,
    Limit: limit,
  })

  const result = await dynamoClient.send(command)
  return result.Items as WebhookLog[] || []
}