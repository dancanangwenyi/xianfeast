import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session-server"
import { 
  getOrCreateCart, 
  addItemToCart, 
  removeItemFromCart, 
  updateCartItemQuantity,
  clearCart,
  calculateCartTotal,
  getCartItemCount,
  validateCartItems
} from "@/lib/dynamodb/carts"
import { getProductById } from "@/lib/dynamodb/products"
import { getStallById } from "@/lib/dynamodb/stalls"

/**
 * GET /api/customer/cart - Get customer's cart
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request)
    if (!session?.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if this is a DynamoDB ResourceNotFoundException
    try {
      const cart = await getOrCreateCart(session.userId)
      
      // Validate cart items
      const validation = await validateCartItems(cart)
      
      return NextResponse.json({
        cart,
        total_cents: calculateCartTotal(cart),
        item_count: getCartItemCount(cart),
        validation
      })
    } catch (dbError: any) {
      // Handle DynamoDB table not found error gracefully
      if (dbError.__type === 'com.amazonaws.dynamodb.v20120810#ResourceNotFoundException' || 
          dbError.name === 'ResourceNotFoundException') {
        console.warn("DynamoDB tables not found, returning empty cart")
        
        // Return empty cart structure
        const emptyCart = {
          id: `temp-${session.userId}`,
          customer_id: session.userId,
          items: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }
        
        return NextResponse.json({
          cart: emptyCart,
          total_cents: 0,
          item_count: 0,
          validation: { valid: true, issues: [] },
          warning: "Database not available - using temporary cart"
        })
      }
      throw dbError
    }
  } catch (error) {
    console.error("Cart fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 })
  }
}

/**
 * POST /api/customer/cart - Add item to cart
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request)
    if (!session?.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { product_id, stall_id, quantity = 1, scheduled_for, special_instructions } = body

    if (!product_id || !stall_id) {
      return NextResponse.json({ 
        error: "Product ID and Stall ID are required" 
      }, { status: 400 })
    }

    try {
      // Validate product exists and is available
      const product = await getProductById(product_id)
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }

      if (product.status !== 'active') {
        return NextResponse.json({ 
          error: "Product is not available" 
        }, { status: 400 })
      }

      if (product.inventory_qty < quantity) {
        return NextResponse.json({ 
          error: "Insufficient inventory" 
        }, { status: 400 })
      }

      // Validate stall exists and is active
      const stall = await getStallById(stall_id)
      if (!stall) {
        return NextResponse.json({ error: "Stall not found" }, { status: 404 })
      }

      if (stall.status !== 'active') {
        return NextResponse.json({ 
          error: "Stall is not available" 
        }, { status: 400 })
      }

      // Get or create cart
      const cart = await getOrCreateCart(session.userId)

      // Add item to cart
      const cartItem = {
        product_id,
        stall_id,
        quantity,
        unit_price_cents: product.price_cents,
        scheduled_for,
        special_instructions
      }

      const updatedCart = await addItemToCart(cart.id, cartItem)
      
      if (!updatedCart) {
        return NextResponse.json({ 
          error: "Failed to add item to cart" 
        }, { status: 500 })
      }

      return NextResponse.json({
        cart: updatedCart,
        total_cents: calculateCartTotal(updatedCart),
        item_count: getCartItemCount(updatedCart)
      })
    } catch (dbError: any) {
      // Handle DynamoDB table not found error gracefully
      if (dbError.__type === 'com.amazonaws.dynamodb.v20120810#ResourceNotFoundException' || 
          dbError.name === 'ResourceNotFoundException') {
        console.warn("DynamoDB tables not found, cannot add to cart")
        
        return NextResponse.json({ 
          error: "Cart service temporarily unavailable. Please try again later.",
          warning: "Database not available"
        }, { status: 503 })
      }
      throw dbError
    }
  } catch (error) {
    console.error("Add to cart error:", error)
    return NextResponse.json({ error: "Failed to add item to cart" }, { status: 500 })
  }
}

/**
 * PUT /api/customer/cart - Update cart item quantity
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await verifySession(request)
    if (!session?.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { product_id, stall_id, quantity, scheduled_for } = body

    if (!product_id || !stall_id || quantity === undefined) {
      return NextResponse.json({ 
        error: "Product ID, Stall ID, and quantity are required" 
      }, { status: 400 })
    }

    // Get cart
    const cart = await getOrCreateCart(session.userId)

    // Update item quantity
    const updatedCart = await updateCartItemQuantity(
      cart.id, 
      product_id, 
      stall_id, 
      quantity,
      scheduled_for
    )
    
    if (!updatedCart) {
      return NextResponse.json({ 
        error: "Failed to update cart item" 
      }, { status: 500 })
    }

    return NextResponse.json({
      cart: updatedCart,
      total_cents: calculateCartTotal(updatedCart),
      item_count: getCartItemCount(updatedCart)
    })
  } catch (error) {
    console.error("Update cart error:", error)
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 })
  }
}

/**
 * DELETE /api/customer/cart - Remove item from cart or clear cart
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await verifySession(request)
    if (!session?.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const product_id = searchParams.get('product_id')
    const stall_id = searchParams.get('stall_id')
    const scheduled_for = searchParams.get('scheduled_for')
    const clear_all = searchParams.get('clear_all') === 'true'

    // Get cart
    const cart = await getOrCreateCart(session.userId)

    let updatedCart
    
    if (clear_all) {
      // Clear entire cart
      updatedCart = await clearCart(cart.id)
    } else if (product_id && stall_id) {
      // Remove specific item
      updatedCart = await removeItemFromCart(
        cart.id, 
        product_id, 
        stall_id,
        scheduled_for || undefined
      )
    } else {
      return NextResponse.json({ 
        error: "Either clear_all=true or product_id and stall_id are required" 
      }, { status: 400 })
    }
    
    if (!updatedCart) {
      return NextResponse.json({ 
        error: "Failed to update cart" 
      }, { status: 500 })
    }

    return NextResponse.json({
      cart: updatedCart,
      total_cents: calculateCartTotal(updatedCart),
      item_count: getCartItemCount(updatedCart)
    })
  } catch (error) {
    console.error("Remove from cart error:", error)
    return NextResponse.json({ error: "Failed to remove from cart" }, { status: 500 })
  }
}