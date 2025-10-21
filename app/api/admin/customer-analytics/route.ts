import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session"
import { getAllOrders } from "@/lib/dynamodb/orders"
import { getAllUsers } from "@/lib/dynamodb/users"
import { getAllStalls } from "@/lib/dynamodb/stalls"
import { getAllProducts } from "@/lib/dynamodb/products"

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
    // Get all customer orders and users
    const [customerOrders, allUsers, allStalls, allProducts] = await Promise.all([
      getAllOrders(),
      getAllUsers(),
      getAllStalls(),
      getAllProducts()
    ])

    // Filter for customer users and orders
    const customers = allUsers.filter(user => user.roles?.includes('customer'))
    const orders = customerOrders.filter(order => order.customer_user_id)

    // Calculate time periods
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Customer signup trends
    const signupTrends = {
      total_customers: customers.length,
      new_this_week: customers.filter(c => new Date(c.created_at) >= oneWeekAgo).length,
      new_this_month: customers.filter(c => new Date(c.created_at) >= oneMonthAgo).length,
      new_last_3_months: customers.filter(c => new Date(c.created_at) >= threeMonthsAgo).length
    }

    // Order patterns
    const orderPatterns = {
      total_orders: orders.length,
      orders_this_week: orders.filter(o => new Date(o.created_at) >= oneWeekAgo).length,
      orders_this_month: orders.filter(o => new Date(o.created_at) >= oneMonthAgo).length,
      average_order_value: orders.length > 0 
        ? orders.reduce((sum, o) => sum + (o.total_cents || 0), 0) / orders.length / 100
        : 0,
      total_revenue: orders.reduce((sum, o) => sum + (o.total_cents || 0), 0) / 100
    }

    // Order status breakdown
    const statusBreakdown = {
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      fulfilled: orders.filter(o => o.status === 'fulfilled').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    }

    // Popular stalls by customer orders
    const stallOrderCounts = orders.reduce((acc, order) => {
      acc[order.stall_id] = (acc[order.stall_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const popularStalls = Object.entries(stallOrderCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([stallId, orderCount]) => {
        const stall = allStalls.find(s => s.id === stallId)
        return {
          stall_id: stallId,
          stall_name: stall?.name || 'Unknown Stall',
          business_name: stall?.business_name || 'Unknown Business',
          order_count: orderCount,
          revenue: orders
            .filter(o => o.stall_id === stallId)
            .reduce((sum, o) => sum + (o.total_cents || 0), 0) / 100
        }
      })

    // Customer activity patterns (by hour of day)
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
      const ordersInHour = orders.filter(order => {
        const orderHour = new Date(order.created_at).getHours()
        return orderHour === hour
      }).length
      
      return {
        hour,
        order_count: ordersInHour,
        percentage: orders.length > 0 ? (ordersInHour / orders.length) * 100 : 0
      }
    })

    // Peak ordering times
    const peakHours = hourlyActivity
      .sort((a, b) => b.order_count - a.order_count)
      .slice(0, 3)
      .map(h => ({
        hour: h.hour,
        display: `${h.hour}:00 - ${h.hour + 1}:00`,
        order_count: h.order_count
      }))

    // Weekly signup trend (last 8 weeks)
    const weeklySignups = Array.from({ length: 8 }, (_, weekIndex) => {
      const weekStart = new Date(now.getTime() - (weekIndex + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(now.getTime() - weekIndex * 7 * 24 * 60 * 60 * 1000)
      
      const signupsInWeek = customers.filter(customer => {
        const signupDate = new Date(customer.created_at)
        return signupDate >= weekStart && signupDate < weekEnd
      }).length

      return {
        week: `Week ${8 - weekIndex}`,
        week_start: weekStart.toISOString().split('T')[0],
        signup_count: signupsInWeek
      }
    }).reverse()

    // Customer retention metrics
    const activeCustomers = customers.filter(customer => {
      // Customer is active if they've placed an order in the last 30 days
      return orders.some(order => 
        order.customer_user_id === customer.id && 
        new Date(order.created_at) >= oneMonthAgo
      )
    })

    const retentionMetrics = {
      total_customers: customers.length,
      active_customers: activeCustomers.length,
      retention_rate: customers.length > 0 ? (activeCustomers.length / customers.length) * 100 : 0,
      repeat_customers: customers.filter(customer => {
        const customerOrders = orders.filter(o => o.customer_user_id === customer.id)
        return customerOrders.length > 1
      }).length
    }

    return NextResponse.json({
      signup_trends: signupTrends,
      order_patterns: orderPatterns,
      status_breakdown: statusBreakdown,
      popular_stalls: popularStalls,
      hourly_activity: hourlyActivity,
      peak_hours: peakHours,
      weekly_signups: weeklySignups,
      retention_metrics: retentionMetrics,
      summary: {
        total_customers: customers.length,
        total_orders: orders.length,
        total_revenue: orderPatterns.total_revenue,
        average_order_value: orderPatterns.average_order_value,
        active_customers: activeCustomers.length,
        growth_rate: signupTrends.new_this_month > 0 && customers.length > signupTrends.new_this_month
          ? ((signupTrends.new_this_month / (customers.length - signupTrends.new_this_month)) * 100)
          : 0
      }
    })

  } catch (error) {
    console.error("Error fetching customer analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch customer analytics" },
      { status: 500 }
    )
  }
}