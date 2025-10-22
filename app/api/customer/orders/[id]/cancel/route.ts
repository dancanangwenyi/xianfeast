import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session-server"
import { getCustomerOrderById, updateCustomerOrder } from "@/lib/dynamodb/orders"
import { emailService } from "@/lib/email/service"

/**
 * POST /api/customer/orders/[id]/cancel - Cancel a customer order
 */
export async function POST(
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

    // Check if order can be cancelled
    if (order.status !== 'pending') {
      return NextResponse.json({ 
        error: `Cannot cancel order with status: ${order.status}` 
      }, { status: 400 })
    }

    // Update order status to cancelled
    const updatedOrder = await updateCustomerOrder(orderId, {
      status: 'cancelled',
      payment_status: order.payment_status === 'paid' ? 'refunded' : 'pending'
    })

    if (!updatedOrder) {
      return NextResponse.json({ 
        error: "Failed to cancel order" 
      }, { status: 500 })
    }

    // Send cancellation email notifications
    try {
      // Send cancellation confirmation to customer
      await emailService.sendCustomerOrderCancellation({
        to: session.email || '',
        customerName: session.email?.split('@')[0] || 'Customer',
        orderNumber: order.id.slice(-8).toUpperCase(),
        stallName: order.stall_name || 'Unknown Stall',
        refundAmount: order.payment_status === 'paid' ? `${(order.total_cents / 100).toFixed(2)}` : null
      })

      // Notify business owner about cancellation
      console.log("Order cancellation notification would be sent to business owner")

    } catch (emailError) {
      console.error("Failed to send cancellation emails:", emailError)
      // Don't fail the cancellation if email fails
    }

    return NextResponse.json({
      message: "Order cancelled successfully",
      order: updatedOrder
    })

  } catch (error) {
    console.error("Cancel order error:", error)
    return NextResponse.json(
      { error: "Failed to cancel order" },
      { status: 500 }
    )
  }
}