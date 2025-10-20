import { dynamoClient, TABLE_NAMES } from './client'
import { 
  PutCommand, 
  QueryCommand, 
  ScanCommand 
} from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'

export interface AnalyticsEvent {
  id: string
  event_type: string
  payload_json: string
  business_id?: string
  user_id?: string
  created_at: string
}

/**
 * Create analytics event
 */
export async function createAnalyticsEvent(eventData: Omit<AnalyticsEvent, 'id' | 'created_at'>): Promise<AnalyticsEvent> {
  const event: AnalyticsEvent = {
    id: uuidv4(),
    ...eventData,
    created_at: new Date().toISOString(),
  }

  const command = new PutCommand({
    TableName: TABLE_NAMES.ANALYTICS_EVENTS,
    Item: event,
  })

  await dynamoClient.send(command)
  return event
}

/**
 * Get analytics events by type
 */
export async function getAnalyticsEventsByType(eventType: string, limit?: number): Promise<AnalyticsEvent[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.ANALYTICS_EVENTS,
    IndexName: 'event-type-index',
    KeyConditionExpression: 'event_type = :event_type',
    ExpressionAttributeValues: {
      ':event_type': eventType,
    },
    Limit: limit,
    ScanIndexForward: false, // Get most recent first
  })

  const result = await dynamoClient.send(command)
  return result.Items as AnalyticsEvent[] || []
}

/**
 * Get analytics events by business ID
 */
export async function getAnalyticsEventsByBusinessId(businessId: string, limit?: number): Promise<AnalyticsEvent[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.ANALYTICS_EVENTS,
    IndexName: 'business-id-index',
    KeyConditionExpression: 'business_id = :business_id',
    ExpressionAttributeValues: {
      ':business_id': businessId,
    },
    Limit: limit,
    ScanIndexForward: false, // Get most recent first
  })

  const result = await dynamoClient.send(command)
  return result.Items as AnalyticsEvent[] || []
}

/**
 * Get all analytics events
 */
export async function getAllAnalyticsEvents(limit?: number): Promise<AnalyticsEvent[]> {
  const command = new ScanCommand({
    TableName: TABLE_NAMES.ANALYTICS_EVENTS,
    Limit: limit,
  })

  const result = await dynamoClient.send(command)
  return result.Items as AnalyticsEvent[] || []
}