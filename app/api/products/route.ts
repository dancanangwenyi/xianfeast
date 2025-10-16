import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { appendRow, queryRows, SHEET_COLUMNS } from "@/lib/google/sheets"
import { v4 as uuidv4 } from "uuid"
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

    // Build filter function
    let filterFn = (row: any) => true

    if (stallId) {
      const prevFilter = filterFn
      filterFn = (row: any) => prevFilter(row) && row.stall_id === stallId
    }

    if (businessId) {
      const prevFilter = filterFn
      filterFn = (row: any) => prevFilter(row) && row.business_id === businessId
    }

    if (status) {
      const prevFilter = filterFn
      filterFn = (row: any) => prevFilter(row) && row.status === status
    }

    const products = await queryRows("products", SHEET_COLUMNS.products, filterFn)

    // Get images for each product
    const allImages = await queryRows("product_images", SHEET_COLUMNS.product_images, () => true)

    const productsWithImages = products.map((product) => ({
      ...product,
      images: allImages
        .filter((img) => img.product_id === product.id)
        .sort((a, b) => Number(a.order_index) - Number(b.order_index)),
    }))

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

    // TODO: Check permissions - user must have product:create for this stall

    const productId = uuidv4()
    await appendRow(
      "products",
      {
        id: productId,
        stall_id: stallId,
        business_id: businessId,
        title,
        short_desc: shortDesc || "",
        long_desc: longDesc || "",
        price_cents: priceCents,
        currency: currency || "USD",
        sku: sku || "",
        tags_csv: Array.isArray(tags) ? tags.join(",") : tags || "",
        diet_flags_csv: Array.isArray(dietFlags) ? dietFlags.join(",") : dietFlags || "",
        prep_time_minutes: prepTimeMinutes || 0,
        inventory_qty: inventoryQty || null,
        status: "draft",
        created_by: session.userId,
      },
      SHEET_COLUMNS.products,
    )

    await triggerWebhooks(businessId, "product.created", {
      productId,
      stallId,
      title,
      priceCents,
      createdBy: session.userId,
    })

    return NextResponse.json({
      success: true,
      productId,
      message: "Product created successfully",
    })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
