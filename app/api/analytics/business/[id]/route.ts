import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAllOrders } from "@/lib/dynamodb/orders"
import { getAllProducts } from "@/lib/dynamodb/products"
import { getAllUsers } from "@/lib/dynamodb/users"
import { getAllStalls } from "@/lib/dynamodb/stalls"

/**
 * GET /api/analytics/business/[id]
 * Get business analytics data
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!session.roles.includes("super_admin")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { id: businessId } = await params
    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get("range") || "30d"

    // Calculate date range
    const now = new Date()
    const daysBack = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    // Fetch data
    const [orders, products, users, stalls] = await Promise.all([
      getAllOrders({ business_id: businessId }),
      getAllProducts({ business_id: businessId }),
      getAllUsers({ status: "active" }),
      getAllStalls({ business_id: businessId })
    ])

    // Filter orders by date range
    const filteredOrders = orders.filter(order => 
      new Date(order.created_at) >= startDate
    )

    // Calculate metrics
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total_cents, 0) / 100
    const totalOrders = filteredOrders.length
    const totalProducts = products.filter(p => p.status === "active").length
    const totalUsers = users.filter(u => u.roles_json.includes(businessId)).length

    // Calculate growth (mock data for now)
    const revenueGrowth = Math.random() * 20 - 10 // -10% to +10%
    const orderGrowth = Math.random() * 30 - 15 // -15% to +15%

    // Daily revenue data
    const dailyRevenue = []
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayOrders = filteredOrders.filter(order => 
        new Date(order.created_at).toDateString() === date.toDateString()
      )
      dailyRevenue.push({
        date: date.toISOString().split('T')[0],
        revenue: dayOrders.reduce((sum, order) => sum + order.total_cents, 0) / 100,
        orders: dayOrders.length
      })
    }

    // Top products (mock data)
    const topProducts = products.slice(0, 5).map(product => ({
      name: product.title,
      sales: Math.floor(Math.random() * 100) + 10,
      revenue: Math.floor(Math.random() * 10000) + 1000
    }))

    // Orders by status
    const statusCounts = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const statusColors = {
      pending: "#fbbf24",
      confirmed: "#3b82f6",
      preparing: "#f59e0b",
      ready: "#10b981",
      fulfilled: "#059669",
      cancelled: "#ef4444"
    }

    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      color: statusColors[status as keyof typeof statusColors] || "#6b7280"
    }))

    // Stall performance
    const stallPerformance = stalls.map(stall => {
      const stallOrders = filteredOrders.filter(order => order.stall_id === stall.id)
      return {
        name: stall.name,
        revenue: stallOrders.reduce((sum, order) => sum + order.total_cents, 0) / 100,
        orders: stallOrders.length
      }
    })

    const analytics = {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalUsers,
      revenueGrowth,
      orderGrowth,
      dailyRevenue,
      topProducts,
      ordersByStatus,
      stallPerformance
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}