import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
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

const docClient = DynamoDBDocumentClient.from(client)

// Table names
const TABLE_NAMES = {
  BUSINESSES: process.env.DYNAMODB_TABLE_BUSINESSES || 'xianfeast_businesses',
  USERS: process.env.DYNAMODB_TABLE_USERS || 'xianfeast_users',
  USER_ROLES: process.env.DYNAMODB_TABLE_USER_ROLES || 'xianfeast_user_roles',
  ROLES: process.env.DYNAMODB_TABLE_ROLES || 'xianfeast_roles',
  STALLS: process.env.DYNAMODB_TABLE_STALLS || 'xianfeast_stalls',
  PRODUCTS: process.env.DYNAMODB_TABLE_PRODUCTS || 'xianfeast_products',
  MAGIC_LINKS: process.env.DYNAMODB_TABLE_MAGIC_LINKS || 'xianfeast_magic_links',
} as const

export interface Business {
  id: string
  name: string
  description: string
  address: string
  phone: string
  email: string
  owner_user_id: string
  status: 'pending' | 'active' | 'suspended'
  created_at: string
  updated_at: string
  settings_json: string
}

export interface Stall {
  id: string
  business_id: string
  name: string
  description: string
  status: 'pending' | 'active' | 'suspended'
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  business_id: string
  stall_id: string
  name: string
  description: string
  price: number
  category: string
  status: 'pending' | 'active' | 'suspended'
  created_at: string
  updated_at: string
}

export interface MagicLink {
  id: string
  token: string
  user_id: string
  business_id: string
  type: 'business_invitation' | 'password_reset' | 'user_invitation'
  expires_at: string
  used: boolean
  created_at: string
}

/**
 * Create a new business
 */
export async function createBusiness(businessData: Omit<Business, 'id' | 'created_at' | 'updated_at'>): Promise<Business> {
  const businessId = `biz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const business: Business = {
    id: businessId,
    ...businessData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  
  const command = new PutCommand({
    TableName: TABLE_NAMES.BUSINESSES,
    Item: business,
  })
  
  await docClient.send(command)
  return business
}

/**
 * Get business by ID
 */
export async function getBusinessById(businessId: string): Promise<Business | null> {
  const command = new GetCommand({
    TableName: TABLE_NAMES.BUSINESSES,
    Key: { id: businessId },
  })
  
  const result = await docClient.send(command)
  return result.Item as Business || null
}

/**
 * Get all businesses
 */
export async function getAllBusinesses(): Promise<Business[]> {
  const command = new ScanCommand({
    TableName: TABLE_NAMES.BUSINESSES,
  })
  
  const result = await docClient.send(command)
  return result.Items as Business[] || []
}

/**
 * Update business
 */
export async function updateBusiness(businessId: string, updates: Partial<Business>): Promise<Business | null> {
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
    TableName: TABLE_NAMES.BUSINESSES,
    Key: { id: businessId },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  })
  
  const result = await docClient.send(command)
  return result.Attributes as Business || null
}

/**
 * Create a stall
 */
export async function createStall(stallData: Omit<Stall, 'id' | 'created_at' | 'updated_at'>): Promise<Stall> {
  const stallId = `stall_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const stall: Stall = {
    id: stallId,
    ...stallData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  
  const command = new PutCommand({
    TableName: TABLE_NAMES.STALLS,
    Item: stall,
  })
  
  await docClient.send(command)
  return stall
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
  
  const result = await docClient.send(command)
  return result.Items as Stall[] || []
}

/**
 * Create a product
 */
export async function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const product: Product = {
    id: productId,
    ...productData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  
  const command = new PutCommand({
    TableName: TABLE_NAMES.PRODUCTS,
    Item: product,
  })
  
  await docClient.send(command)
  return product
}

/**
 * Get products by business ID
 */
export async function getProductsByBusinessId(businessId: string): Promise<Product[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.PRODUCTS,
    IndexName: 'business-id-index',
    KeyConditionExpression: 'business_id = :business_id',
    ExpressionAttributeValues: {
      ':business_id': businessId,
    },
  })
  
  const result = await docClient.send(command)
  return result.Items as Product[] || []
}

/**
 * Get products by stall ID
 */
export async function getProductsByStallId(stallId: string): Promise<Product[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.PRODUCTS,
    IndexName: 'stall-id-index',
    KeyConditionExpression: 'stall_id = :stall_id',
    ExpressionAttributeValues: {
      ':stall_id': stallId,
    },
  })
  
  const result = await docClient.send(command)
  return result.Items as Product[] || []
}

/**
 * Create a magic link
 */
export async function createMagicLink(magicLinkData: Omit<MagicLink, 'id' | 'created_at'>): Promise<MagicLink> {
  const magicLinkId = `magic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const magicLink: MagicLink = {
    id: magicLinkId,
    ...magicLinkData,
    created_at: new Date().toISOString(),
  }
  
  const command = new PutCommand({
    TableName: TABLE_NAMES.MAGIC_LINKS,
    Item: magicLink,
  })
  
  await docClient.send(command)
  return magicLink
}

/**
 * Get magic link by token
 */
export async function getMagicLinkByToken(token: string): Promise<MagicLink | null> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.MAGIC_LINKS,
    IndexName: 'token-index',
    KeyConditionExpression: '#token = :token',
    ExpressionAttributeNames: {
      '#token': 'token',
    },
    ExpressionAttributeValues: {
      ':token': token,
    },
  })
  
  const result = await docClient.send(command)
  return result.Items?.[0] as MagicLink || null
}

/**
 * Mark magic link as used
 */
export async function markMagicLinkAsUsed(token: string): Promise<void> {
  // First get the magic link to get its ID
  const magicLink = await getMagicLinkByToken(token)
  if (!magicLink) {
    throw new Error('Magic link not found')
  }
  
  const command = new UpdateCommand({
    TableName: TABLE_NAMES.MAGIC_LINKS,
    Key: { id: magicLink.id },
    UpdateExpression: 'SET used = :used',
    ExpressionAttributeValues: {
      ':used': true,
    },
  })
  
  await docClient.send(command)
}

export default {
  createBusiness,
  getBusinessById,
  getAllBusinesses,
  updateBusiness,
  createStall,
  getStallsByBusinessId,
  createProduct,
  getProductsByBusinessId,
  getProductsByStallId,
  createMagicLink,
  getMagicLinkByToken,
  markMagicLinkAsUsed,
}
