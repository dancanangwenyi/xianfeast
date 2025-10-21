import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { createBusiness, getAllBusinesses } from "@/lib/dynamodb/business"

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

    const businesses = await getAllBusinesses()

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
    const { name, ownerUserId, currency = "KES", timezone = "Africa/Nairobi", settings, description = "", address = "", phone = "", email = "" } = body

    if (!name || !ownerUserId) {
      return NextResponse.json({ error: "name and ownerUserId are required" }, { status: 400 })
    }

    const business = await createBusiness({
      name,
      description,
      address,
      phone,
      email,
      owner_user_id: ownerUserId,
      status: "active",
      settings_json: settings ? JSON.stringify(settings) : "",
    })

    return NextResponse.json({
      success: true,
      businessId: business.id,
      message: "Business created successfully",
    })
  } catch (error) {
    console.error("Error creating business:", error)
    return NextResponse.json({ error: "Failed to create business" }, { status: 500 })
  }
}
