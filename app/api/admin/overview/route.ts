import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session"
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

// GET /api/admin/overview - Get overview statistics
export async function GET(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    // Get data from DynamoDB
    const [businesses, users, legacyOrders] = await Promise.all([
      getAllRowsFromSheet("businesses"),
      getAllRowsFromSheet("users"),
      getAllRowsFromSheet("orders"),
    ])

    // Also get customer orders
    const { getAllOrders } = await import("@/lib/dynamodb/orders")
    const customerOrders = await getAllOrders()

    const totalBusinesses = businesses.length
    const totalUsers = users.length
    const totalLegacyOrders = legacyOrders.length
    const totalCustomerOrders = customerOrders.length
    const totalOrders = totalLegacyOrders + totalCustomerOrders

    // Calculate active businesses
    const activeBusinesses = businesses.filter(b => b.status === "active").length

    // Calculate customer-specific metrics
    const customers = users.filter(user => user.roles?.includes('customer'))
    const totalCustomers = customers.length

    // Calculate pending approvals (include customer orders)
    const pendingCustomerOrders = customerOrders.filter(o => o.status === 'pending').length
    const pendingApprovals = 8 + pendingCustomerOrders // 8 is existing mock + customer orders

    // Calculate AI insights generated (mock for now)
    const aiInsightsGenerated = 12

    // Calculate system health (mock for now)
    const systemHealth = 98

    // Calculate weekly growth (mock for now)
    const weeklyGrowth = 15.3

    // Calculate revenue including customer orders
    const customerRevenue = customerOrders.reduce((sum, order) => sum + ((order.total_cents || 0) / 100), 0)
    const monthlyRevenue = 45680 + customerRevenue

    return NextResponse.json({
      totalBusinesses,
      activeBusinesses,
      totalUsers,
      totalCustomers,
      totalOrders,
      totalCustomerOrders,
      totalLegacyOrders,
      pendingApprovals,
      pendingCustomerOrders,
      aiInsightsGenerated,
      systemHealth,
      weeklyGrowth,
      monthlyRevenue,
      customerRevenue,
    })
  } catch (error) {
    console.error("Error fetching overview data:", error)
    return NextResponse.json({ error: "Failed to fetch overview data" }, { status: 500 })
  }
}
