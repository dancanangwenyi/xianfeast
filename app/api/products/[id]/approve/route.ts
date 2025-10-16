import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { updateRow, SHEET_COLUMNS } from "@/lib/google/sheets"

/**
 * POST /api/products/[id]/approve
 * Approve a product (requires approver role)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params

    // TODO: Check permissions - user must have product:approve for this stall

    await updateRow("products", id, { status: "active" }, SHEET_COLUMNS.products)

    // TODO: Emit webhook event: product.approved

    return NextResponse.json({
      success: true,
      message: "Product approved successfully",
    })
  } catch (error) {
    console.error("Error approving product:", error)
    return NextResponse.json({ error: "Failed to approve product" }, { status: 500 })
  }
}
