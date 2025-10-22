import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session-server"
import { PerformanceMonitor } from "@/lib/monitoring/performance-monitor"
import { QueryPerformanceMonitor } from "@/lib/dynamodb/performance"
import { stallsCache, productsCache, ordersCache, businessCache, userCache } from "@/lib/cache/cache-manager"
import { RateLimiter, SecurityValidator } from "@/lib/security/rate-limiter"

/**
 * GET /api/admin/performance - Get system performance metrics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting for admin endpoints
    const rateLimitResult = RateLimiter.checkRateLimit(request, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 requests per minute for admin
      keyGenerator: (req) => `admin_perf:${req.headers?.get('x-forwarded-for') || 'unknown'}`
    })

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60)
          }
        }
      )
    }

    const session = await verifySession(request)
    if (!session?.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user has admin role
    if (!session.roles?.includes("super_admin") && !session.roles?.includes("admin")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const timeWindow = parseInt(searchParams.get("timeWindow") || "3600000") // 1 hour default
    const includeDetails = searchParams.get("details") === "true"

    // Get performance statistics
    const performanceStats = PerformanceMonitor.getPerformanceStats(timeWindow)
    const userActivityStats = PerformanceMonitor.getUserActivityStats(timeWindow)
    const systemHealth = PerformanceMonitor.getSystemHealth()

    // Get database query performance
    const queryMetrics = QueryPerformanceMonitor.getMetrics()

    // Get cache statistics
    const cacheStats = {
      stalls: stallsCache.getStats(),
      products: productsCache.getStats(),
      orders: ordersCache.getStats(),
      businesses: businessCache.getStats(),
      users: userCache.getStats()
    }

    // Get rate limiting statistics
    const rateLimitStats = {
      blockedIPs: RateLimiter.getBlockedIPs().length,
      suspiciousIPs: RateLimiter.getSuspiciousIPs().length
    }

    const response = {
      timestamp: Date.now(),
      timeWindow,
      systemHealth,
      performance: performanceStats,
      userActivity: userActivityStats,
      database: {
        queryMetrics,
        connectionPool: {
          // Add connection pool stats if available
          active: 0,
          idle: 0,
          total: 0
        }
      },
      cache: {
        stats: cacheStats,
        totalHitRate: calculateOverallCacheHitRate(cacheStats),
        totalSize: Object.values(cacheStats).reduce((sum, stat) => sum + stat.size, 0)
      },
      security: {
        rateLimiting: rateLimitStats,
        requestValidation: {
          // Add validation stats if needed
          totalValidated: 0,
          failed: 0
        }
      }
    }

    // Add detailed metrics if requested
    if (includeDetails) {
      (response as any).details = {
        rawMetrics: PerformanceMonitor.exportMetrics('json'),
        cacheKeys: {
          stalls: stallsCache.keys().length,
          products: productsCache.keys().length,
          orders: ordersCache.keys().length,
          businesses: businessCache.keys().length,
          users: userCache.keys().length
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("Performance metrics error:", error)
    return NextResponse.json(
      { error: "Failed to retrieve performance metrics" },
      { status: 500 }
    )
  }

}

function calculateOverallCacheHitRate(cacheStats: any): number {
  let totalHits = 0
  let totalRequests = 0

  Object.values(cacheStats).forEach((stat: any) => {
    totalHits += stat.hits
    totalRequests += stat.hits + stat.misses
  })

  return totalRequests > 0 ? totalHits / totalRequests : 0
}

/**
 * POST /api/admin/performance - Manage performance settings (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request)
    if (!session?.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user has admin role
    if (!session.roles?.includes("super_admin")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'clear_cache':
        const cacheType = params.type || 'all'
        if (cacheType === 'all' || cacheType === 'stalls') stallsCache.clear()
        if (cacheType === 'all' || cacheType === 'products') productsCache.clear()
        if (cacheType === 'all' || cacheType === 'orders') ordersCache.clear()
        if (cacheType === 'all' || cacheType === 'businesses') businessCache.clear()
        if (cacheType === 'all' || cacheType === 'users') userCache.clear()
        
        return NextResponse.json({ 
          success: true, 
          message: `Cache cleared: ${cacheType}` 
        })

      case 'clear_metrics':
        PerformanceMonitor.clearMetrics()
        QueryPerformanceMonitor.resetMetrics()
        
        return NextResponse.json({ 
          success: true, 
          message: "Performance metrics cleared" 
        })

      case 'unblock_ip':
        const ip = params.ip
        if (!ip) {
          return NextResponse.json({ error: "IP address required" }, { status: 400 })
        }
        
        RateLimiter.unblockIP(ip)
        
        return NextResponse.json({ 
          success: true, 
          message: `IP ${ip} unblocked` 
        })

      case 'block_ip':
        const ipToBlock = params.ip
        const duration = params.duration || 3600000 // 1 hour default
        
        if (!ipToBlock) {
          return NextResponse.json({ error: "IP address required" }, { status: 400 })
        }
        
        RateLimiter.blockIP(ipToBlock, duration)
        
        return NextResponse.json({ 
          success: true, 
          message: `IP ${ipToBlock} blocked for ${duration}ms` 
        })

      case 'cleanup_rate_limits':
        const cleaned = RateLimiter.cleanup()
        
        return NextResponse.json({ 
          success: true, 
          message: `Cleaned ${cleaned} expired rate limit entries` 
        })

      default:
        return NextResponse.json({ 
          error: "Invalid action" 
        }, { status: 400 })
    }

  } catch (error) {
    console.error("Performance management error:", error)
    return NextResponse.json(
      { error: "Failed to manage performance settings" },
      { status: 500 }
    )
  }
}