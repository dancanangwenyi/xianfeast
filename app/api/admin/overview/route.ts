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
    const [businesses, users, orders] = await Promise.all([
      getAllRowsFromSheet("businesses"),
      getAllRowsFromSheet("users"),
      getAllRowsFromSheet("orders"),
    ])

    const totalBusinesses = businesses.length
    const totalUsers = users.length
    const totalOrders = orders.length

    // Calculate active businesses
    const activeBusinesses = businesses.filter(b => b.status === "active").length

    // Calculate pending approvals (mock for now)
    const pendingApprovals = 8

    // Calculate AI insights generated (mock for now)
    const aiInsightsGenerated = 12

    // Calculate system health (mock for now)
    const systemHealth = 98

    // Calculate weekly growth (mock for now)
    const weeklyGrowth = 15.3

    // Calculate monthly revenue (mock for now)
    const monthlyRevenue = 45680

    return NextResponse.json({
      totalBusinesses,
      activeBusinesses,
      totalUsers,
      totalOrders,
      pendingApprovals,
      aiInsightsGenerated,
      systemHealth,
      weeklyGrowth,
      monthlyRevenue,
    })
  } catch (error) {
    console.error("Error fetching overview data:", error)
    return NextResponse.json({ error: "Failed to fetch overview data" }, { status: 500 })
  }
}
