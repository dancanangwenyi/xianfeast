import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { createProduct, getAllProducts } from "@/lib/dynamodb/products"
import { checkPermission } from "@/lib/auth/permissions"
import { triggerWebhooks } from "@/lib/webhooks/dispatcher"

/**
 * GET /api/products
 * List products with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const stallId = searchParams.get("stallId")
    const businessId = searchParams.get("businessId")
    const status = searchParams.get("status")

    // Build filters object
    const filters: any = {}
    if (stallId) filters.stall_id = stallId
    if (businessId) filters.business_id = businessId
    if (status) filters.status = status

    const products = await getAllProducts(filters)

    // Get images for each product
    const { getProductImages } = await import("@/lib/dynamodb/products")
    const productsWithImages = await Promise.all(
      products.map(async (product) => ({
        ...product,
        images: await getProductImages(product.id),
      }))
    )

    return NextResponse.json({ products: productsWithImages })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

/**
 * POST /api/products
 * Create a new product
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const {
      stallId,
      businessId,
      title,
      shortDesc,
      longDesc,
      priceCents,
      currency,
      sku,
      tags,
      dietFlags,
      prepTimeMinutes,
      inventoryQty,
    } = body

    if (!stallId || !businessId || !title || !priceCents) {
      return NextResponse.json({ error: "stallId, businessId, title, and priceCents are required" }, { status: 400 })
    }

    // Check permissions - user must have product:create for this stall
    const hasPermission = await checkPermission(session, "product:create")
    if (!hasPermission) {
      return NextResponse.json({ error: "Insufficient permissions to create products" }, { status: 403 })
    }

    const product = await createProduct({
      stall_id: stallId,
      business_id: businessId,
      title,
      short_desc: shortDesc || "",
      long_desc: longDesc || "",
      price_cents: priceCents,
      currency: currency || "KES",
      sku: sku || "",
      tags_csv: Array.isArray(tags) ? tags.join(",") : tags || "",
      diet_flags_csv: Array.isArray(dietFlags) ? dietFlags.join(",") : dietFlags || "",
      prep_time_minutes: prepTimeMinutes || 0,
      inventory_qty: inventoryQty || 0,
      status: "draft",
      created_by: session.userId,
    })

    await triggerWebhooks(businessId, "product.created", {
      productId: product.id,
      stallId,
      title,
      priceCents,
      createdBy: session.userId,
    })

    return NextResponse.json({
      success: true,
      productId: product.id,
      message: "Product created successfully",
    })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
