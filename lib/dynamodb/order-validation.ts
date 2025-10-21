import { getStallById } from './stalls'
import { getProductById } from './products'
import { getOrdersByStallId } from './orders'

export interface OrderValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface OrderItemValidation {
  product_id: string
  stall_id: string
  quantity: number
  unit_price_cents: number
}

/**
 * Validate order scheduling for conflicts and business rules
 */
export async function validateOrderScheduling(
  stallId: string,
  scheduledFor: string,
  itemCount: number
): Promise<OrderValidationResult> {
  const result: OrderValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  try {
    // Get stall information
    const stall = await getStallById(stallId)
    if (!stall) {
      result.valid = false
      result.errors.push("Stall not found")
      return result
    }

    if (stall.status !== 'active') {
      result.valid = false
      result.errors.push("Stall is not currently accepting orders")
      return result
    }

    // Validate scheduled time is in the future
    const scheduledDateTime = new Date(scheduledFor)
    const now = new Date()
    
    if (scheduledDateTime <= now) {
      result.valid = false
      result.errors.push("Order must be scheduled for a future time")
      return result
    }

    // Check if it's too far in advance (30 days)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    if (scheduledDateTime > thirtyDaysFromNow) {
      result.valid = false
      result.errors.push("Orders can only be scheduled up to 30 days in advance")
      return result
    }

    // Parse stall operating hours
    let operatingHours: any = {}
    try {
      operatingHours = JSON.parse(stall.open_hours_json || '{}')
    } catch (error) {
      result.warnings.push("Unable to verify stall operating hours")
    }

    // Check if stall is open at scheduled time
    const dayOfWeek = scheduledDateTime.getDay() // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]
    
    if (operatingHours[dayName]) {
      const dayHours = operatingHours[dayName]
      if (dayHours.closed) {
        result.valid = false
        result.errors.push(`Stall is closed on ${dayName}s`)
        return result
      }

      // Check if time is within operating hours
      const scheduledTime = scheduledDateTime.toTimeString().slice(0, 5) // HH:MM format
      if (dayHours.open && dayHours.close) {
        if (scheduledTime < dayHours.open || scheduledTime > dayHours.close) {
          result.warnings.push(
            `Order is scheduled outside normal operating hours (${dayHours.open} - ${dayHours.close})`
          )
        }
      }
    }

    // Check stall capacity for the day
    if (stall.capacity_per_day > 0) {
      const startOfDay = new Date(scheduledDateTime)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(scheduledDateTime)
      endOfDay.setHours(23, 59, 59, 999)

      // Get existing orders for the same day
      const existingOrders = await getOrdersByStallId(stallId)
      const ordersForDay = existingOrders.filter(order => {
        const orderDate = new Date(order.scheduled_for)
        return orderDate >= startOfDay && orderDate <= endOfDay && 
               order.status !== 'cancelled'
      })

      const totalOrdersForDay = ordersForDay.length + 1 // +1 for current order
      
      if (totalOrdersForDay > stall.capacity_per_day) {
        result.valid = false
        result.errors.push(
          `Stall has reached capacity for ${scheduledDateTime.toDateString()}. ` +
          `Maximum ${stall.capacity_per_day} orders per day.`
        )
        return result
      }

      // Warning if approaching capacity
      if (totalOrdersForDay > stall.capacity_per_day * 0.8) {
        result.warnings.push(
          `Stall is approaching capacity for this day (${totalOrdersForDay}/${stall.capacity_per_day} orders)`
        )
      }
    }

    // Check for time slot conflicts (within 30 minutes)
    const existingOrders = await getOrdersByStallId(stallId)
    const conflictWindow = 30 * 60 * 1000 // 30 minutes in milliseconds
    
    const conflictingOrders = existingOrders.filter(order => {
      if (order.status === 'cancelled') return false
      
      const orderTime = new Date(order.scheduled_for).getTime()
      const scheduledTime = scheduledDateTime.getTime()
      
      return Math.abs(orderTime - scheduledTime) < conflictWindow
    })

    if (conflictingOrders.length > 0) {
      result.warnings.push(
        `There are ${conflictingOrders.length} other orders scheduled within 30 minutes of this time`
      )
    }

  } catch (error) {
    console.error("Order scheduling validation error:", error)
    result.valid = false
    result.errors.push("Unable to validate order scheduling")
  }

  return result
}

/**
 * Validate order items for availability and pricing
 */
export async function validateOrderItems(
  items: OrderItemValidation[]
): Promise<OrderValidationResult> {
  const result: OrderValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  try {
    for (const item of items) {
      const { product_id, stall_id, quantity, unit_price_cents } = item

      // Validate product exists and is available
      const product = await getProductById(product_id)
      if (!product) {
        result.valid = false
        result.errors.push(`Product ${product_id} not found`)
        continue
      }

      if (product.status !== 'active') {
        result.valid = false
        result.errors.push(`Product "${product.title}" is not available`)
        continue
      }

      // Validate stall matches
      if (product.stall_id !== stall_id) {
        result.valid = false
        result.errors.push(`Product "${product.title}" does not belong to the specified stall`)
        continue
      }

      // Validate inventory
      if (product.inventory_qty < quantity) {
        result.valid = false
        result.errors.push(
          `Insufficient inventory for "${product.title}". ` +
          `Available: ${product.inventory_qty}, Requested: ${quantity}`
        )
        continue
      }

      // Validate pricing
      if (product.price_cents !== unit_price_cents) {
        result.valid = false
        result.errors.push(
          `Price mismatch for "${product.title}". ` +
          `Current price: $${(product.price_cents / 100).toFixed(2)}, ` +
          `Submitted price: $${(unit_price_cents / 100).toFixed(2)}`
        )
        continue
      }

      // Warning for low inventory
      if (product.inventory_qty <= quantity * 2) {
        result.warnings.push(
          `Low inventory for "${product.title}". Only ${product.inventory_qty} remaining.`
        )
      }

      // Warning for large quantities
      if (quantity > 10) {
        result.warnings.push(
          `Large quantity ordered for "${product.title}" (${quantity} items). ` +
          `This may affect preparation time.`
        )
      }
    }

  } catch (error) {
    console.error("Order items validation error:", error)
    result.valid = false
    result.errors.push("Unable to validate order items")
  }

  return result
}

/**
 * Validate complete order before creation
 */
export async function validateCompleteOrder(
  items: OrderItemValidation[],
  stallId: string,
  scheduledFor: string
): Promise<OrderValidationResult> {
  const result: OrderValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  // Validate items
  const itemValidation = await validateOrderItems(items)
  result.errors.push(...itemValidation.errors)
  result.warnings.push(...itemValidation.warnings)
  
  if (!itemValidation.valid) {
    result.valid = false
  }

  // Validate scheduling
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const schedulingValidation = await validateOrderScheduling(stallId, scheduledFor, totalItems)
  result.errors.push(...schedulingValidation.errors)
  result.warnings.push(...schedulingValidation.warnings)
  
  if (!schedulingValidation.valid) {
    result.valid = false
  }

  return result
}

/**
 * Check if stall is currently accepting orders
 */
export async function isStallAcceptingOrders(stallId: string): Promise<boolean> {
  try {
    const stall = await getStallById(stallId)
    if (!stall || stall.status !== 'active') {
      return false
    }

    // Check if stall is currently open
    const now = new Date()
    const dayOfWeek = now.getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]
    
    let operatingHours: any = {}
    try {
      operatingHours = JSON.parse(stall.open_hours_json || '{}')
    } catch {
      return true // If we can't parse hours, assume open
    }

    if (operatingHours[dayName]) {
      const dayHours = operatingHours[dayName]
      if (dayHours.closed) {
        return false
      }

      const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
      if (dayHours.open && dayHours.close) {
        return currentTime >= dayHours.open && currentTime <= dayHours.close
      }
    }

    return true
  } catch (error) {
    console.error("Error checking stall availability:", error)
    return false
  }
}