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

// POST /api/ai/insights - Handle AI operations
export async function POST(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { action, type, data, timeframe, businessId, threshold, query, context } = body

    switch (action) {
      case "insights":
        // Mock AI insights generation
        const mockInsights = [
          {
            id: "INSIGHT-001",
            type: "prediction",
            title: "Revenue Growth Forecast",
            description: "Based on current trends, revenue is expected to increase by 15% next week, reaching $11,200. Peak day will be Thursday with 65 orders.",
            confidence: 87,
            impact: "high",
            category: "revenue",
            generatedAt: new Date().toISOString(),
            actionable: true,
            metadata: {
              predictedRevenue: 11200,
              peakDay: "Thursday",
              peakOrders: 65
            }
          },
          {
            id: "INSIGHT-002",
            type: "recommendation",
            title: "Menu Optimization Opportunity",
            description: "Kung Pao Chicken shows 23% higher order frequency during peak hours. Consider promoting complementary dishes to increase average order value.",
            confidence: 92,
            impact: "medium",
            category: "marketing",
            generatedAt: new Date().toISOString(),
            actionable: true,
            metadata: {
              product: "Kung Pao Chicken",
              orderIncrease: 23,
              suggestedAction: "promote_complementary"
            }
          }
        ]

        await new Promise(resolve => setTimeout(resolve, 2000))
        return NextResponse.json({
          success: true,
          insights: mockInsights,
          generatedAt: new Date().toISOString(),
          processingTime: "2.1s"
        })

      case "forecast":
        // Mock demand forecast
        const mockForecast = {
          timeframe: timeframe || "7d",
          businessId: businessId || "all",
          predictions: [
            { date: "2024-10-17", predictedOrders: 45, confidence: 85, factors: ["Historical trend", "Day of week"] },
            { date: "2024-10-18", predictedOrders: 52, confidence: 87, factors: ["Historical trend", "Day of week"] },
            { date: "2024-10-19", predictedOrders: 38, confidence: 82, factors: ["Historical trend", "Day of week"] }
          ],
          summary: {
            totalPredictedOrders: 135,
            averageDailyOrders: 45,
            peakDay: "2024-10-18",
            peakOrders: 52,
            growthRate: 12.5
          }
        }

        await new Promise(resolve => setTimeout(resolve, 1500))
        return NextResponse.json({
          success: true,
          forecast: mockForecast,
          generatedAt: new Date().toISOString(),
          processingTime: "1.5s"
        })

      case "anomalies":
        // Mock anomaly detection
        const mockAnomalies = [
          {
            id: "ANOMALY-001",
            type: "order_volume",
            severity: "high",
            title: "Unusual Order Drop Detected",
            description: "Mediterranean Bistro shows 0 orders for 3 consecutive days.",
            detectedAt: new Date().toISOString(),
            affectedBusiness: "Mediterranean Bistro",
            businessId: "4"
          }
        ]

        await new Promise(resolve => setTimeout(resolve, 1000))
        return NextResponse.json({
          success: true,
          anomalies: mockAnomalies,
          detectedAt: new Date().toISOString(),
          processingTime: "1.0s"
        })

      case "chat":
        if (!query) {
          return NextResponse.json({ error: "Query is required" }, { status: 400 })
        }

        const mockResponse = `Based on your query "${query}", here's what I found:

1. **Current Performance**: Your platform is showing strong growth with 15% increase in orders this week.
2. **Key Insights**: Peak ordering time is 7-8 PM, Golden Dragon Restaurant is your top performer.
3. **Recommendations**: Consider promoting early bird specials during 5-6 PM.

Would you like me to dive deeper into any of these areas?`

        await new Promise(resolve => setTimeout(resolve, 2000))
        return NextResponse.json({
          success: true,
          response: mockResponse,
          query: query,
          generatedAt: new Date().toISOString(),
          processingTime: "2.0s"
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error processing AI request:", error)
    return NextResponse.json({ error: "Failed to process AI request" }, { status: 500 })
  }
}
