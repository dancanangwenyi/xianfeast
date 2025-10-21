import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAllOrders } from "@/lib/dynamodb/orders"
import { getAllProducts } from "@/lib/dynamodb/products"
import { getAllStalls } from "@/lib/dynamodb/stalls"

/**
 * GET /api/analytics/business/[id]/export
 * Export business analytics as CSV
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!session.roles.includes("super_admin")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { id: businessId } = await params
    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get("range") || "30d"

    // Calculate date range
    const now = new Date()
    const daysBack = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    // Fetch data
    const [orders, products, stalls] = await Promise.all([
      getAllOrders({ business_id: businessId }),
      getAllProducts({ business_id: businessId }),
      getAllStalls({ business_id: businessId })
    ])

    // Filter orders by date range
    const filteredOrders = orders.filter(order => 
      new Date(order.created_at) >= startDate
    )

    // Create CSV content
    const csvRows = []
    
    // Header
    csvRows.push([
      "Order ID",
      "Stall",
      "Status",
      "Total (KES)",
      "Created At",
      "Scheduled For"
    ])

    // Data rows
    filteredOrders.forEach(order => {
      const stall = stalls.find(s => s.id === order.stall_id)
      csvRows.push([
        order.id,
        stall?.name || "Unknown",
        order.status,
        (order.total_cents / 100).toFixed(2),
        new Date(order.created_at).toISOString(),
        new Date(order.scheduled_for).toISOString()
      ])
    })

    // Convert to CSV string
    const csvContent = csvRows.map(row => 
      row.map(field => `"${field}"`).join(",")
    ).join("\n")

    // Return CSV response
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="business-report-${businessId}-${range}.csv"`
      }
    })
  } catch (error) {
    console.error("Error exporting analytics:", error)
    return NextResponse.json({ error: "Failed to export analytics" }, { status: 500 })
  }
}