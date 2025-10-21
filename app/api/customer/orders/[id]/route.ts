import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session-server"
import { getCustomerOrderById, getOrderItems } from "@/lib/dynamodb/orders"
import { getStallById } from "@/lib/dynamodb/stalls"
import { getProductById } from "@/lib/dynamodb/products"

/**
 * GET /api/customer/orders/[id] - Get specific order details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession(request)
    if (!session?.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user has customer role
    if (!session.roles?.includes("customer")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const orderId = params.id

    // Get the order
    const order = await getCustomerOrderById(orderId)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Verify the order belongs to the customer
    if (order.customer_user_id !== session.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get order items
    const orderItems = await getOrderItems(orderId)

    // Get stall information
    const stall = await getStallById(order.stall_id)

    // Enrich order items with product information
    const enrichedItems = await Promise.all(
      orderItems.map(async (item) => {
        const product = await getProductById(item.product_id)
        return {
          ...item,
          product_name: product?.title || "Unknown Product",
          product_image: null // TODO: Add product image support
        }
      })
    )

    // Prepare the response
    const enrichedOrder = {
      ...order,
      stall_name: stall?.name || "Unknown Stall",
      stall_cuisine: stall?.cuisine_type || null,
      items: enrichedItems
    }

    return NextResponse.json({
      order: enrichedOrder
    })

  } catch (error) {
    console.error("Get order details error:", error)
    return NextResponse.json(
      { error: "Failed to load order details" },
      { status: 500 }
    )
  }
}