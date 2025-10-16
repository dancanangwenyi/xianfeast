import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { appendRow, queryRows, SHEET_COLUMNS } from "@/lib/google/sheets"
import { v4 as uuidv4 } from "uuid"

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

    let filterFn = (row: any) => true
    if (businessId) {
      filterFn = (row: any) => row.business_id === businessId
    }

    const stalls = await queryRows("stalls", SHEET_COLUMNS.stalls, filterFn)

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

    const stallId = uuidv4()
    await appendRow(
      "stalls",
      {
        id: stallId,
        business_id: businessId,
        name,
        description: description || "",
        pickup_address: pickupAddress || "",
        open_hours_json: openHours ? JSON.stringify(openHours) : "",
        capacity_per_day: capacityPerDay || 100,
        status: "active",
      },
      SHEET_COLUMNS.stalls,
    )

    return NextResponse.json({
      success: true,
      stallId,
      message: "Stall created successfully",
    })
  } catch (error) {
    console.error("Error creating stall:", error)
    return NextResponse.json({ error: "Failed to create stall" }, { status: 500 })
  }
}
