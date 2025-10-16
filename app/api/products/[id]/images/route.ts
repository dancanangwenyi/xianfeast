import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { queryRows, deleteRow, SHEET_COLUMNS } from "@/lib/google/sheets"
import { deleteFile } from "@/lib/google/drive"

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
    const images = await queryRows("product_images", SHEET_COLUMNS.product_images, (row) => row.product_id === id)

    // Sort by order_index
    images.sort((a, b) => Number(a.order_index) - Number(b.order_index))

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

    // Get image to find drive_file_id
    const images = await queryRows("product_images", SHEET_COLUMNS.product_images, (row) => row.id === imageId)

    if (images.length === 0) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    const image = images[0]

    // Delete from Drive
    await deleteFile(image.drive_file_id)

    // Delete from sheet
    await deleteRow("product_images", imageId, SHEET_COLUMNS.product_images)

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting image:", error)
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
  }
}
