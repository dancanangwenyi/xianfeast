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

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request)
    if (!session?.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user has customer role
    if (!session.roles?.includes("customer")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || ""
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")
    const sortBy = searchParams.get("sort") || "created_at"
    const sortOrder = searchParams.get("order") || "desc"

    // Get customer's orders
    const allOrders = await getAllOrders()
    let customerOrders = allOrders
      .filter(order => order.customer_user_id === session.userId)

    // Apply status filter
    if (status) {
      customerOrders = customerOrders.filter(order => order.status === status)
    }

    // Apply sorting
    customerOrders.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'scheduled_for':
          aValue = a.scheduled_for ? new Date(a.scheduled_for).getTime() : 0
          bValue = b.scheduled_for ? new Date(b.scheduled_for).getTime() : 0
          break
        case 'total_amount_cents':
          aValue = a.total_cents
          bValue = b.total_cents
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        default:
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Get related data for orders
    const allStalls = await getAllStalls()
    const allProducts = await getAllProducts()
    // Get all order items for enrichment
    const allOrderItems: any[] = []
    // Note: We'll get order items per order in the enrichment loop

    // Enrich orders with stall and product information
    const enrichedOrders = await Promise.all(customerOrders.map(async order => {
      const orderItems = await getOrderItems(order.id)
      const stall = allStalls.find(s => s.id === order.stall_id)
      
      const itemsWithProducts = orderItems.map(item => {
        const product = allProducts.find(p => p.id === item.product_id)
        return {
          ...item,
          product_name: product?.title || "Unknown Product",
          product_image: null // TODO: Add product image support
        }
      })

      return {
        ...order,
        stall_name: stall?.name || "Unknown Stall",
        stall_cuisine: stall?.cuisine_type || null,
        items: itemsWithProducts,
        item_count: itemsWithProducts.length
      }
    }))

    // Apply pagination
    const paginatedOrders = enrichedOrders.slice(offset, offset + limit)
    const totalCount = enrichedOrders.length

    // Calculate order statistics
    const orderStats = {
      total: totalCount,
      pending: enrichedOrders.filter(o => o.status === 'pending').length,
      confirmed: enrichedOrders.filter(o => o.status === 'confirmed').length,
      preparing: enrichedOrders.filter(o => o.status === 'preparing').length,
      ready: enrichedOrders.filter(o => o.status === 'ready').length,
      fulfilled: enrichedOrders.filter(o => o.status === 'fulfilled').length,
      cancelled: enrichedOrders.filter(o => o.status === 'cancelled').length
    }

    return NextResponse.json({
      orders: paginatedOrders,
      pagination: {
        total: totalCount,
        limit,
        offset,
        has_more: offset + limit < totalCount
      },
      stats: orderStats
    })

  } catch (error) {
    console.error("Customer orders error:", error)
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/customer/orders - Create a new order
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request)
    if (!session?.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user has customer role
    if (!session.roles?.includes("customer")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const {
      items,
      scheduled_for,
      delivery_option = 'pickup',
      delivery_address,
      delivery_instructions,
      payment_method = 'cash',
      order_notes,
      subtotal,
      deliveryFee,
      tax,
      total
    } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order items are required" }, { status: 400 })
    }

    if (!scheduled_for) {
      return NextResponse.json({ error: "Scheduled time is required" }, { status: 400 })
    }

    // Validate scheduled time is in the future
    const scheduledDateTime = new Date(scheduled_for)
    const now = new Date()
    if (scheduledDateTime <= now) {
      return NextResponse.json({ 
        error: "Order must be scheduled for a future time" 
      }, { status: 400 })
    }

    // Validate delivery address if delivery is selected
    if (delivery_option === 'delivery' && !delivery_address) {
      return NextResponse.json({ 
        error: "Delivery address is required for delivery orders" 
      }, { status: 400 })
    }

    // Pre-validate the complete order
    const orderValidation = await validateCompleteOrder(
      items.map(item => ({
        product_id: item.product_id,
        stall_id: item.stall_id,
        quantity: item.quantity,
        unit_price_cents: item.unit_price_cents
      })),
      items[0]?.stall_id, // Use first item's stall for validation
      scheduled_for
    )

    if (!orderValidation.valid) {
      return NextResponse.json({ 
        error: "Order validation failed",
        details: orderValidation.errors
      }, { status: 400 })
    }

    // Include warnings in response if any
    const validationWarnings = orderValidation.warnings

    // Validate and process each item
    const validatedItems = []
    let calculatedSubtotal = 0
    let primaryStallId = null
    let primaryBusinessId = null

    for (const item of items) {
      const { product_id, stall_id, quantity, unit_price_cents, special_instructions } = item

      if (!product_id || !stall_id || !quantity || quantity <= 0) {
        return NextResponse.json({ 
          error: "Invalid item data" 
        }, { status: 400 })
      }

      // Validate product exists and is available
      const product = await getProductById(product_id)
      if (!product) {
        return NextResponse.json({ 
          error: `Product ${product_id} not found` 
        }, { status: 404 })
      }

      if (product.status !== 'active') {
        return NextResponse.json({ 
          error: `Product ${product.title} is not available` 
        }, { status: 400 })
      }

      if (product.inventory_qty < quantity) {
        return NextResponse.json({ 
          error: `Insufficient inventory for ${product.title}` 
        }, { status: 400 })
      }

      // Validate stall exists and is active
      const stall = await getStallById(stall_id)
      if (!stall) {
        return NextResponse.json({ 
          error: `Stall ${stall_id} not found` 
        }, { status: 404 })
      }

      if (stall.status !== 'active') {
        return NextResponse.json({ 
          error: `Stall ${stall.name} is not available` 
        }, { status: 400 })
      }

      // Set primary stall and business (use first item's stall)
      if (!primaryStallId) {
        primaryStallId = stall_id
        primaryBusinessId = stall.business_id
      }

      // Validate price matches
      if (unit_price_cents !== product.price_cents) {
        return NextResponse.json({ 
          error: `Price mismatch for ${product.title}` 
        }, { status: 400 })
      }

      const itemTotal = unit_price_cents * quantity
      calculatedSubtotal += itemTotal

      validatedItems.push({
        product_id,
        stall_id,
        quantity,
        unit_price_cents,
        total_price_cents: itemTotal,
        special_instructions,
        product_title: product.title,
        stall_name: stall.name
      })
    }

    // Calculate fees and totals
    const deliveryFeeCents = delivery_option === 'delivery' ? 299 : 0
    const taxCents = Math.round((calculatedSubtotal + deliveryFeeCents) * 0.08) // 8% tax
    const totalCents = calculatedSubtotal + deliveryFeeCents + taxCents

    // Create the order
    const orderData: Omit<CustomerOrder, 'id' | 'created_at' | 'updated_at'> = {
      business_id: primaryBusinessId!,
      stall_id: primaryStallId!,
      customer_user_id: session.userId,
      status: 'pending',
      scheduled_for,
      total_cents: totalCents,
      currency: 'USD',
      notes: order_notes,
      delivery_option,
      delivery_address,
      delivery_instructions,
      payment_method,
      payment_status: 'pending',
      notification_sent: false,
      subtotal_cents: calculatedSubtotal,
      delivery_fee_cents: deliveryFeeCents,
      tax_cents: taxCents
    }

    const order = await createCustomerOrder(orderData)

    // Create order items
    const orderItems = []
    for (const item of validatedItems) {
      const orderItem = await createOrderItem({
        order_id: order.id,
        product_id: item.product_id,
        qty: item.quantity,
        unit_price_cents: item.unit_price_cents,
        total_price_cents: item.total_price_cents,
        notes: item.special_instructions
      })
      orderItems.push({
        ...orderItem,
        product_title: item.product_title
      })
    }

    // Clear the customer's cart
    try {
      const cart = await getOrCreateCart(session.userId)
      await clearCart(cart.id)
    } catch (error) {
      console.warn("Failed to clear cart after order creation:", error)
    }

    // Send email notifications
    try {
      // Send order confirmation to customer
      await emailService.sendCustomerOrderConfirmation({
        to: session.email || '',
        customerName: session.email?.split('@')[0] || 'Customer', // Use email prefix as name fallback
        orderNumber: order.id.slice(-8).toUpperCase(),
        stallName: validatedItems[0].stall_name,
        scheduledDate: new Date(scheduled_for).toLocaleDateString(),
        scheduledTime: new Date(scheduled_for).toLocaleTimeString(),
        items: orderItems.map(item => ({
          quantity: item.qty,
          productName: item.product_title || 'Unknown Product',
          price: `$${(item.total_price_cents / 100).toFixed(2)}`
        })),
        totalAmount: `$${(totalCents / 100).toFixed(2)}`,
        orderTrackingUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/customer/orders/${order.id}`
      })

      // Send notification to business owner
      // Note: We would need to get business owner details here
      // For now, we'll skip this to avoid errors
      console.log("Order notification would be sent to business owner")

    } catch (emailError) {
      console.error("Failed to send order emails:", emailError)
      // Don't fail the order creation if email fails
    }

    return NextResponse.json({
      order: {
        ...order,
        items: orderItems
      },
      message: "Order placed successfully",
      warnings: validationWarnings.length > 0 ? validationWarnings : undefined
    })

  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    )
  }
}