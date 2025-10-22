import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getStallById } from "@/lib/dynamodb/stalls"
import { getProductsByStallId, getProductImages } from "@/lib/dynamodb/products"
import { getBusinessById } from "@/lib/dynamodb/business"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user has customer role
    if (!session.roles?.includes("customer")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const stallId = params.id

    // Get stall details
    const stall = await getStallById(stallId)
    if (!stall || stall.status !== "active") {
      return NextResponse.json({ error: "Stall not found" }, { status: 404 })
    }

    // Get business details
    const business = await getBusinessById(stall.business_id)
    
    // Get stall products
    const allProducts = await getProductsByStallId(stallId)
    const activeProducts = allProducts.filter(product => product.status === "active")

    // Get product images for each product
    const productsWithImages = await Promise.all(
      activeProducts.map(async (product) => {
        const images = await getProductImages(product.id)
        const approvedImages = images
          .filter(img => img.approved_at)
          .sort((a, b) => a.order_index - b.order_index)
        
        return {
          ...product,
          images: approvedImages
        }
      })
    )

    const stallDetail = {
      ...stall,
      business_name: business?.name || "Unknown Business",
      products: productsWithImages
    }

    return NextResponse.json(stallDetail)

  } catch (error) {
    console.error("Stall detail error:", error)
    return NextResponse.json(
      { error: "Failed to load stall details" },
      { status: 500 }
    )
  }
}