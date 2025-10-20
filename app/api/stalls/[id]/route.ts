import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getStallById, updateStall, deleteStall } from "@/lib/dynamodb/stalls"

/**
 * GET /api/stalls/[id]
 * Get a single stall
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const stall = await getStallById(id)

    if (!stall) {
      return NextResponse.json({ error: "Stall not found" }, { status: 404 })
    }

    return NextResponse.json({ stall })
  } catch (error) {
    console.error("Error fetching stall:", error)
    return NextResponse.json({ error: "Failed to fetch stall" }, { status: 500 })
  }
}

/**
 * PATCH /api/stalls/[id]
 * Update a stall
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
    if (body.description !== undefined) updateData.description = body.description
    if (body.pickup_address !== undefined) updateData.pickup_address = body.pickup_address
    if (body.capacity_per_day !== undefined) updateData.capacity_per_day = body.capacity_per_day
    if (body.status !== undefined) updateData.status = body.status
    if (body.open_hours_json !== undefined) updateData.open_hours_json = body.open_hours_json

    const updatedStall = await updateStall(id, updateData)

    if (!updatedStall) {
      return NextResponse.json({ error: "Stall not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      stall: updatedStall,
      message: "Stall updated successfully",
    })
  } catch (error) {
    console.error("Error updating stall:", error)
    return NextResponse.json({ error: "Failed to update stall" }, { status: 500 })
  }
}

/**
 * DELETE /api/stalls/[id]
 * Delete a stall (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!session.roles.includes("super_admin")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { id } = await params
    await deleteStall(id)

    return NextResponse.json({
      success: true,
      message: "Stall deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting stall:", error)
    return NextResponse.json({ error: "Failed to delete stall" }, { status: 500 })
  }
}