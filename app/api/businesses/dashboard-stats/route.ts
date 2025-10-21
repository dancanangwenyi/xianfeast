import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getUserById } from '@/lib/dynamodb/users'
import { 
  getBusinessById, 
  getStallsByBusinessId, 
  getProductsByBusinessId, 
  getOrdersByBusinessId 
} from '@/lib/dynamodb/businesses'
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

    // Fetch real business data from DynamoDB
    const business = await getBusinessById(businessId)
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Fetch all related data
    const stalls = await getStallsByBusinessId(businessId)
    const products = await getProductsByBusinessId(businessId)
    const legacyOrders = await getOrdersByBusinessId(businessId)
    
    // Fetch customer orders
    const customerOrders = await getAllOrders({ business_id: businessId })
    const allProducts = await getAllProducts()
    
    // For users, we'll get a count of users associated with this business
    const businessUsers = [] // TODO: Implement user filtering by business_id

    // Combine all orders for statistics
    const allOrders = [...legacyOrders, ...customerOrders]

    // Calculate revenue from both order types
    const legacyRevenue = legacyOrders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0)
    const customerRevenue = customerOrders.reduce((sum, order) => sum + ((order.total_cents || 0) / 100), 0)
    const totalRevenue = legacyRevenue + customerRevenue

    // Calculate monthly revenue
    const now = new Date()
    const monthlyLegacyRevenue = legacyOrders
      .filter(order => {
        const orderDate = new Date(order.created_at)
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
      })
      .reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0)
    
    const monthlyCustomerRevenue = customerOrders
      .filter(order => {
        const orderDate = new Date(order.created_at)
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
      })
      .reduce((sum, order) => sum + ((order.total_cents || 0) / 100), 0)

    const monthlyRevenue = monthlyLegacyRevenue + monthlyCustomerRevenue

    // Calculate stats
    const stats = {
      totalStalls: stalls.length,
      activeStalls: stalls.filter(s => s.status === 'active').length,
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === 'active').length,
      totalOrders: allOrders.length,
      customerOrders: customerOrders.length,
      internalOrders: legacyOrders.length,
      pendingOrders: allOrders.filter(o => ['pending', 'confirmed'].includes(o.status)).length,
      totalRevenue,
      monthlyRevenue,
      totalUsers: businessUsers.length,
      activeUsers: businessUsers.filter(u => u.status === 'active').length,
    }

    // Get recent orders with stall names (combine both types)
    const enrichedCustomerOrders = await Promise.all(customerOrders.map(async order => {
      const stall = stalls.find(s => s.id === order.stall_id)
      
      // Get customer name from user ID if not stored
      let customerName = 'Customer'
      if (order.customer_user_id) {
        try {
          const customerUser = await getUserById(order.customer_user_id)
          if (customerUser) {
            customerName = customerUser.name || customerUser.email?.split('@')[0] || 'Customer'
          }
        } catch (e) {
          console.warn('Failed to get customer details:', e)
        }
      }

      return {
        id: order.id,
        customer_name: customerName,
        total_amount: (order.total_cents || 0) / 100,
        status: order.status,
        created_at: order.created_at,
        stall_name: stall?.name || 'Unknown Stall',
        order_type: 'customer'
      }
    }))

    const enrichedLegacyOrders = legacyOrders.map(order => {
      const stall = stalls.find(s => s.id === order.stall_id)
      return {
        id: order.id,
        customer_name: order.customer_name || 'Unknown Customer',
        total_amount: order.total_amount || 0,
        status: order.status,
        created_at: order.created_at,
        stall_name: stall?.name || 'Unknown Stall',
        order_type: 'internal'
      }
    })

    const recentOrders = [...enrichedCustomerOrders, ...enrichedLegacyOrders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)

    // Generate recent activity with customer order insights
    const recentActivity = [
      {
        id: '1',
        type: 'order',
        message: `${allOrders.length} total orders (${customerOrders.length} customer, ${legacyOrders.length} internal)`,
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'customer',
        message: `${customerOrders.filter(o => o.status === 'pending').length} new customer orders awaiting confirmation`,
        timestamp: new Date().toISOString()
      },
      {
        id: '3',
        type: 'product',
        message: `${products.length} products in catalog`,
        timestamp: new Date().toISOString()
      },
      {
        id: '4',
        type: 'stall',
        message: `${stalls.length} stalls configured`,
        timestamp: new Date().toISOString()
      }
    ]

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        status: business.status,
        created_at: business.created_at
      },
      stats,
      recentOrders,
      recentActivity
    })

  } catch (error) {
    console.error('Error fetching business dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}