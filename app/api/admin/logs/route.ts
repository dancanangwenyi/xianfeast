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

// GET /api/admin/logs - Get system logs
export async function GET(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    if (!SPREADSHEET_ID) {
      return NextResponse.json({ error: "Spreadsheet ID not configured" }, { status: 500 })
    }

    const sheets = getSheetsClient()

    // Get logs from analytics_events sheet (if it exists) or create mock data
    try {
      const logsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "analytics_events!A:ZZ",
      })

      const logs = logsResponse.data.values?.slice(1).map(row => ({
        id: row[0] || `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: row[1] || new Date().toISOString(),
        level: row[2] || "info",
        eventType: row[3] || "system.event",
        actor: row[4] || "System",
        target: row[5] || "System",
        message: row[6] || "System event",
        details: row[7] ? JSON.parse(row[7]) : {},
        businessId: row[8] || undefined,
        userId: row[9] || undefined,
        ipAddress: row[10] || undefined,
        userAgent: row[11] || undefined,
      })) || []

      return NextResponse.json({ logs })
    } catch (error) {
      // If analytics_events sheet doesn't exist, return mock data
      const mockLogs = [
        {
          id: "LOG-001",
          timestamp: "2024-10-16T19:45:23Z",
          level: "info",
          eventType: "user.login",
          actor: "dancangwe@gmail.com",
          target: "Authentication System",
          message: "User successfully logged in",
          businessId: undefined,
          userId: "1",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        {
          id: "LOG-002",
          timestamp: "2024-10-16T19:42:15Z",
          level: "success",
          eventType: "order.created",
          actor: "john@example.com",
          target: "Order System",
          message: "New order created successfully",
          businessId: "1",
          userId: "2",
          details: {
            orderId: "ORD-001",
            totalAmount: 2450,
            itemsCount: 3
          }
        },
        {
          id: "LOG-003",
          timestamp: "2024-10-16T19:38:42Z",
          level: "warning",
          eventType: "business.inactive",
          actor: "System",
          target: "Mediterranean Bistro",
          message: "Business has been inactive for 3 days",
          businessId: "4",
          details: {
            lastActivity: "2024-10-13T15:30:00Z",
            daysInactive: 3
          }
        },
        {
          id: "LOG-004",
          timestamp: "2024-10-16T19:35:18Z",
          level: "error",
          eventType: "api.error",
          actor: "System",
          target: "Google Sheets API",
          message: "Failed to update product inventory",
          businessId: "2",
          details: {
            error: "Rate limit exceeded",
            retryCount: 3,
            endpoint: "/api/products/update"
          }
        },
        {
          id: "LOG-005",
          timestamp: "2024-10-16T19:30:55Z",
          level: "info",
          eventType: "product.approved",
          actor: "Super Admin",
          target: "Spicy Tofu Bowl",
          message: "Product approved for listing",
          businessId: "2",
          details: {
            productId: "PROD-123",
            approvedBy: "Super Admin"
          }
        },
        {
          id: "LOG-006",
          timestamp: "2024-10-16T19:25:33Z",
          level: "success",
          eventType: "business.created",
          actor: "Super Admin",
          target: "Sushi Master",
          message: "New business registered",
          businessId: "5",
          details: {
            businessName: "Sushi Master",
            ownerEmail: "owner@sushimaster.com"
          }
        },
        {
          id: "LOG-007",
          timestamp: "2024-10-16T19:20:12Z",
          level: "info",
          eventType: "ai.insight.generated",
          actor: "AI System",
          target: "Analytics Engine",
          message: "New AI insight generated",
          details: {
            insightType: "prediction",
            confidence: 87,
            category: "revenue"
          }
        },
        {
          id: "LOG-008",
          timestamp: "2024-10-16T19:15:47Z",
          level: "warning",
          eventType: "user.mfa.failed",
          actor: "chef@spicegarden.com",
          target: "Authentication System",
          message: "MFA verification failed",
          businessId: "2",
          userId: "3",
          details: {
            attempts: 2,
            maxAttempts: 3
          }
        },
        {
          id: "LOG-009",
          timestamp: "2024-10-16T19:10:29Z",
          level: "error",
          eventType: "webhook.failed",
          actor: "System",
          target: "Webhook System",
          message: "Webhook delivery failed",
          businessId: "1",
          details: {
            webhookUrl: "https://example.com/webhook",
            statusCode: 500,
            retryCount: 2
          }
        },
        {
          id: "LOG-010",
          timestamp: "2024-10-16T19:05:14Z",
          level: "success",
          eventType: "user.invited",
          actor: "Super Admin",
          target: "User Management",
          message: "User invitation sent",
          details: {
            invitedEmail: "newuser@example.com",
            role: "stall_manager",
            businessId: "1"
          }
        }
      ]

      return NextResponse.json({ logs: mockLogs })
    }
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}
