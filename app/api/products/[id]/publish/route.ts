import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getRowFromSheet, updateRowInSheet } from "@/lib/dynamodb/api-service"
import { triggerWebhooks } from "@/lib/webhooks/dispatcher"

/**
 * POST /api/products/[id]/publish
 * Request approval/publish for a product
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params

    // TODO: Check permissions - user must have product:update for this stall

    const product = await getRowFromSheet("products", id)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    await updateRowInSheet("products", id, { status: "pending" })

    await triggerWebhooks(product.business_id, "product.published", {
      productId: id,
      stallId: product.stall_id,
      title: product.title,
      publishedBy: session.userId,
    })

    return NextResponse.json({
      success: true,
      message: "Product submitted for approval",
    })
  } catch (error) {
    console.error("Error publishing product:", error)
    return NextResponse.json({ error: "Failed to publish product" }, { status: 500 })
  }
}
