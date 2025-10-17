import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { appendRow, queryRows, SHEET_COLUMNS } from "@/lib/google/sheets"
import { checkPermission } from "@/lib/auth/permissions"
import { v4 as uuidv4 } from "uuid"
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

    // Build filter function
    let filterFn = (row: any) => true

    if (stallId) {
      const prevFilter = filterFn
      filterFn = (row: any) => prevFilter(row) && row.stall_id === stallId
    }

    if (businessId) {
      const prevFilter = filterFn
      filterFn = (row: any) => prevFilter(row) && row.business_id === businessId
    }

    if (status) {
      const prevFilter = filterFn
      filterFn = (row: any) => prevFilter(row) && row.status === status
    }

    if (customerId) {
      const prevFilter = filterFn
      filterFn = (row: any) => prevFilter(row) && row.customer_user_id === customerId
    }

    if (startDate) {
      const prevFilter = filterFn
      filterFn = (row: any) => prevFilter(row) && new Date(row.scheduled_for) >= new Date(startDate)
    }

    if (endDate) {
      const prevFilter = filterFn
      filterFn = (row: any) => prevFilter(row) && new Date(row.scheduled_for) <= new Date(endDate)
    }

    const orders = await queryRows("orders", SHEET_COLUMNS.orders, filterFn)

    // Get order items for each order
    const allOrderItems = await queryRows("order_items", SHEET_COLUMNS.order_items, () => true)

    const ordersWithItems = orders.map((order) => ({
      ...order,
      items: allOrderItems.filter((item) => item.order_id === order.id),
    }))

    // Sort by scheduled_for descending
    ordersWithItems.sort((a, b) => new Date(b.scheduled_for).getTime() - new Date(a.scheduled_for).getTime())

    return NextResponse.json({ orders: ordersWithItems })
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
    const orderId = uuidv4()
    await appendRow(
      "orders",
      {
        id: orderId,
        business_id: businessId,
        stall_id: stallId,
        customer_user_id: session.userId,
        status: "draft",
        scheduled_for: scheduledFor,
        total_cents: totalCents,
        currency: "KES", // TODO: Get from business settings
        notes: notes || "",
      },
      SHEET_COLUMNS.orders,
    )

    // Create order items
    for (const item of items) {
      const itemId = uuidv4()
      await appendRow(
        "order_items",
        {
          id: itemId,
          order_id: orderId,
          product_id: item.productId,
          qty: item.qty,
          unit_price_cents: item.unitPriceCents,
          total_price_cents: item.unitPriceCents * item.qty,
          notes: item.notes || "",
        },
        SHEET_COLUMNS.order_items,
      )
    }

    await triggerWebhooks(businessId, "order.created", {
      orderId,
      stallId,
      customerId: session.userId,
      totalCents,
      scheduledFor,
      itemCount: items.length,
    })

    return NextResponse.json({
      success: true,
      orderId,
      message: "Order created successfully",
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
