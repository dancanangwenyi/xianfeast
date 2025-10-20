import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getProductById, updateProduct, deleteProduct } from "@/lib/dynamodb/products"
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
    const product = await getProductById(id)

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

    const existingProduct = await getProductById(id)
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const updateData: any = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.short_desc !== undefined) updateData.short_desc = body.short_desc
    if (body.long_desc !== undefined) updateData.long_desc = body.long_desc
    if (body.price_cents !== undefined) updateData.price_cents = body.price_cents
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.sku !== undefined) updateData.sku = body.sku
    if (body.tags_csv !== undefined) updateData.tags_csv = body.tags_csv
    if (body.diet_flags_csv !== undefined) updateData.diet_flags_csv = body.diet_flags_csv
    if (body.prep_time_minutes !== undefined) updateData.prep_time_minutes = body.prep_time_minutes
    if (body.inventory_qty !== undefined) updateData.inventory_qty = body.inventory_qty
    if (body.status !== undefined) updateData.status = body.status

    const updatedProduct = await updateProduct(id, updateData)

    if (!updatedProduct) {
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
    }

    await triggerWebhooks(existingProduct.business_id, "product.updated", {
      productId: id,
      stallId: existingProduct.stall_id,
      updatedFields: Object.keys(updateData),
      updatedBy: session.userId,
    })

    return NextResponse.json({
      success: true,
      product: updatedProduct,
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

    await deleteProduct(id)

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
