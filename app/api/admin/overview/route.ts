import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session"
import { getSheetsClient } from "@/lib/google/auth"

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
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    if (!SPREADSHEET_ID) {
      return NextResponse.json({ error: "Spreadsheet ID not configured" }, { status: 500 })
    }

    const sheets = getSheetsClient()

    // Get counts from different sheets
    const [businessesResponse, usersResponse, ordersResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "businesses!A:A",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "users!A:A",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "orders!A:A",
      }),
    ])

    const totalBusinesses = (businessesResponse.data.values?.length || 1) - 1 // Subtract header
    const totalUsers = (usersResponse.data.values?.length || 1) - 1
    const totalOrders = (ordersResponse.data.values?.length || 1) - 1

    // Calculate active businesses (status = "active")
    const businessesData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "businesses!A:D", // id, name, owner_user_id, status
    })

    const activeBusinesses = businessesData.data.values?.slice(1).filter(row => row[3] === "active").length || 0

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
