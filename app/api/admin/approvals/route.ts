import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session"
import { queryRowsFromSheet, updateRowInSheet } from "@/lib/dynamodb/api-service"

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
    // Get products with pending status
    const pendingProducts = await queryRowsFromSheet("products", { status: "pending" })

    const approvals = pendingProducts.map(product => ({
      id: `PROD-${product.id}`,
      type: "product",
      title: product.name || product.title,
      description: product.description,
      submittedBy: product.created_by || "Unknown",
      submittedAt: product.created_at,
      status: "pending",
      metadata: {
        productId: product.id,
        stallId: product.stall_id,
        price: product.price,
      }
    }))

    return NextResponse.json({ approvals })
  } catch (error) {
    console.error("Error fetching approvals:", error)
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 })
  }
}

// POST /api/admin/approvals - Approve or reject an item
export async function POST(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    const { approvalId, action, reason } = await request.json()

    if (!approvalId || !action) {
      return NextResponse.json({ error: "Approval ID and action are required" }, { status: 400 })
    }

    // For products, update the status
    if (approvalId.startsWith("PROD-")) {
      const productId = approvalId.replace("PROD-", "")
      const newStatus = action === "approve" ? "active" : "rejected"
      
      await updateRowInSheet("products", productId, {
        status: newStatus,
        approved_at: new Date().toISOString(),
        approval_reason: reason || "",
      })

      return NextResponse.json({
        success: true,
        message: `Product ${action}d successfully`,
      })
    }

    return NextResponse.json({ error: "Invalid approval ID" }, { status: 400 })
  } catch (error) {
    console.error("Error processing approval:", error)
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 })
  }
}