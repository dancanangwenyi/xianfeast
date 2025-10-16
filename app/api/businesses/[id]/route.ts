import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getRow, updateRow, SHEET_COLUMNS } from "@/lib/google/sheets"

/**
 * GET /api/businesses/[id]
 * Get a single business
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const business = await getRow("businesses", id, SHEET_COLUMNS.businesses)

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    return NextResponse.json({ business })
  } catch (error) {
    console.error("Error fetching business:", error)
    return NextResponse.json({ error: "Failed to fetch business" }, { status: 500 })
  }
}

/**
 * PATCH /api/businesses/[id]
 * Update a business
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!session.roles.includes("super_admin")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.timezone !== undefined) updateData.timezone = body.timezone
    if (body.status !== undefined) updateData.status = body.status
    if (body.settings !== undefined) updateData.settings_json = JSON.stringify(body.settings)

    await updateRow("businesses", id, updateData, SHEET_COLUMNS.businesses)

    return NextResponse.json({
      success: true,
      message: "Business updated successfully",
    })
  } catch (error) {
    console.error("Error updating business:", error)
    return NextResponse.json({ error: "Failed to update business" }, { status: 500 })
  }
}
