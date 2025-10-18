import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session"
import { getSheetsClient } from "@/lib/google/auth"

// Middleware to check super admin role
async function requireSuperAdmin(request: NextRequest) {
  try {
    const session = await verifySession(request)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session.roles.includes("super_admin")) {
      return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 })
    }

    return null // No error, continue
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// GET /api/admin/approvals - Get pending approvals
export async function GET(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    if (!SPREADSHEET_ID) {
      return NextResponse.json({ error: "Spreadsheet ID not configured" }, { status: 500 })
    }

    const sheets = getSheetsClient()

    // Get products with pending status
    const productsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "products!A:ZZ",
    })

    const pendingProducts = productsResponse.data.values?.slice(1)
      .filter(row => row[14] === "pending") // status column
      .map(row => ({
        id: row[0],
        type: "product",
        title: row[3], // title
        description: row[5], // long_desc
        status: row[14], // status
        submittedBy: row[13], // created_by
        businessId: row[2], // business_id
        submittedAt: row[15], // created_at
        metadata: {
          price: row[6], // price_cents
          category: row[8], // sku (could be category)
          prepTime: row[11], // prep_time_minutes
        }
      })) || []

    // Mock additional approval types for now
    const mockApprovals = [
      {
        id: "APP-001",
        type: "image",
        title: "Product Image: Kung Pao Chicken",
        description: "High-quality image for the Kung Pao Chicken product",
        status: "pending",
        submittedBy: "chef@goldendragon.com",
        businessId: "1",
        submittedAt: "2024-10-16T17:45:00Z",
        metadata: {
          imageUrl: "/placeholder.jpg",
          productId: "PROD-001",
          dimensions: "1200x800"
        }
      },
      {
        id: "APP-002",
        type: "business",
        title: "New Business: Sushi Master",
        description: "Traditional Japanese sushi restaurant with fresh ingredients",
        status: "pending",
        submittedBy: "owner@sushimaster.com",
        submittedAt: "2024-10-16T16:20:00Z",
        metadata: {
          address: "456 Sushi St, Tokyo, JP",
          phone: "+81-3-1234-5678",
          cuisine: "Japanese",
          capacity: 50
        }
      }
    ]

    const allApprovals = [...pendingProducts, ...mockApprovals]

    return NextResponse.json({ approvals: allApprovals })
  } catch (error) {
    console.error("Error fetching approvals:", error)
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 })
  }
}

// POST /api/admin/approvals/[id]/approve - Approve pending item
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    const approvalId = params.id
    const body = await request.json()
    const { action } = body // "approve" or "reject"

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    if (!SPREADSHEET_ID) {
      return NextResponse.json({ error: "Spreadsheet ID not configured" }, { status: 500 })
    }

    const sheets = getSheetsClient()

    // For products, update the status
    if (approvalId.startsWith("PROD-")) {
      const productsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "products!A:ZZ",
      })

      const products = productsResponse.data.values || []
      const productIndex = products.findIndex(row => row[0] === approvalId)

      if (productIndex === -1) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }

      const updatedProduct = [...products[productIndex]]
      updatedProduct[14] = action === "approve" ? "active" : "rejected"

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `products!A${productIndex + 1}:ZZ${productIndex + 1}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [updatedProduct]
        }
      })
    }

    // TODO: Handle other approval types (images, businesses, etc.)

    return NextResponse.json({ 
      success: true, 
      message: `Item ${action}d successfully` 
    })
  } catch (error) {
    console.error("Error processing approval:", error)
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 })
  }
}
