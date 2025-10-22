/**
 * Enhanced Customer Orders API with Comprehensive Error Handling
 * Provides robust error handling, validation, and user-friendly responses
 */

import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session-server"
import { 
  getAllOrders, 
  getOrderItems, 
  createCustomerOrder, 
  createOrderItem,
  CustomerOrder 
} from "@/lib/dynamodb/orders"
import { getAllStalls, getStallById } from "@/lib/dynamodb/stalls"
import { getAllProducts, getProductById } from "@/lib/dynamodb/products"
import { getOrCreateCart, clearCart } from "@/lib/dynamodb/carts"
import { emailService } from "@/lib/email/service"
import { validateCompleteOrder } from "@/lib/dynamodb/order-validation"
import { ApiResponseHandler, InputValidator, sanitizeInput, withErrorHandling } from "@/lib/error-handling/api-response-handler"

/**
 * GET /api/customer/orders - Get customer orders with enhanced error handling
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Verify authentication
  const session = await verifySession(request)
  if (!session?.userId) {
    return ApiResponseHandler.unauthorized()
  }

  // Check customer role
  if (!session.roles?.includes("customer")) {
    return ApiResponseHandler.forbidden("Customer access required")
  }

  try {
    // Get all orders for the customer
    const allOrders = await getAllOrders()
    const customerOrders = allOrders.filter(order => order.customer_user_id === session.userId)

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      customerOrders.map(async (order) => {
        try {
          const items = await getOrderItems(order.id)
          return { ...order, items }
        } catch (error) {
          console.warn(`Failed to load items for order ${order.id}:`, error)
          return { ...order, items: [] }
        }
      })
    )

    // Get stalls and products for enrichment
    const [stalls, products] = await Promise.all([
      getAllStalls().catch(() => []),
      getAllProducts().catch(() => [])
    ])

    // Create lookup maps
    const stallsMap = new Map(stalls.map(stall => [stall.id, stall]))
    const productsMap = new Map(products.map(product => [product.id, product]))

    // Enrich orders with stall and product information
    const enrichedOrders = ordersWithItems.map(order => {
      const stall = stallsMap.get(order.stall_id)
      const enrichedItems = order.items?.map(item => {
        const product = productsMap.get(item.product_id)
        return {
          ...item,
          product_title: product?.title || 'Unknown Product',
          product_price_cents: product?.price_cents || 0
        }
      }) || []

      return {
        ...order,
        stall_name: stall?.name || 'Unknown Stall',
        stall_pickup_address: stall?.pickup_address || '',
        items: enrichedItems,
        total_items: enrichedItems.reduce((sum, item) => sum + item.quantity, 0),
        estimated_total_cents: enrichedItems.reduce(
          (sum, item) => sum + (item.quantity * (item.unit_price_cents || 0)), 
          0
        )
      }
    })

    // Sort by creation date (newest first)
    enrichedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return ApiResponseHandler.success({
      orders: enrichedOrders,
      total: enrichedOrders.length,
      summary: {
        pending: enrichedOrders.filter(o => o.status === 'pending').length,
        confirmed: enrichedOrders.filter(o => o.status === 'confirmed').length,
        in_preparation: enrichedOrders.filter(o => o.status === 'in_preparation').length,
        completed: enrichedOrders.filter(o => o.status === 'completed').length,
        cancelled: enrichedOrders.filter(o => o.status === 'cancelled').length
      }
    })

  } catch (error) {
    console.error("Failed to load customer orders:", error)
    throw error
  }
}, { context: 'customer-orders-get' })

/**
 * POST /api/customer/orders - Create new order with comprehensive validation
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Verify authentication
  const session = await verifySession(request)
  if (!session?.userId) {
    return ApiResponseHandler.unauthorized()
  }

  // Check customer role
  if (!session.roles?.includes("customer")) {
    return ApiResponseHandler.forbidden("Customer access required")
  }

  // Parse and sanitize request body
  let body: any
  try {
    body = await request.json()
    body = sanitizeInput(body)
  } catch (error) {
    return ApiResponseHandler.validationError(
      { body: "Invalid JSON in request body" },
      "Request body must be valid JSON"
    )
  }

  const {
    items,
    scheduled_for,
    delivery_option = "pickup",
    delivery_address,
    special_instructions,
    payment_method = "cash"
  } = body

  // Comprehensive input validation
  const validator = new InputValidator()
  
  validator
    .required('items', items)
    .array('items', items, 1, 50, 'Order must contain 1-50 items')
    .required('scheduled_for', scheduled_for)
    .custom('scheduled_for', scheduled_for, (value) => {
      const scheduledDate = new Date(value)
      return scheduledDate > new Date()
    }, 'Order must be scheduled for a future time')
    .custom('scheduled_for', scheduled_for, (value) => {
      const scheduledDate = new Date(value)
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      return scheduledDate <= thirtyDaysFromNow
    }, 'Orders can only be scheduled up to 30 days in advance')

  // Validate delivery address if delivery is selected
  if (delivery_option === "delivery") {
    validator.required('delivery_address', delivery_address)
      .length('delivery_address', delivery_address, 10, 200)
  }

  // Validate special instructions length
  if (special_instructions) {
    validator.length('special_instructions', special_instructions, 0, 500)
  }

  // Check validation results
  if (!validator.isValid()) {
    return ApiResponseHandler.validationError(validator.getErrors())
  }

  try {
    // Validate order data using existing validation
    const orderValidation = await validateCompleteOrder({
      customer_user_id: session.userId,
      items,
      scheduled_for,
      delivery_option,
      delivery_address,
      special_instructions
    })

    if (!orderValidation.isValid) {
      return ApiResponseHandler.validationError(
        orderValidation.errors,
        "Order validation failed"
      )
    }

    // Validate and process each item
    const validatedItems = []
    let totalCents = 0

    for (const item of items) {
      const { product_id, stall_id, quantity, unit_price_cents } = item

      // Validate item structure
      const itemValidator = new InputValidator()
      itemValidator
        .required('product_id', product_id)
        .required('stall_id', stall_id)
        .required('quantity', quantity)
        .range('quantity', quantity, 1, 100)
        .required('unit_price_cents', unit_price_cents)
        .range('unit_price_cents', unit_price_cents, 0, 1000000)

      if (!itemValidator.isValid()) {
        return ApiResponseHandler.validationError(
          itemValidator.getErrors(),
          `Invalid item data for product ${product_id}`
        )
      }

      // Verify product exists and is available
      const product = await getProductById(product_id)
      if (!product) {
        return ApiResponseHandler.notFound(`Product ${product_id}`)
      }

      if (product.status !== 'active') {
        return ApiResponseHandler.validationError(
          { [product_id]: `Product ${product.title} is not available` }
        )
      }

      // Check inventory if available
      if (product.inventory !== undefined && product.inventory < quantity) {
        return ApiResponseHandler.validationError(
          { [product_id]: `Insufficient inventory for ${product.title}` }
        )
      }

      // Verify stall exists and is available
      const stall = await getStallById(stall_id)
      if (!stall) {
        return ApiResponseHandler.notFound(`Stall ${stall_id}`)
      }

      if (stall.status !== 'active') {
        return ApiResponseHandler.validationError(
          { [stall_id]: `Stall ${stall.name} is not available` }
        )
      }

      // Verify price matches
      if (Math.abs(unit_price_cents - product.price_cents) > 1) {
        return ApiResponseHandler.validationError(
          { [product_id]: `Price mismatch for ${product.title}` }
        )
      }

      validatedItems.push({
        product_id,
        stall_id,
        quantity,
        unit_price_cents: product.price_cents, // Use authoritative price
        product_title: product.title,
        stall_name: stall.name
      })

      totalCents += quantity * product.price_cents
    }

    // Create the order
    const orderData: Partial<CustomerOrder> = {
      customer_user_id: session.userId,
      business_id: validatedItems[0].stall_id, // Use first stall's business_id
      stall_id: validatedItems[0].stall_id,
      status: 'pending',
      scheduled_for,
      total_cents: totalCents,
      currency: 'USD',
      delivery_option,
      delivery_address: delivery_option === 'delivery' ? delivery_address : undefined,
      special_instructions,
      payment_method,
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      notes: `Order placed by customer via web interface`
    }

    const order = await createCustomerOrder(orderData)

    // Create order items
    for (const item of validatedItems) {
      await createOrderItem({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_cents: item.unit_price_cents,
        total_cents: item.quantity * item.unit_price_cents
      })
    }

    // Clear customer's cart after successful order
    try {
      const cart = await getOrCreateCart(session.userId)
      await clearCart(cart.id)
    } catch (error) {
      console.warn("Failed to clear cart after order creation:", error)
      // Don't fail the order creation if cart clearing fails
    }

    // Send confirmation emails
    try {
      // Send confirmation to customer
      await emailService.sendOrderConfirmation({
        customerEmail: session.email || '',
        customerName: session.name || 'Customer',
        orderNumber: order.id,
        orderDetails: {
          items: validatedItems,
          total: totalCents,
          scheduledFor: scheduled_for,
          deliveryOption: delivery_option,
          deliveryAddress: delivery_address
        }
      })

      // Send notification to business owner
      console.log("Order notification would be sent to business owner")

    } catch (emailError) {
      console.error("Failed to send order emails:", emailError)
      // Don't fail the order creation if email fails
    }

    // Return success response with order details
    return ApiResponseHandler.success({
      order: {
        ...order,
        items: validatedItems,
        total_items: validatedItems.reduce((sum, item) => sum + item.quantity, 0)
      },
      message: "Order placed successfully"
    }, 201)

  } catch (error) {
    console.error("Create order error:", error)
    throw error
  }
}, { context: 'customer-orders-post' })