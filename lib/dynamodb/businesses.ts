import { DynamoDBClient, ScanCommand, QueryCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb'
import { v4 as uuidv4 } from 'uuid'

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const TABLE_NAMES = {
  BUSINESSES: process.env.DYNAMODB_BUSINESSES_TABLE || 'xianfeast_businesses',
  STALLS: process.env.DYNAMODB_STALLS_TABLE || 'xianfeast_stalls',
  PRODUCTS: process.env.DYNAMODB_PRODUCTS_TABLE || 'xianfeast_products',
  ORDERS: process.env.DYNAMODB_ORDERS_TABLE || 'xianfeast_orders',
}

export interface Business {
  id: string
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  owner_user_id: string
  status: string
  created_at: string
  updated_at: string
  settings_json?: string
}

export interface Stall {
  id: string
  business_id: string
  name: string
  description?: string
  pickup_address?: string
  open_hours_json?: string
  capacity_per_day: number
  status: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  stall_id: string
  business_id: string
  title: string
  short_desc?: string
  long_desc?: string
  price_cents: number
  currency: string
  sku?: string
  tags_csv?: string
  diet_flags_csv?: string
  prep_time_minutes: number
  inventory_qty: number
  status: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  business_id: string
  stall_id: string
  customer_name: string
  customer_email: string
  total_amount: number
  status: string
  created_at: string
  delivery_date: string
  items_json?: string
}

/**
 * Get business by ID
 */
export async function getBusinessById(businessId: string): Promise<Business | null> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.BUSINESSES,
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: {
      ':id': { S: businessId },
    },
  })

  const result = await dynamoClient.send(command)
  return result.Items?.[0] ? convertDynamoItemToBusiness(result.Items[0]) : null
}

/**
 * Get stalls by business ID
 */
export async function getStallsByBusinessId(businessId: string): Promise<Stall[]> {
  const command = new ScanCommand({
    TableName: TABLE_NAMES.STALLS,
    FilterExpression: 'business_id = :business_id',
    ExpressionAttributeValues: {
      ':business_id': { S: businessId },
    },
  })

  const result = await dynamoClient.send(command)
  return result.Items?.map(convertDynamoItemToStall) || []
}

/**
 * Get products by business ID
 */
export async function getProductsByBusinessId(businessId: string): Promise<Product[]> {
  const command = new ScanCommand({
    TableName: TABLE_NAMES.PRODUCTS,
    FilterExpression: 'business_id = :business_id',
    ExpressionAttributeValues: {
      ':business_id': { S: businessId },
    },
  })

  const result = await dynamoClient.send(command)
  return result.Items?.map(convertDynamoItemToProduct) || []
}

/**
 * Get orders by business ID
 */
export async function getOrdersByBusinessId(businessId: string): Promise<Order[]> {
  const command = new ScanCommand({
    TableName: TABLE_NAMES.ORDERS,
    FilterExpression: 'business_id = :business_id',
    ExpressionAttributeValues: {
      ':business_id': { S: businessId },
    },
  })

  const result = await dynamoClient.send(command)
  return result.Items?.map(convertDynamoItemToOrder) || []
}

/**
 * Create a new stall
 */
export async function createStall(stallData: Omit<Stall, 'id' | 'created_at' | 'updated_at'>): Promise<Stall> {
  const now = new Date().toISOString()
  const stall: Stall = {
    id: uuidv4(),
    ...stallData,
    created_at: now,
    updated_at: now,
  }

  const command = new PutItemCommand({
    TableName: TABLE_NAMES.STALLS,
    Item: convertStallToDynamoItem(stall),
  })

  await dynamoClient.send(command)
  return stall
}

/**
 * Update stall
 */
export async function updateStall(stallId: string, updates: Partial<Stall>): Promise<Stall | null> {
  const updateExpressions: string[] = []
  const expressionAttributeValues: Record<string, any> = {}
  const expressionAttributeNames: Record<string, string> = {}

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id') {
      const attrName = `#${key}`
      const attrValue = `:${key}`
      updateExpressions.push(`${attrName} = ${attrValue}`)
      expressionAttributeNames[attrName] = key
      expressionAttributeValues[attrValue] = convertValueToDynamoType(value)
    }
  })

  // Always update the updated_at field
  updateExpressions.push('#updated_at = :updated_at')
  expressionAttributeNames['#updated_at'] = 'updated_at'
  expressionAttributeValues[':updated_at'] = { S: new Date().toISOString() }

  const command = new UpdateItemCommand({
    TableName: TABLE_NAMES.STALLS,
    Key: { id: { S: stallId } },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  })

  const result = await dynamoClient.send(command)
  return result.Attributes ? convertDynamoItemToStall(result.Attributes) : null
}

// Helper functions to convert between DynamoDB format and TypeScript objects
function convertDynamoItemToBusiness(item: any): Business {
  return {
    id: item.id?.S || '',
    name: item.name?.S || '',
    description: item.description?.S,
    address: item.address?.S,
    phone: item.phone?.S,
    email: item.email?.S,
    owner_user_id: item.owner_user_id?.S || '',
    status: item.status?.S || 'active',
    created_at: item.created_at?.S || '',
    updated_at: item.updated_at?.S || '',
    settings_json: item.settings_json?.S,
  }
}

function convertDynamoItemToStall(item: any): Stall {
  return {
    id: item.id?.S || '',
    business_id: item.business_id?.S || '',
    name: item.name?.S || '',
    description: item.description?.S,
    pickup_address: item.pickup_address?.S,
    open_hours_json: item.open_hours_json?.S,
    capacity_per_day: parseInt(item.capacity_per_day?.N || '0'),
    status: item.status?.S || 'active',
    created_at: item.created_at?.S || '',
    updated_at: item.updated_at?.S || '',
  }
}

function convertDynamoItemToProduct(item: any): Product {
  return {
    id: item.id?.S || '',
    stall_id: item.stall_id?.S || '',
    business_id: item.business_id?.S || '',
    title: item.title?.S || '',
    short_desc: item.short_desc?.S,
    long_desc: item.long_desc?.S,
    price_cents: parseInt(item.price_cents?.N || '0'),
    currency: item.currency?.S || 'USD',
    sku: item.sku?.S,
    tags_csv: item.tags_csv?.S,
    diet_flags_csv: item.diet_flags_csv?.S,
    prep_time_minutes: parseInt(item.prep_time_minutes?.N || '0'),
    inventory_qty: parseInt(item.inventory_qty?.N || '0'),
    status: item.status?.S || 'draft',
    created_by: item.created_by?.S || '',
    created_at: item.created_at?.S || '',
    updated_at: item.updated_at?.S || '',
  }
}

function convertDynamoItemToOrder(item: any): Order {
  return {
    id: item.id?.S || '',
    business_id: item.business_id?.S || '',
    stall_id: item.stall_id?.S || '',
    customer_name: item.customer_name?.S || '',
    customer_email: item.customer_email?.S || '',
    total_amount: parseFloat(item.total_amount?.N || '0'),
    status: item.status?.S || 'pending',
    created_at: item.created_at?.S || '',
    delivery_date: item.delivery_date?.S || '',
    items_json: item.items_json?.S,
  }
}

function convertStallToDynamoItem(stall: Stall): Record<string, any> {
  return {
    id: { S: stall.id },
    business_id: { S: stall.business_id },
    name: { S: stall.name },
    description: stall.description ? { S: stall.description } : undefined,
    pickup_address: stall.pickup_address ? { S: stall.pickup_address } : undefined,
    open_hours_json: stall.open_hours_json ? { S: stall.open_hours_json } : undefined,
    capacity_per_day: { N: stall.capacity_per_day.toString() },
    status: { S: stall.status },
    created_at: { S: stall.created_at },
    updated_at: { S: stall.updated_at },
  }
}

function convertValueToDynamoType(value: any): any {
  if (typeof value === 'string') {
    return { S: value }
  } else if (typeof value === 'number') {
    return { N: value.toString() }
  } else if (typeof value === 'boolean') {
    return { BOOL: value }
  }
  return { S: String(value) }
}