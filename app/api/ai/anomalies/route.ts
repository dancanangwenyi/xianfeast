import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session"

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

// POST /api/ai/anomalies - Detect anomalies
export async function POST(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { timeframe, threshold } = body

    // Mock anomaly detection
    const mockAnomalies = [
      {
        id: "ANOMALY-001",
        type: "order_volume",
        severity: "high",
        title: "Unusual Order Drop Detected",
        description: "Mediterranean Bistro shows 0 orders for 3 consecutive days, which is 85% below historical average.",
        detectedAt: new Date().toISOString(),
        affectedBusiness: "Mediterranean Bistro",
        businessId: "4",
        metrics: {
          currentValue: 0,
          expectedValue: 15,
          deviation: -100,
          historicalAverage: 15
        },
        recommendations: [
          "Contact business owner immediately",
          "Check for technical issues",
          "Review recent changes or events"
        ]
      },
      {
        id: "ANOMALY-002",
        type: "revenue_spike",
        severity: "medium",
        title: "Unusual Revenue Spike",
        description: "Golden Dragon Restaurant shows 45% increase in revenue compared to last week.",
        detectedAt: new Date().toISOString(),
        affectedBusiness: "Golden Dragon Restaurant",
        businessId: "1",
        metrics: {
          currentValue: 15680,
          expectedValue: 10800,
          deviation: 45,
          historicalAverage: 12000
        },
        recommendations: [
          "Investigate cause of increase",
          "Consider scaling operations",
          "Monitor for sustainability"
        ]
      },
      {
        id: "ANOMALY-003",
        type: "user_activity",
        severity: "low",
        title: "Unusual Login Pattern",
        description: "User john@example.com shows 15 login attempts in 1 hour, which is above normal.",
        detectedAt: new Date().toISOString(),
        affectedUser: "john@example.com",
        userId: "2",
        metrics: {
          currentValue: 15,
          expectedValue: 3,
          deviation: 400,
          historicalAverage: 2
        },
        recommendations: [
          "Check for security issues",
          "Consider temporary account lock",
          "Review login logs"
        ]
      }
    ]

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      anomalies: mockAnomalies,
      detectedAt: new Date().toISOString(),
      processingTime: "1.0s",
      totalAnomalies: mockAnomalies.length
    })
  } catch (error) {
    console.error("Error detecting anomalies:", error)
    return NextResponse.json({ error: "Failed to detect anomalies" }, { status: 500 })
  }
}
