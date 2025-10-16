import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { queryRows, SHEET_COLUMNS } from "@/lib/google/sheets"

/**
 * GET /api/analytics/overview
 * Get overview analytics (super admin)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!session.roles.includes("super_admin")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Fetch all data
    const [businesses, users, orders, products] = await Promise.all([
      queryRows("businesses", SHEET_COLUMNS.businesses, () => true),
      queryRows("users", SHEET_COLUMNS.users, () => true),
      queryRows("orders", SHEET_COLUMNS.orders, () => true),
      queryRows("products", SHEET_COLUMNS.products, () => true),
    ])

    // Calculate metrics
    const totalBusinesses = businesses.length
    const activeBusinesses = businesses.filter((b) => b.status === "active").length

    const totalUsers = users.length
    const activeUsers = users.filter((u) => u.status === "active").length

    const totalOrders = orders.length
    const confirmedOrders = orders.filter((o) => o.status === "confirmed").length
    const fulfilledOrders = orders.filter((o) => o.status === "fulfilled").length

    const totalRevenue = orders
      .filter((o) => o.status === "confirmed" || o.status === "fulfilled")
      .reduce((sum, o) => sum + Number(o.total_cents), 0)

    const totalProducts = products.length
    const activeProducts = products.filter((p) => p.status === "active").length

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentOrders = orders.filter((o) => new Date(o.created_at) >= thirtyDaysAgo)
    const recentRevenue = recentOrders
      .filter((o) => o.status === "confirmed" || o.status === "fulfilled")
      .reduce((sum, o) => sum + Number(o.total_cents), 0)

    return NextResponse.json({
      overview: {
        businesses: {
          total: totalBusinesses,
          active: activeBusinesses,
        },
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        orders: {
          total: totalOrders,
          confirmed: confirmedOrders,
          fulfilled: fulfilledOrders,
        },
        products: {
          total: totalProducts,
          active: activeProducts,
        },
        revenue: {
          total: totalRevenue,
          recent30Days: recentRevenue,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
