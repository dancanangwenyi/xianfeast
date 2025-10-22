import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getUserById } from '@/lib/dynamodb/users'
import { getOrdersByBusinessId, getStallsByBusinessId } from '@/lib/dynamodb/businesses'
import { getAllOrders, getOrderItems } from '@/lib/dynamodb/orders'
import { getAllProducts } from '@/lib/dynamodb/products'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's business ID
    const user = await getUserById(session.userId)
    if (!user || !user.business_id) {
      return NextResponse.json({ error: 'No business associated with user' }, { status: 404 })
    }

    const businessId = user.business_id
    const { searchParams } = new URL(request.url)
    const includeCustomerOrders = searchParams.get('include_customer_orders') === 'true'
    const statusFilter = searchParams.get('status')
    const orderType = searchParams.get('type') // 'internal', 'customer', or 'all'

    // Fetch legacy orders data from DynamoDB (existing internal orders)
    const legacyOrders = await getOrdersByBusinessId(businessId)
    const stalls = await getStallsByBusinessId(businessId)

    // Fetch customer orders if requested
    let customerOrders: any[] = []
    if (includeCustomerOrders || orderType === 'customer' || orderType === 'all') {
      const allCustomerOrders = await getAllOrders({ business_id: businessId })
      const allProducts = await getAllProducts()
      
      // Enrich customer orders with additional details
      customerOrders = await Promise.all(allCustomerOrders.map(async order => {
        const orderItems = await getOrderItems(order.id)
        const stall = stalls.find(s => s.id === order.stall_id)
        
        // Get customer name from user ID if not stored
        let customerName = 'Unknown Customer'
        let customerEmail = 'unknown@example.com'
        
        if (order.customer_user_id) {
          try {
            const customerUser = await getUserById(order.customer_user_id)
            if (customerUser) {
              customerName = customerUser.name || customerUser.email?.split('@')[0] || 'Customer'
              customerEmail = customerUser.email || 'unknown@example.com'
            }
          } catch (e) {
            console.warn('Failed to get customer details:', e)
          }
        }

        const itemsWithProducts = orderItems.map(item => {
          const product = allProducts.find(p => p.id === item.product_id)
          return {
            ...item,
            product_name: product?.title || "Unknown Product"
          }
        })

        return {
          id: order.id,
          customer_name: customerName,
          customer_email: customerEmail,
          stall_name: stall?.name || 'Unknown Stall',
          total_amount: order.total_cents / 100, // Convert cents to dollars
          status: order.status,
          created_at: order.created_at,
          delivery_date: order.scheduled_for,
          items_count: orderItems.length,
          order_type: 'customer',
          delivery_option: (order as any).delivery_option || 'pickup',
          payment_method: (order as any).payment_method || 'cash',
          payment_status: (order as any).payment_status || 'pending',
          items: itemsWithProducts
        }
      }))
    }

    // Process legacy orders (existing internal orders)
    const legacyOrdersWithDetails = legacyOrders.map(order => {
      const stall = stalls.find(s => s.id === order.stall_id)
      let itemsCount = 1
      
      // Try to parse items_json to get actual count
      if (order.items_json) {
        try {
          const items = JSON.parse(order.items_json)
          itemsCount = Array.isArray(items) ? items.length : 1
        } catch (e) {
          // Keep default count if parsing fails
        }
      }

      return {
        id: order.id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        stall_name: stall?.name || 'Unknown Stall',
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
        delivery_date: order.delivery_date,
        items_count: itemsCount,
        order_type: 'internal'
      }
    })

    // Combine orders based on type filter
    let allOrders = []
    if (orderType === 'customer') {
      allOrders = customerOrders
    } else if (orderType === 'internal') {
      allOrders = legacyOrdersWithDetails
    } else {
      allOrders = [...legacyOrdersWithDetails, ...customerOrders]
    }

    // Apply status filter if provided
    if (statusFilter) {
      allOrders = allOrders.filter(order => order.status === statusFilter)
    }

    // Sort by creation date (newest first)
    allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Calculate order statistics
    const orderStats = {
      total: allOrders.length,
      customer_orders: customerOrders.length,
      internal_orders: legacyOrdersWithDetails.length,
      pending: allOrders.filter(o => o.status === 'pending').length,
      confirmed: allOrders.filter(o => o.status === 'confirmed').length,
      preparing: allOrders.filter(o => o.status === 'preparing').length,
      ready: allOrders.filter(o => o.status === 'ready').length,
      fulfilled: allOrders.filter(o => o.status === 'fulfilled').length,
      completed: allOrders.filter(o => o.status === 'completed').length,
      cancelled: allOrders.filter(o => o.status === 'cancelled').length
    }

    return NextResponse.json({
      orders: allOrders,
      stats: orderStats
    })

  } catch (error) {
    console.error('Error fetching business orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}