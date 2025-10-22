import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"

/**
 * GET /api/customer/dashboard
 * Get customer dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user has customer role
    if (!session.roles.includes("customer")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Mock dashboard data for now
    const dashboardData = {
      customer: {
        id: session.userId,
        name: "Willie Macharia",
        email: session.email,
        customer_preferences: {},
        customer_stats: {
          total_orders: 12,
          total_spent_cents: 24500,
          upcoming_orders_count: 2,
          favorite_stalls: ["stall1", "stall2"]
        }
      },
      recent_orders: [
        {
          id: "order1",
          stall_name: "Dragon Noodles",
          status: "completed",
          total_amount_cents: 1500,
          created_at: new Date().toISOString()
        },
        {
          id: "order2", 
          stall_name: "Spice Garden",
          status: "pending",
          total_amount_cents: 2000,
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ],
      upcoming_orders: [
        {
          id: "order3",
          stall_name: "Fresh Bowls",
          status: "confirmed",
          total_amount_cents: 1800,
          scheduled_for: new Date(Date.now() + 3600000).toISOString()
        }
      ],
      available_stalls: [
        {
          id: "stall1",
          name: "Dragon Noodles",
          cuisine_type: "Asian",
          product_count: 15,
          min_price_cents: 800,
          max_price_cents: 2500
        },
        {
          id: "stall2",
          name: "Spice Garden", 
          cuisine_type: "Indian",
          product_count: 20,
          min_price_cents: 1000,
          max_price_cents: 3000
        },
        {
          id: "stall3",
          name: "Fresh Bowls",
          cuisine_type: "Healthy",
          product_count: 12,
          min_price_cents: 1200,
          max_price_cents: 2200
        }
      ],
      stats: {
        total_orders: 12,
        total_spent_cents: 24500,
        upcoming_orders_count: 2,
        favorite_stalls: ["stall1", "stall2"]
      }
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("Error loading customer dashboard:", error)
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 })
  }
}