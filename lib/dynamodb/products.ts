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

export interface Product {
  id: string
  stall_id: string
  business_id: string
  title: string
  short_desc: string
  long_desc: string
  price_cents: number
  currency: string
  sku: string
  tags_csv: string
  diet_flags_csv: string
  prep_time_minutes: number
  inventory_qty: number
  status: 'draft' | 'pending' | 'active' | 'suspended' | 'deleted'
  created_by: string
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  drive_file_id: string
  url_cached: string
  approved_by?: string
  approved_at?: string
  order_index: number
  created_at: string
}

/**
 * Create a new product
 */
export async function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  const product: Product = {
    id: uuidv4(),
    ...productData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const command = new PutCommand({
    TableName: TABLE_NAMES.PRODUCTS,
    Item: product,
  })

  await dynamoClient.send(command)
  return product
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const command = new GetCommand({
    TableName: TABLE_NAMES.PRODUCTS,
    Key: { id },
  })

  const result = await dynamoClient.send(command)
  return result.Item as Product || null
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

  const result = await dynamoClient.send(command)
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

  const result = await dynamoClient.send(command)
  return result.Items as Product[] || []
}

/**
 * Update product
 */
export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
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
    TableName: TABLE_NAMES.PRODUCTS,
    Key: { id },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  })

  const result = await dynamoClient.send(command)
  return result.Attributes as Product || null
}

/**
 * Delete product (soft delete by setting status)
 */
export async function deleteProduct(id: string): Promise<void> {
  await updateProduct(id, { status: 'deleted' })
}

/**
 * Get all products (with optional filters)
 */
export async function getAllProducts(filters?: {
  status?: string
  business_id?: string
  stall_id?: string
}): Promise<Product[]> {
  if (filters?.business_id) {
    return getProductsByBusinessId(filters.business_id)
  }
  
  if (filters?.stall_id) {
    return getProductsByStallId(filters.stall_id)
  }

  const command = new ScanCommand({
    TableName: TABLE_NAMES.PRODUCTS,
    FilterExpression: filters?.status ? '#status = :status' : undefined,
    ExpressionAttributeNames: filters?.status ? { '#status': 'status' } : undefined,
    ExpressionAttributeValues: filters?.status ? { ':status': filters.status } : undefined,
  })

  const result = await dynamoClient.send(command)
  return result.Items as Product[] || []
}

/**
 * Create product image
 */
export async function createProductImage(imageData: Omit<ProductImage, 'id' | 'created_at'>): Promise<ProductImage> {
  const image: ProductImage = {
    id: uuidv4(),
    ...imageData,
    created_at: new Date().toISOString(),
  }

  const command = new PutCommand({
    TableName: TABLE_NAMES.PRODUCT_IMAGES,
    Item: image,
  })

  await dynamoClient.send(command)
  return image
}

/**
 * Get product images by product ID
 */
export async function getProductImages(productId: string): Promise<ProductImage[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.PRODUCT_IMAGES,
    IndexName: 'product-id-index',
    KeyConditionExpression: 'product_id = :product_id',
    ExpressionAttributeValues: {
      ':product_id': productId,
    },
  })

  const result = await dynamoClient.send(command)
  return result.Items as ProductImage[] || []
}

/**
 * Delete product image
 */
export async function deleteProductImage(id: string): Promise<void> {
  const command = new DeleteCommand({
    TableName: TABLE_NAMES.PRODUCT_IMAGES,
    Key: { id },
  })

  await dynamoClient.send(command)
}