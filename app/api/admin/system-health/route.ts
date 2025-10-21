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

// GET /api/admin/system-health - Get system health status
export async function GET(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    // Test DynamoDB connection
    let dynamoStatus = "healthy"
    let dynamoLatency = 0
    
    try {
      const startTime = Date.now()
      await getAllRowsFromSheet("users")
      dynamoLatency = Date.now() - startTime
    } catch (error) {
      dynamoStatus = "unhealthy"
      console.error("DynamoDB health check failed:", error)
    }

    // Mock other health checks
    const systemHealth = {
      overall: dynamoStatus === "healthy" ? "healthy" : "degraded",
      services: {
        api: {
          status: "healthy",
          latency: 45,
          uptime: "99.9%"
        },
        database: {
          status: dynamoStatus,
          latency: dynamoLatency,
          lastSync: new Date().toISOString()
        },
        authentication: {
          status: "healthy",
          latency: 23,
          activeUsers: 156
        },
        webhooks: {
          status: "healthy",
          latency: 67,
          queueSize: 0
        }
      },
      metrics: {
        cpuUsage: 45.2,
        memoryUsage: 62.8,
        diskUsage: 34.1,
        networkLatency: 12.3
      }
    }

    return NextResponse.json(systemHealth)
  } catch (error) {
    console.error("Error checking system health:", error)
    return NextResponse.json({ error: "Failed to check system health" }, { status: 500 })
  }
}