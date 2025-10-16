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

// POST /api/ai/chat - AI chat interface
export async function POST(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { query, context } = body

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Mock AI chat response
    // In a real implementation, this would call an AI service
    const mockResponse = `Based on your query "${query}", here's what I found:

1. **Current Performance**: Your platform is showing strong growth with 15% increase in orders this week.

2. **Key Insights**: 
   - Peak ordering time is 7-8 PM
   - Golden Dragon Restaurant is your top performer
   - Mediterranean Bistro needs attention (0 orders)

3. **Recommendations**:
   - Consider promoting early bird specials during 5-6 PM
   - Reach out to Mediterranean Bistro for support
   - Optimize inventory for Spice Garden

4. **Next Steps**:
   - Monitor Mediterranean Bistro closely
   - Implement early bird promotions
   - Schedule business check-ins

Would you like me to dive deeper into any of these areas or help you with something else?`

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000))

    return NextResponse.json({
      success: true,
      response: mockResponse,
      query: query,
      context: context,
      generatedAt: new Date().toISOString(),
      processingTime: "2.0s"
    })
  } catch (error) {
    console.error("Error processing chat query:", error)
    return NextResponse.json({ error: "Failed to process chat query" }, { status: 500 })
  }
}
