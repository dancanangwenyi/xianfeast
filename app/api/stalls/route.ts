import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { createStall, getAllStalls } from "@/lib/dynamodb/stalls"
import { checkPermission } from "@/lib/auth/permissions"

/**
 * GET /api/stalls
 * List stalls with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get("businessId")

    const filters: any = {}
    if (businessId) filters.business_id = businessId

    const stalls = await getAllStalls(filters)

    return NextResponse.json({ stalls })
  } catch (error) {
    console.error("Error fetching stalls:", error)
    return NextResponse.json({ error: "Failed to fetch stalls" }, { status: 500 })
  }
}

/**
 * POST /api/stalls
 * Create a new stall
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { businessId, name, description, pickupAddress, openHours, capacityPerDay } = body

    if (!businessId || !name) {
      return NextResponse.json({ error: "businessId and name are required" }, { status: 400 })
    }

    // Check permissions - user must have stall:create for this business
    const hasPermission = await checkPermission(session, "stall:create")
    if (!hasPermission) {
      return NextResponse.json({ error: "Insufficient permissions to create stalls" }, { status: 403 })
    }

    const stall = await createStall({
      business_id: businessId,
      name,
      description: description || "",
      pickup_address: pickupAddress || "",
      open_hours_json: openHours ? JSON.stringify(openHours) : "",
      capacity_per_day: capacityPerDay || 100,
      status: "active",
    })

    return NextResponse.json({
      success: true,
      stallId: stall.id,
      message: "Stall created successfully",
    })
  } catch (error) {
    console.error("Error creating stall:", error)
    return NextResponse.json({ error: "Failed to create stall" }, { status: 500 })
  }
}
