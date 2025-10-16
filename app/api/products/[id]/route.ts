import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getRow, updateRow, deleteRow, SHEET_COLUMNS } from "@/lib/google/sheets"
import { triggerWebhooks } from "@/lib/webhooks/dispatcher"

/**
 * GET /api/products/[id]
 * Get a single product
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = params
    const product = await getRow("products", id, SHEET_COLUMNS.products)

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

/**
 * PATCH /api/products/[id]
 * Update a product
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // TODO: Check permissions - user must have product:update for this stall

    const existingProduct = await getRow("products", id, SHEET_COLUMNS.products)
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const updateData: any = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.shortDesc !== undefined) updateData.short_desc = body.shortDesc
    if (body.longDesc !== undefined) updateData.long_desc = body.longDesc
    if (body.priceCents !== undefined) updateData.price_cents = body.priceCents
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.sku !== undefined) updateData.sku = body.sku
    if (body.tags !== undefined) updateData.tags_csv = Array.isArray(body.tags) ? body.tags.join(",") : body.tags
    if (body.dietFlags !== undefined)
      updateData.diet_flags_csv = Array.isArray(body.dietFlags) ? body.dietFlags.join(",") : body.dietFlags
    if (body.prepTimeMinutes !== undefined) updateData.prep_time_minutes = body.prepTimeMinutes
    if (body.inventoryQty !== undefined) updateData.inventory_qty = body.inventoryQty
    if (body.status !== undefined) updateData.status = body.status

    await updateRow("products", id, updateData, SHEET_COLUMNS.products)

    await triggerWebhooks(existingProduct.business_id, "product.updated", {
      productId: id,
      stallId: existingProduct.stall_id,
      updatedFields: Object.keys(updateData),
      updatedBy: session.userId,
    })

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
    })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

/**
 * DELETE /api/products/[id]
 * Delete a product
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = params

    // TODO: Check permissions - user must have product:delete for this stall

    await deleteRow("products", id, SHEET_COLUMNS.products)

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
