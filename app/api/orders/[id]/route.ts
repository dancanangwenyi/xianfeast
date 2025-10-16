import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getRow, updateRow, queryRows, SHEET_COLUMNS } from "@/lib/google/sheets"

/**
 * GET /api/orders/[id]
 * Get a single order with items
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const order = await getRow("orders", id, SHEET_COLUMNS.orders)

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Get order items
    const items = await queryRows("order_items", SHEET_COLUMNS.order_items, (row) => row.order_id === id)

    return NextResponse.json({
      order: {
        ...order,
        items,
      },
    })
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
  }
}

/**
 * PATCH /api/orders/[id]
 * Update an order
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const updateData: any = {}

    if (body.status !== undefined) updateData.status = body.status
    if (body.scheduledFor !== undefined) updateData.scheduled_for = body.scheduledFor
    if (body.notes !== undefined) updateData.notes = body.notes

    await updateRow("orders", id, updateData, SHEET_COLUMNS.orders)

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
    })
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
