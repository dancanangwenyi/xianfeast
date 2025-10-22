import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session"
import { getAllOrders, getOrderItems } from "@/lib/dynamodb/orders"
import { getAllUsers } from "@/lib/dynamodb/users"
import { getAllStalls } from "@/lib/dynamodb/stalls"
import { getAllProducts } from "@/lib/dynamodb/products"
import { getAllRowsFromSheet } from "@/lib/dynamodb/api-service"

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

export async function GET(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const orderType = searchParams.get('type') || 'all' // 'customer', 'internal', 'all'
    const status = searchParams.get('status')
    const businessId = searchParams.get('business_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get all data in parallel
    const [
      customerOrders,
      legacyOrders,
      allUsers,
      allStalls,
      allProducts
    ] = await Promise.all([
      getAllOrders(),
      getAllRowsFromSheet("orders"),
      getAllUsers(),
      getAllStalls(),
      getAllProducts()
    ])

    let combinedOrders: any[] = []

    // Process customer orders
    if (orderType === 'all' || orderType === 'customer') {
      const enrichedCustomerOrders = await Promise.all(customerOrders.map(async order => {
        const orderItems = await getOrderItems(order.id)
        const stall = allStalls.find(s => s.id === order.stall_id)
        
        // Get customer details
        let customerName = 'Unknown Customer'
        let customerEmail = 'unknown@example.com'
        
        if (order.customer_user_id) {
          const customer = allUsers.find(u => u.id === order.customer_user_id)
          if (customer) {
            customerName = customer.name || customer.email?.split('@')[0] || 'Customer'
            customerEmail = customer.email || 'unknown@example.com'
          }
        }

        // Get business name
        let businessName = 'Unknown Business'
        if (order.business_id) {
          const businesses = await getAllRowsFromSheet("businesses")
          const business = businesses.find(b => b.id === order.business_id)
          if (business) {
            businessName = business.name || 'Unknown Business'
          }
        }

        return {
          id: order.id,
          businessId: order.business_id,
          businessName,
          stallId: order.stall_id,
          stallName: stall?.name || 'Unknown Stall',
          customerId: order.customer_user_id,
          customerName,
          customerEmail,
          status: order.status,
          totalCents: order.total_cents || 0,
          currency: order.currency || 'USD',
          itemsCount: orderItems.length,
          scheduledFor: order.scheduled_for,
          createdAt: order.created_at,
          notes: order.notes,
          orderType: 'customer',
          deliveryOption: (order as any).delivery_option || 'pickup',
          paymentMethod: (order as any).payment_method || 'cash',
          paymentStatus: (order as any).payment_status || 'pending',
          items: orderItems.map(item => {
            const product = allProducts.find(p => p.id === item.product_id)
            return {
              id: item.id,
              productId: item.product_id,
              productName: product?.title || 'Unknown Product',
              quantity: item.qty,
              unitPriceCents: item.unit_price_cents,
              totalPriceCents: item.total_price_cents,
              notes: item.notes
            }
          })
        }
      }))

      combinedOrders = [...combinedOrders, ...enrichedCustomerOrders]
    }

    // Process legacy/internal orders
    if (orderType === 'all' || orderType === 'internal') {
      const enrichedLegacyOrders = legacyOrders.map(order => {
        const stall = allStalls.find(s => s.id === order.stall_id)
        
        // Get business name
        let businessName = 'Unknown Business'
        if (order.business_id) {
          // This would need to be fetched from businesses sheet
          businessName = 'Legacy Business' // Placeholder
        }

        let itemsCount = 1
        let items: any[] = []
        
        // Try to parse items_json
        if (order.items_json) {
          try {
            const parsedItems = JSON.parse(order.items_json)
            if (Array.isArray(parsedItems)) {
              itemsCount = parsedItems.length
              items = parsedItems
            }
          } catch (e) {
            // Keep defaults
          }
        }

        return {
          id: order.id,
          businessId: order.business_id,
          businessName,
          stallId: order.stall_id,
          stallName: stall?.name || 'Unknown Stall',
          customerId: null,
          customerName: order.customer_name || 'Unknown Customer',
          customerEmail: order.customer_email || 'unknown@example.com',
          status: order.status,
          totalCents: Math.round((parseFloat(order.total_amount) || 0) * 100),
          currency: 'USD',
          itemsCount,
          scheduledFor: order.delivery_date,
          createdAt: order.created_at,
          notes: order.notes,
          orderType: 'internal',
          items
        }
      })

      combinedOrders = [...combinedOrders, ...enrichedLegacyOrders]
    }

    // Apply filters
    if (status) {
      combinedOrders = combinedOrders.filter(order => order.status === status)
    }

    if (businessId) {
      combinedOrders = combinedOrders.filter(order => order.businessId === businessId)
    }

    // Sort by creation date (newest first)
    combinedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Apply pagination
    const totalCount = combinedOrders.length
    const paginatedOrders = combinedOrders.slice(offset, offset + limit)

    // Calculate statistics
    const stats = {
      total: totalCount,
      customer_orders: combinedOrders.filter(o => o.orderType === 'customer').length,
      internal_orders: combinedOrders.filter(o => o.orderType === 'internal').length,
      pending: combinedOrders.filter(o => o.status === 'pending').length,
      confirmed: combinedOrders.filter(o => o.status === 'confirmed').length,
      preparing: combinedOrders.filter(o => o.status === 'preparing').length,
      ready: combinedOrders.filter(o => o.status === 'ready').length,
      fulfilled: combinedOrders.filter(o => o.status === 'fulfilled').length,
      completed: combinedOrders.filter(o => o.status === 'completed').length,
      cancelled: combinedOrders.filter(o => o.status === 'cancelled').length,
      total_revenue: combinedOrders.reduce((sum, o) => sum + (o.totalCents / 100), 0)
    }

    // Get business breakdown
    const businessBreakdown = combinedOrders.reduce((acc, order) => {
      const key = order.businessId || 'unknown'
      if (!acc[key]) {
        acc[key] = {
          business_id: order.businessId,
          business_name: order.businessName,
          order_count: 0,
          revenue: 0
        }
      }
      acc[key].order_count++
      acc[key].revenue += order.totalCents / 100
      return acc
    }, {} as Record<string, any>)

    const topBusinesses = Object.values(businessBreakdown)
      .sort((a: any, b: any) => b.order_count - a.order_count)
      .slice(0, 10)

    return NextResponse.json({
      orders: paginatedOrders,
      pagination: {
        total: totalCount,
        limit,
        offset,
        has_more: offset + limit < totalCount
      },
      stats,
      top_businesses: topBusinesses
    })

  } catch (error) {
    console.error("Error fetching admin orders:", error)
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}