import { dynamoClient, TABLE_NAMES } from './client'
import { 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  QueryCommand, 
  ScanCommand 
} from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'

export interface Stall {
  id: string
  business_id: string
  name: string
  description: string
  pickup_address: string
  open_hours_json: string
  capacity_per_day: number
  cuisine_type?: string
  status: 'pending' | 'active' | 'suspended' | 'deleted'
  created_at: string
  updated_at: string
}

/**
 * Create a new stall
 */
export async function createStall(stallData: Omit<Stall, 'id' | 'created_at' | 'updated_at'>): Promise<Stall> {
  const stall: Stall = {
    id: uuidv4(),
    ...stallData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const command = new PutCommand({
    TableName: TABLE_NAMES.STALLS,
    Item: stall,
  })

  await dynamoClient.send(command)
  return stall
}

/**
 * Get stall by ID
 */
export async function getStallById(id: string): Promise<Stall | null> {
  const command = new GetCommand({
    TableName: TABLE_NAMES.STALLS,
    Key: { id },
  })

  const result = await dynamoClient.send(command)
  return result.Item as Stall || null
}

/**
 * Get stalls by business ID
 */
export async function getStallsByBusinessId(businessId: string): Promise<Stall[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.STALLS,
    IndexName: 'business-id-index',
    KeyConditionExpression: 'business_id = :business_id',
    ExpressionAttributeValues: {
      ':business_id': businessId,
    },
  })

  const result = await dynamoClient.send(command)
  return result.Items as Stall[] || []
}

/**
 * Update stall
 */
export async function updateStall(id: string, updates: Partial<Stall>): Promise<Stall | null> {
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
    TableName: TABLE_NAMES.STALLS,
    Key: { id },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  })

  const result = await dynamoClient.send(command)
  return result.Attributes as Stall || null
}

/**
 * Delete stall (soft delete by setting status)
 */
export async function deleteStall(id: string): Promise<void> {
  await updateStall(id, { status: 'deleted' })
}

/**
 * Get all stalls (with optional filters)
 */
export async function getAllStalls(filters?: {
  status?: string
  business_id?: string
}): Promise<Stall[]> {
  if (filters?.business_id) {
    return getStallsByBusinessId(filters.business_id)
  }

  const command = new ScanCommand({
    TableName: TABLE_NAMES.STALLS,
    FilterExpression: filters?.status ? '#status = :status' : undefined,
    ExpressionAttributeNames: filters?.status ? { '#status': 'status' } : undefined,
    ExpressionAttributeValues: filters?.status ? { ':status': filters.status } : undefined,
  })

  const result = await dynamoClient.send(command)
  return result.Items as Stall[] || []
}