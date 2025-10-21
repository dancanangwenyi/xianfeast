import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAllStalls } from "@/lib/dynamodb/stalls"
import { getAllProducts } from "@/lib/dynamodb/products"
import { getAllBusinesses } from "@/lib/dynamodb/business"
import { OptimizedQueries, QueryPerformanceMonitor } from "@/lib/dynamodb/performance"
import { stallsCache, productsCache, businessCache, CacheKeys } from "@/lib/cache/cache-manager"
import { withPerformanceMonitoring, PerformanceMonitor } from "@/lib/monitoring/performance-monitor"
import { withSecurity, RateLimiter } from "@/lib/security/rate-limiter"

export async function GET(request: NextRequest) {
  return withPerformanceMonitoring(async (req: NextRequest) => {
    try {
      // Apply security and rate limiting
      withSecurity({
        rateLimit: RateLimiter.RULES.BROWSE,
        validateRequest: true
      })(request)

      const session = await getSession()
      if (!session) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      }

      // Check if user has customer role
      if (!session.roles?.includes("customer")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const search = searchParams.get("search") || ""
      const cuisine = searchParams.get("cuisine") || ""
      const priceRange = searchParams.get("priceRange") || ""

      // Record user action
      PerformanceMonitor.recordUserAction({
        action: 'browse_stalls',
        userId: session.userId || 'anonymous',
        metadata: { search, cuisine, priceRange }
      })

      // Try to get data from cache first
      const cacheKey = CacheKeys.stallsWithProducts()
      let stallsWithProducts = stallsCache.get(cacheKey)

      if (!stallsWithProducts) {
        // Get all stalls and products with optimized queries
        const [allStalls, allProducts, allBusinesses] = await Promise.all([
          QueryPerformanceMonitor.measureQuery('getAllStalls', () => getAllStalls()),
          QueryPerformanceMonitor.measureQuery('getAllProducts', () => getAllProducts()),
          QueryPerformanceMonitor.measureQuery('getAllBusinesses', () => getAllBusinesses())
        ])

        // Filter active stalls with products
        stallsWithProducts = allStalls
          .filter(stall => stall.status === "active")
          .map(stall => {
            const stallProducts = allProducts.filter(product => 
              product.stall_id === stall.id && product.status === "active"
            )
            
            const business = allBusinesses.find(b => b.id === stall.business_id)
            
            // Calculate price range from products
            const prices = stallProducts.map(p => p.price_cents || 0).filter(p => p > 0)
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0
            const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

            return {
              ...stall,
              business_name: business?.name || "Unknown Business",
              product_count: stallProducts.length,
              min_price_cents: minPrice,
              max_price_cents: maxPrice,
              products: stallProducts.slice(0, 3), // Preview products
              has_products: stallProducts.length > 0
            }
          })
          .filter(stall => stall.has_products)

        // Cache the processed data for 5 minutes
        stallsCache.set(cacheKey, stallsWithProducts, 300000)
      }

      // Apply filters to cached data
      let stalls = [...stallsWithProducts]

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase()
      stalls = stalls.filter(stall => 
        stall.name.toLowerCase().includes(searchLower) ||
        stall.description?.toLowerCase().includes(searchLower) ||
        stall.cuisine_type?.toLowerCase().includes(searchLower)
      )
    }

    if (cuisine) {
      stalls = stalls.filter(stall => 
        stall.cuisine_type?.toLowerCase() === cuisine.toLowerCase()
      )
    }

    if (priceRange) {
      const [min, max] = priceRange.split("-").map(Number)
      stalls = stalls.filter(stall => {
        if (stall.min_price_cents === 0 && stall.max_price_cents === 0) return false
        const avgPrice = (stall.min_price_cents + stall.max_price_cents) / 2
        return avgPrice >= min && (max === 999999 ? true : avgPrice <= max)
      })
    }

      // Get unique cuisine types for filtering (cached)
      let cuisineTypes = stallsCache.get('cuisine_types')
      if (!cuisineTypes) {
        cuisineTypes = [...new Set(
          stallsWithProducts
            .filter(stall => stall.cuisine_type)
            .map(stall => stall.cuisine_type!)
        )].sort()
        stallsCache.set('cuisine_types', cuisineTypes, 600000) // Cache for 10 minutes
      }

      // Record performance metrics
      PerformanceMonitor.recordMetric(
        'stalls_query_results',
        stalls.length,
        'gauge',
        { search: search ? 'true' : 'false', cuisine: cuisine ? 'true' : 'false' }
      )

      const response = NextResponse.json({
        stalls,
        filters: {
          cuisine_types: cuisineTypes,
          total_count: stalls.length
        }
      })

      // Add cache headers
      response.headers.set('Cache-Control', 'public, max-age=300') // 5 minutes
      response.headers.set('X-Cache-Status', stallsWithProducts === stallsCache.get(cacheKey) ? 'HIT' : 'MISS')

      return response

    } catch (error) {
      console.error("Customer stalls error:", error)
      
      // Record error metric
      PerformanceMonitor.recordMetric(
        'stalls_query_errors',
        1,
        'counter',
        { error: error instanceof Error ? error.message : 'unknown' }
      )

      // Check if it's a rate limit error
      if ((error as any).status === 429) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: "Failed to load stalls" },
        { status: 500 }
      )
    }
  })(request)
}