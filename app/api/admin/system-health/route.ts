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

// GET /api/admin/system-health - Get system health status
export async function GET(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    if (!SPREADSHEET_ID) {
      return NextResponse.json({ error: "Spreadsheet ID not configured" }, { status: 500 })
    }

    const sheets = getSheetsClient()

    // Test Google Sheets API connection
    let sheetsStatus = "healthy"
    let sheetsLatency = 0
    try {
      const startTime = Date.now()
      await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      })
      sheetsLatency = Date.now() - startTime
    } catch (error) {
      sheetsStatus = "error"
    }

    // Test Google Drive API connection (mock for now)
    let driveStatus = "healthy"
    let driveLatency = 0
    try {
      const startTime = Date.now()
      // Mock Drive API call
      await new Promise(resolve => setTimeout(resolve, 50))
      driveLatency = Date.now() - startTime
    } catch (error) {
      driveStatus = "error"
    }

    // Calculate overall health score
    const healthScore = Math.round(
      ((sheetsStatus === "healthy" ? 50 : 0) + 
       (driveStatus === "healthy" ? 30 : 0) + 
       (sheetsLatency < 1000 ? 20 : 10)) / 100 * 100
    )

    return NextResponse.json({
      overall: {
        status: healthScore > 80 ? "healthy" : healthScore > 60 ? "warning" : "error",
        score: healthScore,
        uptime: "7 days, 12 hours",
        lastCheck: new Date().toISOString()
      },
      services: {
        database: {
          status: "healthy",
          latency: sheetsLatency,
          lastSync: new Date().toISOString()
        },
        googleSheets: {
          status: sheetsStatus,
          latency: sheetsLatency,
          quota: "85%"
        },
        googleDrive: {
          status: driveStatus,
          latency: driveLatency,
          quota: "45%"
        },
        ai: {
          status: "healthy",
          latency: 1200,
          quota: "60%"
        }
      },
      metrics: {
        totalRequests: 1247,
        errorRate: 2.1,
        avgResponseTime: 450,
        activeUsers: 156
      }
    })
  } catch (error) {
    console.error("Error checking system health:", error)
    return NextResponse.json({ error: "Failed to check system health" }, { status: 500 })
  }
}
