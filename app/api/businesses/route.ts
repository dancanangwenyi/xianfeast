import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { appendRow, queryRows, SHEET_COLUMNS } from "@/lib/google/sheets"
import { v4 as uuidv4 } from "uuid"

/**
 * GET /api/businesses
 * List all businesses (super admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!session.roles.includes("super_admin")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const businesses = await queryRows("businesses", SHEET_COLUMNS.businesses, () => true)

    return NextResponse.json({ businesses })
  } catch (error) {
    console.error("Error fetching businesses:", error)
    return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 })
  }
}

/**
 * POST /api/businesses
 * Create a new business (super admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!session.roles.includes("super_admin")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { name, ownerUserId, currency = "KES", timezone = "Africa/Nairobi", settings } = body

    if (!name || !ownerUserId) {
      return NextResponse.json({ error: "name and ownerUserId are required" }, { status: 400 })
    }

    const businessId = uuidv4()
    await appendRow(
      "businesses",
      {
        id: businessId,
        name,
        owner_user_id: ownerUserId,
        currency,
        timezone,
        status: "active",
        settings_json: settings ? JSON.stringify(settings) : "",
      },
      SHEET_COLUMNS.businesses,
    )

    return NextResponse.json({
      success: true,
      businessId,
      message: "Business created successfully",
    })
  } catch (error) {
    console.error("Error creating business:", error)
    return NextResponse.json({ error: "Failed to create business" }, { status: 500 })
  }
}
