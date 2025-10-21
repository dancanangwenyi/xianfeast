import { dynamoClient, TABLE_NAMES } from './client'
import { 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  QueryCommand, 
  DeleteCommand,
  ScanCommand 
} from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'

export interface Cart {
  id: string
  customer_id: string
  items: CartItem[]
  created_at: string
  updated_at: string
  expires_at: string
}

export interface CartItem {
  product_id: string
  stall_id: string
  quantity: number
  unit_price_cents: number
  scheduled_for?: string
  special_instructions?: string
}

/**
 * Create a new cart
 */
export async function createCart(customerId: string, expirationHours: number = 24): Promise<Cart> {
  const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString()
  
  const cart: Cart = {
    id: uuidv4(),
    customer_id: customerId,
    items: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: expiresAt
  }

  const command = new PutCommand({
    TableName: TABLE_NAMES.CARTS,
    Item: cart,
  })

  await dynamoClient.send(command)
  return cart
}

/**
 * Get cart by ID
 */
export async function getCartById(id: string): Promise<Cart | null> {
  const command = new GetCommand({
    TableName: TABLE_NAMES.CARTS,
    Key: { id },
  })

  const result = await dynamoClient.send(command)
  return result.Item as Cart || null
}

/**
 * Get cart by customer ID
 */
export async function getCartByCustomerId(customerId: string): Promise<Cart | null> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.CARTS,
    IndexName: 'customer-id-index',
    KeyConditionExpression: 'customer_id = :customer_id',
    ExpressionAttributeValues: {
      ':customer_id': customerId,
    },
    ScanIndexForward: false, // Get most recent first
    Limit: 1
  })

  const result = await dynamoClient.send(command)
  const carts = result.Items as Cart[] || []
  
  // Return the most recent non-expired cart
  const activeCart = carts.find(cart => new Date(cart.expires_at) > new Date())
  return activeCart || null
}

/**
 * Get or create cart for customer
 */
export async function getOrCreateCart(customerId: string): Promise<Cart> {
  let cart = await getCartByCustomerId(customerId)
  
  if (!cart || new Date(cart.expires_at) <= new Date()) {
    // Create new cart if none exists or current one is expired
    cart = await createCart(customerId)
  }
  
  return cart
}

/**
 * Add item to cart
 */
export async function addItemToCart(
  cartId: string, 
  item: CartItem
): Promise<Cart | null> {
  const cart = await getCartById(cartId)
  if (!cart) {
    return null
  }

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(
    cartItem => cartItem.product_id === item.product_id && 
                cartItem.stall_id === item.stall_id &&
                cartItem.scheduled_for === item.scheduled_for
  )

  if (existingItemIndex >= 0) {
    // Update quantity if item exists
    cart.items[existingItemIndex].quantity += item.quantity
    cart.items[existingItemIndex].special_instructions = item.special_instructions || cart.items[existingItemIndex].special_instructions
  } else {
    // Add new item
    cart.items.push(item)
  }

  return await updateCart(cartId, { 
    items: cart.items,
    updated_at: new Date().toISOString()
  })
}

/**
 * Remove item from cart
 */
export async function removeItemFromCart(
  cartId: string, 
  productId: string, 
  stallId: string,
  scheduledFor?: string
): Promise<Cart | null> {
  const cart = await getCartById(cartId)
  if (!cart) {
    return null
  }

  cart.items = cart.items.filter(
    item => !(item.product_id === productId && 
              item.stall_id === stallId &&
              item.scheduled_for === scheduledFor)
  )

  return await updateCart(cartId, { 
    items: cart.items,
    updated_at: new Date().toISOString()
  })
}

/**
 * Update item quantity in cart
 */
export async function updateCartItemQuantity(
  cartId: string, 
  productId: string, 
  stallId: string,
  quantity: number,
  scheduledFor?: string
): Promise<Cart | null> {
  const cart = await getCartById(cartId)
  if (!cart) {
    return null
  }

  const itemIndex = cart.items.findIndex(
    item => item.product_id === productId && 
            item.stall_id === stallId &&
            item.scheduled_for === scheduledFor
  )

  if (itemIndex >= 0) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.items.splice(itemIndex, 1)
    } else {
      cart.items[itemIndex].quantity = quantity
    }

    return await updateCart(cartId, { 
      items: cart.items,
      updated_at: new Date().toISOString()
    })
  }

  return cart
}

/**
 * Clear cart
 */
export async function clearCart(cartId: string): Promise<Cart | null> {
  return await updateCart(cartId, { 
    items: [],
    updated_at: new Date().toISOString()
  })
}

/**
 * Update cart
 */
export async function updateCart(id: string, updates: Partial<Cart>): Promise<Cart | null> {
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

  const command = new UpdateCommand({
    TableName: TABLE_NAMES.CARTS,
    Key: { id },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  })

  const result = await dynamoClient.send(command)
  return result.Attributes as Cart || null
}

/**
 * Delete cart
 */
export async function deleteCart(id: string): Promise<void> {
  const command = new DeleteCommand({
    TableName: TABLE_NAMES.CARTS,
    Key: { id },
  })

  await dynamoClient.send(command)
}

/**
 * Get cart total in cents
 */
export function calculateCartTotal(cart: Cart): number {
  return cart.items.reduce((total, item) => {
    return total + (item.unit_price_cents * item.quantity)
  }, 0)
}

/**
 * Get cart item count
 */
export function getCartItemCount(cart: Cart): number {
  return cart.items.reduce((count, item) => count + item.quantity, 0)
}

/**
 * Validate cart items (check if products still exist and are available)
 */
export async function validateCartItems(cart: Cart): Promise<{
  valid: boolean
  invalidItems: string[]
  unavailableItems: string[]
}> {
  const invalidItems: string[] = []
  const unavailableItems: string[] = []

  // Import here to avoid circular dependencies
  const { getProductById } = await import('./products')
  const { getStallById } = await import('./stalls')

  for (const item of cart.items) {
    try {
      // Check if product exists
      const product = await getProductById(item.product_id)
      if (!product) {
        invalidItems.push(item.product_id)
        continue
      }

      // Check if product is active
      if (product.status !== 'active') {
        unavailableItems.push(item.product_id)
        continue
      }

      // Check if product has sufficient inventory
      if (product.inventory_qty < item.quantity) {
        unavailableItems.push(item.product_id)
        continue
      }

      // Check if stall exists and is active
      const stall = await getStallById(item.stall_id)
      if (!stall || stall.status !== 'active') {
        unavailableItems.push(item.product_id)
        continue
      }

      // Check if scheduled time is valid (if provided)
      if (item.scheduled_for) {
        const scheduledDate = new Date(item.scheduled_for)
        const now = new Date()
        
        // Can't schedule for the past
        if (scheduledDate < now) {
          unavailableItems.push(item.product_id)
          continue
        }

        // Can't schedule more than 30 days in advance
        const maxAdvanceDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        if (scheduledDate > maxAdvanceDate) {
          unavailableItems.push(item.product_id)
          continue
        }

        // Check if stall is open at scheduled time (basic check)
        try {
          const openHours = JSON.parse(stall.open_hours_json || '{}')
          const dayOfWeek = scheduledDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
          
          if (openHours[dayOfWeek] && openHours[dayOfWeek] === 'Closed') {
            unavailableItems.push(item.product_id)
            continue
          }
        } catch (error) {
          // If we can't parse open hours, assume it's available
          console.warn('Failed to parse stall open hours:', error)
        }
      }
    } catch (error) {
      console.error('Error validating cart item:', item.product_id, error)
      invalidItems.push(item.product_id)
    }
  }

  return {
    valid: invalidItems.length === 0 && unavailableItems.length === 0,
    invalidItems,
    unavailableItems
  }
}

/**
 * Delete expired carts
 */
export async function deleteExpiredCarts(): Promise<void> {
  const now = new Date().toISOString()
  
  const command = new ScanCommand({
    TableName: TABLE_NAMES.CARTS,
    FilterExpression: 'expires_at < :now',
    ExpressionAttributeValues: {
      ':now': now,
    },
  })

  const result = await dynamoClient.send(command)
  const expiredCarts = result.Items as Cart[] || []

  for (const cart of expiredCarts) {
    await deleteCart(cart.id)
  }
}

/**
 * Extend cart expiration
 */
export async function extendCartExpiration(
  cartId: string, 
  additionalHours: number = 24
): Promise<Cart | null> {
  const cart = await getCartById(cartId)
  if (!cart) {
    return null
  }

  const newExpirationTime = new Date(Date.now() + additionalHours * 60 * 60 * 1000).toISOString()
  
  return await updateCart(cartId, { 
    expires_at: newExpirationTime,
    updated_at: new Date().toISOString()
  })
}