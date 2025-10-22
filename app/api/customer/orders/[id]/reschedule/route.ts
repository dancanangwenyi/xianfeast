import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session-server"
import { getCustomerOrderById, updateCustomerOrder } from "@/lib/dynamodb/orders"
import { emailService } from "@/lib/email/service"

/**
 * POST /api/customer/orders/[id]/reschedule - Reschedule a customer order
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
    const body = await request.json()
    const { scheduled_for, reason } = body

    if (!scheduled_for) {
      return NextResponse.json({ 
        error: "New scheduled time is required" 
      }, { status: 400 })
    }

    // Validate scheduled time is in the future
    const scheduledDateTime = new Date(scheduled_for)
    const now = new Date()
    if (scheduledDateTime <= now) {
      return NextResponse.json({ 
        error: "Order must be rescheduled for a future time" 
      }, { status: 400 })
    }

    // Get the order
    const order = await getCustomerOrderById(orderId)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Verify the order belongs to the customer
    if (order.customer_user_id !== session.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Check if order can be rescheduled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return NextResponse.json({ 
        error: `Cannot reschedule order with status: ${order.status}` 
      }, { status: 400 })
    }

    // Store old scheduled time for notification
    const oldScheduledFor = order.scheduled_for

    // Update order with new scheduled time
    const updateData: any = {
      scheduled_for
    }
    
    // Add status notes for tracking
    if (reason) {
      updateData.status_notes = `Rescheduled: ${reason}`
    }
    
    const updatedOrder = await updateCustomerOrder(orderId, updateData)

    if (!updatedOrder) {
      return NextResponse.json({ 
        error: "Failed to reschedule order" 
      }, { status: 500 })
    }

    // Send reschedule notification emails
    try {
      // Send notification to customer
      await emailService.sendCustomerOrderStatusUpdate({
        to: session.email || '',
        customerName: session.email?.split('@')[0] || 'Customer',
        orderNumber: order.id.slice(-8).toUpperCase(),
        stallName: (order as any).stall_name || 'Unknown Stall',
        oldStatus: 'scheduled',
        newStatus: 'rescheduled',
        statusMessage: `Your order has been rescheduled from ${new Date(oldScheduledFor).toLocaleString()} to ${new Date(scheduled_for).toLocaleString()}`,
        orderTrackingUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/customer/orders/${order.id}`
      })

      // Notify business owner about reschedule
      console.log("Order reschedule notification would be sent to business owner")

    } catch (emailError) {
      console.error("Failed to send reschedule emails:", emailError)
      // Don't fail the reschedule if email fails
    }

    return NextResponse.json({
      message: "Order rescheduled successfully",
      order: updatedOrder,
      oldScheduledFor,
      newScheduledFor: scheduled_for
    })

  } catch (error) {
    console.error("Reschedule order error:", error)
    return NextResponse.json(
      { error: "Failed to reschedule order" },
      { status: 500 }
    )
  }
}