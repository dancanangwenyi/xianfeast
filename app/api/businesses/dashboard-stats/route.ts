import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getUserById } from '@/lib/dynamodb/users'
import { 
  getBusinessById, 
  getStallsByBusinessId, 
  getProductsByBusinessId, 
  getOrdersByBusinessId 
} from '@/lib/dynamodb/businesses'

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
    const orders = await getOrdersByBusinessId(businessId)
    
    // For users, we'll get a count of users associated with this business
    const businessUsers = [] // TODO: Implement user filtering by business_id

    // Calculate stats
    const stats = {
      totalStalls: stalls.length,
      activeStalls: stalls.filter(s => s.status === 'active').length,
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === 'active').length,
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => ['pending', 'confirmed'].includes(o.status)).length,
      totalRevenue: orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0),
      monthlyRevenue: orders
        .filter(order => {
          const orderDate = new Date(order.created_at)
          const now = new Date()
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
        })
        .reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0),
      totalUsers: businessUsers.length,
      activeUsers: businessUsers.filter(u => u.status === 'active').length,
    }

    // Get recent orders with stall names
    const recentOrders = orders
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(order => {
        const stall = stalls.find(s => s.id === order.stall_id)
        return {
          id: order.id,
          customer_name: order.customer_name || 'Unknown Customer',
          total_amount: order.total_amount || 0,
          status: order.status,
          created_at: order.created_at,
          stall_name: stall?.name || 'Unknown Stall'
        }
      })

    // Generate recent activity
    const recentActivity = [
      {
        id: '1',
        type: 'order',
        message: `${orders.length} total orders processed`,
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'product',
        message: `${products.length} products in catalog`,
        timestamp: new Date().toISOString()
      },
      {
        id: '3',
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