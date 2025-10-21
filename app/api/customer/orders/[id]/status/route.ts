import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session-server"
import { getCustomerOrderById, updateCustomerOrder } from "@/lib/dynamodb/orders"
import { emailService } from "@/lib/email/service"

/**
 * PUT /api/customer/orders/[id]/status - Update order status (for business owners)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession(request)
    if (!session?.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user has business owner or admin role
    if (!session.roles?.some(role => ['business_owner', 'admin', 'super_admin'].includes(role))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const orderId = params.id
    const body = await request.json()
    const { status, notes, estimated_ready_time } = body

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'fulfilled', 'cancelled']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: "Invalid status. Must be one of: " + validStatuses.join(', ')
      }, { status: 400 })
    }

    // Get the order
    const order = await getCustomerOrderById(orderId)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Store old status for email notification
    const oldStatus = order.status

    // Prepare update data
    const updateData: any = {
      status,
      status_notes: notes
    }

    // Add estimated ready time if provided
    if (estimated_ready_time) {
      updateData.estimated_ready_time = estimated_ready_time
    }

    // Set actual ready time when order becomes ready
    if (status === 'ready' && oldStatus !== 'ready') {
      updateData.actual_ready_time = new Date().toISOString()
    }

    // Update order status
    const updatedOrder = await updateCustomerOrder(orderId, updateData)

    if (!updatedOrder) {
      return NextResponse.json({ 
        error: "Failed to update order status" 
      }, { status: 500 })
    }

    // Send status update email to customer
    try {
      // Get customer email (we'll need to fetch user details)
      // For now, we'll skip email notification to avoid errors
      console.log(`Order ${orderId} status updated from ${oldStatus} to ${status}`)
      
      // TODO: Implement customer email notification
      // await emailService.sendCustomerOrderStatusUpdate({
      //   to: customerEmail,
      //   customerName: customerName,
      //   orderNumber: order.id.slice(-8).toUpperCase(),
      //   stallName: order.stall_name || 'Unknown Stall',
      //   oldStatus,
      //   newStatus: status,
      //   statusMessage: notes || `Your order is now ${status}`,
      //   estimatedReadyTime: estimated_ready_time,
      //   orderTrackingUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/customer/orders/${order.id}`
      // })

    } catch (emailError) {
      console.error("Failed to send status update email:", emailError)
      // Don't fail the status update if email fails
    }

    return NextResponse.json({
      message: "Order status updated successfully",
      order: updatedOrder,
      oldStatus,
      newStatus: status
    })

  } catch (error) {
    console.error("Update order status error:", error)
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    )
  }
}