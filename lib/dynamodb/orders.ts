import { dynamoClient, TABLE_NAMES } from './client'
import { 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  QueryCommand, 
  ScanCommand 
} from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'

export interface Order {
  id: string
  business_id: string
  stall_id: string
  customer_user_id: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'fulfilled' | 'cancelled'
  scheduled_for: string
  total_cents: number
  currency: string
  created_at: string
  updated_at: string
  notes?: string
}

export interface CustomerOrder extends Order {
  delivery_option?: 'pickup' | 'delivery'
  delivery_address?: string
  delivery_instructions?: string
  estimated_ready_time?: string
  actual_ready_time?: string
  customer_rating?: number
  customer_review?: string
  notification_sent: boolean
  payment_method: 'cash' | 'card'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  subtotal_cents: number
  delivery_fee_cents: number
  tax_cents: number
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  qty: number
  unit_price_cents: number
  total_price_cents: number
  notes?: string
  created_at: string
}

/**
 * Create a new order
 */
export async function createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
  const order: Order = {
    id: uuidv4(),
    ...orderData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const command = new PutCommand({
    TableName: TABLE_NAMES.ORDERS,
    Item: order,
  })

  await dynamoClient.send(command)
  return order
}

/**
 * Get order by ID
 */
export async function getOrderById(id: string): Promise<Order | null> {
  const command = new GetCommand({
    TableName: TABLE_NAMES.ORDERS,
    Key: { id },
  })

  const result = await dynamoClient.send(command)
  return result.Item as Order || null
}

/**
 * Get orders by business ID
 */
export async function getOrdersByBusinessId(businessId: string): Promise<Order[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.ORDERS,
    IndexName: 'business-id-index',
    KeyConditionExpression: 'business_id = :business_id',
    ExpressionAttributeValues: {
      ':business_id': businessId,
    },
  })

  const result = await dynamoClient.send(command)
  return result.Items as Order[] || []
}

/**
 * Get orders by stall ID
 */
export async function getOrdersByStallId(stallId: string): Promise<Order[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.ORDERS,
    IndexName: 'stall-id-index',
    KeyConditionExpression: 'stall_id = :stall_id',
    ExpressionAttributeValues: {
      ':stall_id': stallId,
    },
  })

  const result = await dynamoClient.send(command)
  return result.Items as Order[] || []
}

/**
 * Get orders by customer ID
 */
export async function getOrdersByCustomerId(customerId: string): Promise<Order[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.ORDERS,
    IndexName: 'customer-user-id-index',
    KeyConditionExpression: 'customer_user_id = :customer_user_id',
    ExpressionAttributeValues: {
      ':customer_user_id': customerId,
    },
  })

  const result = await dynamoClient.send(command)
  return result.Items as Order[] || []
}

/**
 * Update order
 */
export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
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
    TableName: TABLE_NAMES.ORDERS,
    Key: { id },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  })

  const result = await dynamoClient.send(command)
  return result.Attributes as Order || null
}

/**
 * Get all orders (with optional filters)
 */
export async function getAllOrders(filters?: {
  status?: string
  business_id?: string
  stall_id?: string
  customer_user_id?: string
}): Promise<Order[]> {
  if (filters?.business_id) {
    return getOrdersByBusinessId(filters.business_id)
  }
  
  if (filters?.stall_id) {
    return getOrdersByStallId(filters.stall_id)
  }

  if (filters?.customer_user_id) {
    return getOrdersByCustomerId(filters.customer_user_id)
  }

  const command = new ScanCommand({
    TableName: TABLE_NAMES.ORDERS,
    FilterExpression: filters?.status ? '#status = :status' : undefined,
    ExpressionAttributeNames: filters?.status ? { '#status': 'status' } : undefined,
    ExpressionAttributeValues: filters?.status ? { ':status': filters.status } : undefined,
  })

  const result = await dynamoClient.send(command)
  return result.Items as Order[] || []
}

/**
 * Create order item
 */
export async function createOrderItem(itemData: Omit<OrderItem, 'id' | 'created_at'>): Promise<OrderItem> {
  const item: OrderItem = {
    id: uuidv4(),
    ...itemData,
    created_at: new Date().toISOString(),
  }

  const command = new PutCommand({
    TableName: TABLE_NAMES.ORDER_ITEMS,
    Item: item,
  })

  await dynamoClient.send(command)
  return item
}

/**
 * Get order items by order ID
 */
export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.ORDER_ITEMS,
    IndexName: 'order-id-index',
    KeyConditionExpression: 'order_id = :order_id',
    ExpressionAttributeValues: {
      ':order_id': orderId,
    },
  })

  const result = await dynamoClient.send(command)
  return result.Items as OrderItem[] || []
}

/**
 * Get order with items
 */
export async function getOrderWithItems(orderId: string): Promise<(Order & { items: OrderItem[] }) | null> {
  const order = await getOrderById(orderId)
  if (!order) {
    return null
  }

  const items = await getOrderItems(orderId)
  return { ...order, items }
}

/**
 * Create a new customer order with extended fields
 */
export async function createCustomerOrder(orderData: Omit<CustomerOrder, 'id' | 'created_at' | 'updated_at'>): Promise<CustomerOrder> {
  const order: CustomerOrder = {
    id: uuidv4(),
    ...orderData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const command = new PutCommand({
    TableName: TABLE_NAMES.ORDERS,
    Item: order,
  })

  await dynamoClient.send(command)
  return order
}

/**
 * Get customer order by ID (with extended fields)
 */
export async function getCustomerOrderById(id: string): Promise<CustomerOrder | null> {
  const command = new GetCommand({
    TableName: TABLE_NAMES.ORDERS,
    Key: { id },
  })

  const result = await dynamoClient.send(command)
  return result.Item as CustomerOrder || null
}

/**
 * Update customer order with extended fields and status history tracking
 */
export async function updateCustomerOrder(id: string, updates: Partial<CustomerOrder>): Promise<CustomerOrder | null> {
  // Get current order to track status changes
  const currentOrder = await getCustomerOrderById(id)
  if (!currentOrder) {
    return null
  }

  const updateExpressions: string[] = []
  const expressionAttributeValues: Record<string, any> = {}
  const expressionAttributeNames: Record<string, string> = {}

  // Track status history if status is being updated
  if (updates.status && updates.status !== currentOrder.status) {
    const statusHistory = (currentOrder as any).status_history || []
    statusHistory.push({
      status: updates.status,
      timestamp: new Date().toISOString(),
      notes: (updates as any).status_notes || undefined
    })
    
    updateExpressions.push('#status_history = :status_history')
    expressionAttributeNames['#status_history'] = 'status_history'
    expressionAttributeValues[':status_history'] = statusHistory
  }

  // Build update expression dynamically
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'status_notes' && value !== undefined) {
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
    TableName: TABLE_NAMES.ORDERS,
    Key: { id },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  })

  const result = await dynamoClient.send(command)
  return result.Attributes as CustomerOrder || null
}