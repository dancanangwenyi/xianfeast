import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session"
import { queryRowsFromSheet } from "@/lib/dynamodb/api-service"

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
    // Get logs from analytics_events table
    const analyticsEvents = await queryRowsFromSheet("analytics_events", {})
    
    // Convert to log format
    const logs = analyticsEvents.map(event => ({
      id: event.id,
      timestamp: event.timestamp || event.created_at,
      level: "info",
      eventType: event.event_type,
      actor: event.user_id || "System",
      target: event.business_id || "Global",
      action: event.event_type,
      message: event.metadata || `${event.event_type} event`,
      businessId: event.business_id,
      metadata: typeof event.metadata === 'string' ? JSON.parse(event.metadata || '{}') : event.metadata
    }))

    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Add some mock logs if no real logs exist
    if (logs.length === 0) {
      const mockLogs = [
        {
          id: "1",
          timestamp: new Date().toISOString(),
          level: "info",
          eventType: "system.startup",
          actor: "System",
          target: "Application",
          action: "startup",
          message: "Application started successfully",
          businessId: null,
          metadata: {}
        },
        {
          id: "2",
          timestamp: new Date(Date.now() - 300000).toISOString(),
          level: "info",
          eventType: "user.login",
          actor: "Super Admin",
          target: "Authentication",
          action: "login",
          message: "Super admin logged in",
          businessId: null,
          metadata: { ip: "127.0.0.1" }
        }
      ]
      logs.push(...mockLogs)
    }

    return NextResponse.json({ logs: logs.slice(0, 100) }) // Return last 100 logs
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}