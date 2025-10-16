import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { uploadFile } from "@/lib/google/drive"
import { appendRow, SHEET_COLUMNS } from "@/lib/google/sheets"
import { v4 as uuidv4 } from "uuid"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

/**
 * POST /api/drive/upload
 * Upload an image to Google Drive and optionally attach to a product
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const productId = formData.get("productId") as string
    const businessId = formData.get("businessId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!businessId) {
      return NextResponse.json({ error: "businessId is required" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed" },
        { status: 400 },
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Drive
    const { drive_file_id, url } = await uploadFile(file.name, file.type, buffer, businessId)

    // If productId provided, create product_images record
    if (productId) {
      const imageId = uuidv4()
      await appendRow(
        "product_images",
        {
          id: imageId,
          product_id: productId,
          drive_file_id,
          url_cached: url,
          order_index: 0, // TODO: Get max order_index + 1
        },
        SHEET_COLUMNS.product_images,
      )

      return NextResponse.json({
        success: true,
        imageId,
        driveFileId: drive_file_id,
        url,
        message: "Image uploaded and attached to product",
      })
    }

    return NextResponse.json({
      success: true,
      driveFileId: drive_file_id,
      url,
      message: "Image uploaded successfully",
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
