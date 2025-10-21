import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAllUsers, getUserById } from "@/lib/dynamodb/users"
import { getAllOrders } from "@/lib/dynamodb/orders"
import { getAllStalls } from "@/lib/dynamodb/stalls"
import { getAllProducts } from "@/lib/dynamodb/products"
import { getAllBusinesses } from "@/lib/dynamodb/business"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user has customer role
    if (!session.roles?.includes("customer")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get customer profile data
    const customer = await getUserById(session.userId)

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Get customer's recent orders (last 10)
    const allOrders = await getAllOrders()
    const customerOrders = allOrders
      .filter(order => order.customer_id === session.userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)

    // Get upcoming orders (scheduled for future dates)
    const now = new Date()
    const upcomingOrders = customerOrders.filter(order => {
      if (order.scheduled_for) {
        const scheduledDate = new Date(order.scheduled_for)
        return scheduledDate > now && order.status !== 'canceled' && order.status !== 'completed'
      }
      return false
    })

    // Get available stalls with active products
    const allStalls = await getAllStalls()
    const allProducts = await getAllProducts()
    const allBusinesses = await getAllBusinesses()
    
    const activeStalls = allStalls
      .filter(stall => stall.status === "active")
      .map(stall => {
        const stallProducts = allProducts.filter(product => 
          product.stall_id === stall.id && product.status === "active"
        )
        const business = allBusinesses.find(b => b.id === stall.business_id)
        return {
          ...stall,
          business_name: business?.name || "Unknown Business",
          product_count: stallProducts.length,
          has_products: stallProducts.length > 0
        }
      })
      .filter(stall => stall.has_products)

    // Calculate customer statistics
    const totalOrders = customerOrders.length
    const totalSpent = customerOrders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + (order.total_amount_cents || 0), 0)

    const customerStats = {
      total_orders: totalOrders,
      total_spent_cents: totalSpent,
      upcoming_orders_count: upcomingOrders.length,
      favorite_stalls: customer.customer_preferences?.favorite_stalls || []
    }

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        customer_preferences: customer.customer_preferences || {},
        customer_stats: customerStats
      },
      recent_orders: customerOrders,
      upcoming_orders: upcomingOrders,
      available_stalls: activeStalls.slice(0, 6), // Limit to 6 for dashboard
      stats: customerStats
    })

  } catch (error) {
    console.error("Customer dashboard error:", error)
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    )
  }
}