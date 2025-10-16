import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { updateRow, queryRows, SHEET_COLUMNS } from "@/lib/google/sheets"
import { triggerWebhooks } from "@/lib/webhooks/dispatcher"

/**
 * POST /api/orders/[id]/confirm
 * Confirm an order (lock it in)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params

    const orders = await queryRows("orders", SHEET_COLUMNS.orders, (row: any) => row.id === id)
    const order = orders[0]

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    await updateRow("orders", id, { status: "confirmed" }, SHEET_COLUMNS.orders)

    await triggerWebhooks(order.business_id, "order.confirmed", {
      orderId: id,
      stallId: order.stall_id,
      customerId: order.customer_user_id,
      totalCents: order.total_cents,
      scheduledFor: order.scheduled_for,
    })

    return NextResponse.json({
      success: true,
      message: "Order confirmed successfully",
    })
  } catch (error) {
    console.error("Error confirming order:", error)
    return NextResponse.json({ error: "Failed to confirm order" }, { status: 500 })
  }
}
