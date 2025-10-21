import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { createOrder, createOrderItem, getAllOrders } from "@/lib/dynamodb/orders"
import { checkPermission } from "@/lib/auth/permissions"
import { triggerWebhooks } from "@/lib/webhooks/dispatcher"

/**
 * GET /api/orders
 * List orders with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const stallId = searchParams.get("stallId")
    const businessId = searchParams.get("businessId")
    const status = searchParams.get("status")
    const customerId = searchParams.get("customerId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Build filters object
    const filters: any = {}
    if (stallId) filters.stall_id = stallId
    if (businessId) filters.business_id = businessId
    if (status) filters.status = status
    if (customerId) filters.customer_user_id = customerId

    const orders = await getAllOrders(filters)

    // Get order items for each order
    const { getOrderItems } = await import("@/lib/dynamodb/orders")
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => ({
        ...order,
        items: await getOrderItems(order.id),
      }))
    )

    // Filter by date range if specified
    let filteredOrders = ordersWithItems
    if (startDate) {
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.scheduled_for) >= new Date(startDate)
      )
    }
    if (endDate) {
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.scheduled_for) <= new Date(endDate)
      )
    }

    // Sort by scheduled_for descending
    filteredOrders.sort((a, b) => new Date(b.scheduled_for).getTime() - new Date(a.scheduled_for).getTime())

    return NextResponse.json({ orders: filteredOrders })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

/**
 * POST /api/orders
 * Create a new order
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { businessId, stallId, scheduledFor, items, notes } = body

    if (!businessId || !stallId || !scheduledFor || !items || items.length === 0) {
      return NextResponse.json({ error: "businessId, stallId, scheduledFor, and items are required" }, { status: 400 })
    }

    // Check permissions - user must have orders:create
    const hasPermission = await checkPermission(session, "orders:create")
    if (!hasPermission) {
      return NextResponse.json({ error: "Insufficient permissions to create orders" }, { status: 403 })
    }

    // Calculate total
    let totalCents = 0
    for (const item of items) {
      totalCents += item.unitPriceCents * item.qty
    }

    // Create order
    const order = await createOrder({
      business_id: businessId,
      stall_id: stallId,
      customer_user_id: session.userId,
      status: "pending",
      scheduled_for: scheduledFor,
      total_cents: totalCents,
      currency: "KES", // TODO: Get from business settings
      notes: notes || "",
    })

    // Create order items
    for (const item of items) {
      await createOrderItem({
        order_id: order.id,
        product_id: item.productId,
        qty: item.qty,
        unit_price_cents: item.unitPriceCents,
        total_price_cents: item.unitPriceCents * item.qty,
        notes: item.notes || "",
      })
    }

    await triggerWebhooks(businessId, "order.created", {
      orderId: order.id,
      stallId,
      customerId: session.userId,
      totalCents,
      scheduledFor,
      itemCount: items.length,
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: "Order created successfully",
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
