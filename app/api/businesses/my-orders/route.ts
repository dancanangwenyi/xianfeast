import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getUserById } from '@/lib/dynamodb/users'
import { getOrdersByBusinessId, getStallsByBusinessId } from '@/lib/dynamodb/businesses'

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

    // Fetch real orders data from DynamoDB
    const orders = await getOrdersByBusinessId(businessId)
    const stalls = await getStallsByBusinessId(businessId)

    // Add stall names to orders and calculate items count
    const ordersWithDetails = orders.map(order => {
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
        items_count: itemsCount
      }
    })

    return NextResponse.json({
      orders: ordersWithDetails
    })

  } catch (error) {
    console.error('Error fetching business orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}