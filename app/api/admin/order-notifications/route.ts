import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session"
import { getAllOrders } from "@/lib/dynamodb/orders"
import { getAllUsers } from "@/lib/dynamodb/users"
import { getAllStalls } from "@/lib/dynamodb/stalls"
import { emailService } from "@/lib/email/service"

// Middleware to check super admin role
async function requireSuperAdmin(request: NextRequest) {
  try {
    const session = await verifySession(request)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session.roles.includes("super_admin")) {
      return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 })
    }

    return null // No error, continue
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

/**
 * GET /api/admin/order-notifications - Get pending order notifications
 */
export async function GET(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    // Get all customer orders that haven't been notified
    const allOrders = await getAllOrders()
    const customerOrders = allOrders.filter(order => 
      order.customer_user_id && 
      !(order as any).notification_sent &&
      order.status === 'pending'
    )

    // Get related data
    const [allUsers, allStalls] = await Promise.all([
      getAllUsers(),
      getAllStalls()
    ])

    // Enrich orders with business owner information
    const enrichedOrders = customerOrders.map(order => {
      const stall = allStalls.find(s => s.id === order.stall_id)
      const businessOwners = allUsers.filter(user => 
        user.business_id === order.business_id && 
        user.roles?.includes('business_owner')
      )

      return {
        ...order,
        stall_name: stall?.name || 'Unknown Stall',
        business_owners: businessOwners.map(owner => ({
          id: owner.id,
          name: owner.name || owner.email?.split('@')[0] || 'Business Owner',
          email: owner.email
        }))
      }
    })

    return NextResponse.json({
      pending_notifications: enrichedOrders.length,
      orders: enrichedOrders
    })

  } catch (error) {
    console.error("Error fetching order notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch order notifications" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/order-notifications - Send order notifications to business owners
 */
export async function POST(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    const { order_ids, send_all } = await request.json()

    // Get orders to notify
    let ordersToNotify = []
    if (send_all) {
      const allOrders = await getAllOrders()
      ordersToNotify = allOrders.filter(order => 
        order.customer_user_id && 
        !(order as any).notification_sent &&
        order.status === 'pending'
      )
    } else if (order_ids && Array.isArray(order_ids)) {
      const allOrders = await getAllOrders()
      ordersToNotify = allOrders.filter(order => order_ids.includes(order.id))
    } else {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    if (ordersToNotify.length === 0) {
      return NextResponse.json({ message: "No orders to notify" })
    }

    // Get related data
    const [allUsers, allStalls] = await Promise.all([
      getAllUsers(),
      getAllStalls()
    ])

    let notificationsSent = 0
    let errors = []

    // Send notifications for each order
    for (const order of ordersToNotify) {
      try {
        const stall = allStalls.find(s => s.id === order.stall_id)
        const businessOwners = allUsers.filter(user => 
          user.business_id === order.business_id && 
          user.roles?.includes('business_owner')
        )

        // Get customer details
        const customer = allUsers.find(u => u.id === order.customer_user_id)
        const customerName = customer?.name || customer?.email?.split('@')[0] || 'Customer'

        // Send email to each business owner
        for (const owner of businessOwners) {
          if (owner.email) {
            try {
              await emailService.sendBusinessOwnerOrderNotification({
                to: owner.email,
                businessOwnerName: owner.name || owner.email.split('@')[0],
                orderNumber: order.id.slice(-8).toUpperCase(),
                customerName,
                stallName: stall?.name || 'Unknown Stall',
                orderAmount: `${((order.total_cents || 0) / 100).toFixed(2)}`,
                scheduledFor: order.scheduled_for ? new Date(order.scheduled_for).toLocaleString() : 'ASAP',
                orderDetailsUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/business/dashboard/orders`
              })
              notificationsSent++
            } catch (emailError) {
              console.error(`Failed to send email to ${owner.email}:`, emailError)
              errors.push(`Failed to notify ${owner.email}`)
            }
          }
        }

        // Mark order as notified (this would require updating the order)
        // For now, we'll just log it
        console.log(`Order ${order.id} notification sent`)

      } catch (orderError) {
        console.error(`Failed to process order ${order.id}:`, orderError)
        errors.push(`Failed to process order ${order.id}`)
      }
    }

    return NextResponse.json({
      message: `Sent ${notificationsSent} notifications for ${ordersToNotify.length} orders`,
      notifications_sent: notificationsSent,
      orders_processed: ordersToNotify.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error("Error sending order notifications:", error)
    return NextResponse.json(
      { error: "Failed to send order notifications" },
      { status: 500 }
    )
  }
}