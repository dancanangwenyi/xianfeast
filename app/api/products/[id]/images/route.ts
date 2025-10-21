import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { queryRowsFromSheet, deleteRowFromSheet } from "@/lib/dynamodb/api-service"

/**
 * GET /api/products/[id]/images
 * Get all images for a product
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const images = await queryRowsFromSheet("product_images", { product_id: id })

    // Sort by order_index
    images.sort((a, b) => Number(a.order_index || 0) - Number(b.order_index || 0))

    return NextResponse.json({ images })
  } catch (error) {
    console.error("Error fetching images:", error)
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 })
  }
}

/**
 * DELETE /api/products/[id]/images/[imageId]
 * Delete an image
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { imageId } = await params

    // Get image
    const images = await queryRowsFromSheet("product_images", { id: imageId })

    if (images.length === 0) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    // Delete from DynamoDB (no Google Drive deletion needed)
    await deleteRowFromSheet("product_images", imageId)

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting image:", error)
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
  }
}
