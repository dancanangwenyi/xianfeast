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

// POST /api/ai/forecast - Generate demand forecast
export async function POST(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { timeframe, businessId } = body

    // Mock demand forecast
    const mockForecast = {
      timeframe: timeframe || "7d",
      businessId: businessId || "all",
      predictions: [
        {
          date: "2024-10-17",
          predictedOrders: 45,
          confidence: 85,
          factors: ["Historical trend", "Day of week", "Seasonal pattern"]
        },
        {
          date: "2024-10-18",
          predictedOrders: 52,
          confidence: 87,
          factors: ["Historical trend", "Day of week", "Recent growth"]
        },
        {
          date: "2024-10-19",
          predictedOrders: 38,
          confidence: 82,
          factors: ["Historical trend", "Day of week"]
        },
        {
          date: "2024-10-20",
          predictedOrders: 67,
          confidence: 90,
          factors: ["Historical trend", "Day of week", "Weekend pattern"]
        },
        {
          date: "2024-10-21",
          predictedOrders: 73,
          confidence: 88,
          factors: ["Historical trend", "Day of week", "Weekend pattern"]
        },
        {
          date: "2024-10-22",
          predictedOrders: 58,
          confidence: 85,
          factors: ["Historical trend", "Day of week"]
        },
        {
          date: "2024-10-23",
          predictedOrders: 62,
          confidence: 86,
          factors: ["Historical trend", "Day of week", "Recent growth"]
        }
      ],
      summary: {
        totalPredictedOrders: 397,
        averageDailyOrders: 57,
        peakDay: "2024-10-21",
        peakOrders: 73,
        growthRate: 12.5
      },
      recommendations: [
        "Consider increasing inventory for weekend days",
        "Promote early bird specials on low-demand days",
        "Prepare for peak demand on Saturday"
      ]
    }

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500))

    return NextResponse.json({
      success: true,
      forecast: mockForecast,
      generatedAt: new Date().toISOString(),
      processingTime: "1.5s"
    })
  } catch (error) {
    console.error("Error generating forecast:", error)
    return NextResponse.json({ error: "Failed to generate forecast" }, { status: 500 })
  }
}
