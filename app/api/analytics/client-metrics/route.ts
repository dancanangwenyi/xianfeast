import { NextRequest, NextResponse } from "next/server"
import { PerformanceMonitor } from "@/lib/monitoring/performance-monitor"
import { withSecurity, RateLimiter } from "@/lib/security/rate-limiter"

/**
 * POST /api/analytics/client-metrics - Receive client-side performance metrics
 */
export async function POST(request: NextRequest) {
  try {
    // Apply security and rate limiting
    withSecurity({
      rateLimit: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10, // 10 metric submissions per minute
        keyGenerator: (req) => `metrics:${req.headers?.get('x-forwarded-for') || 'unknown'}`
      },
      validateRequest: true,
      sanitizeBody: true
    })(request)

    const body = await request.json()
    const { pageLoads, interactions, apiCalls, userAgent, timestamp } = body

    // Validate required fields
    if (!Array.isArray(pageLoads) && !Array.isArray(interactions) && !Array.isArray(apiCalls)) {
      return NextResponse.json({ 
        error: "At least one metric type is required" 
      }, { status: 400 })
    }

    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    // Process page load metrics
    if (Array.isArray(pageLoads)) {
      pageLoads.forEach((metric: any) => {
        PerformanceMonitor.recordMetric(
          'client.page_load_time',
          metric.loadTime,
          'timer',
          {
            url: metric.url,
            userAgent: userAgent || 'unknown',
            viewport: `${metric.viewport?.width}x${metric.viewport?.height}`,
            connection: metric.connection || 'unknown',
            ip: clientIP
          }
        )

        if (metric.domContentLoaded) {
          PerformanceMonitor.recordMetric(
            'client.dom_content_loaded',
            metric.domContentLoaded,
            'timer',
            { url: metric.url, ip: clientIP }
          )
        }

        if (metric.firstContentfulPaint) {
          PerformanceMonitor.recordMetric(
            'client.first_contentful_paint',
            metric.firstContentfulPaint,
            'timer',
            { url: metric.url, ip: clientIP }
          )
        }

        if (metric.largestContentfulPaint) {
          PerformanceMonitor.recordMetric(
            'client.largest_contentful_paint',
            metric.largestContentfulPaint,
            'timer',
            { url: metric.url, ip: clientIP }
          )
        }

        if (metric.cumulativeLayoutShift !== undefined) {
          PerformanceMonitor.recordMetric(
            'client.cumulative_layout_shift',
            metric.cumulativeLayoutShift,
            'gauge',
            { url: metric.url, ip: clientIP }
          )
        }

        if (metric.firstInputDelay) {
          PerformanceMonitor.recordMetric(
            'client.first_input_delay',
            metric.firstInputDelay,
            'timer',
            { url: metric.url, ip: clientIP }
          )
        }
      })
    }

    // Process user interaction metrics
    if (Array.isArray(interactions)) {
      const interactionCounts = interactions.reduce((acc: any, interaction: any) => {
        const key = `${interaction.type}_${interaction.page}`
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})

      Object.entries(interactionCounts).forEach(([key, count]) => {
        const [type, page] = key.split('_')
        PerformanceMonitor.recordMetric(
          'client.user_interactions',
          count as number,
          'counter',
          {
            interaction_type: type,
            page: page,
            ip: clientIP
          }
        )
      })

      // Record user action metrics for analytics
      interactions.forEach((interaction: any) => {
        PerformanceMonitor.recordUserAction({
          action: `client.${interaction.type}`,
          userId: 'anonymous', // Client metrics are anonymous
          metadata: {
            element: interaction.element,
            page: interaction.page,
            duration: interaction.duration,
            ...interaction.metadata
          }
        })
      })
    }

    // Process API call metrics
    if (Array.isArray(apiCalls)) {
      apiCalls.forEach((call: any) => {
        PerformanceMonitor.recordMetric(
          'client.api_call_duration',
          call.duration,
          'timer',
          {
            endpoint: call.endpoint,
            method: call.method,
            status: call.status.toString(),
            cached: call.cached ? 'true' : 'false',
            ip: clientIP
          }
        )

        // Record API errors
        if (call.status >= 400) {
          PerformanceMonitor.recordMetric(
            'client.api_errors',
            1,
            'counter',
            {
              endpoint: call.endpoint,
              method: call.method,
              status: call.status.toString(),
              ip: clientIP
            }
          )
        }

        // Record cache hits
        if (call.cached) {
          PerformanceMonitor.recordMetric(
            'client.cache_hits',
            1,
            'counter',
            {
              endpoint: call.endpoint,
              ip: clientIP
            }
          )
        }
      })
    }

    // Record the metrics submission itself
    PerformanceMonitor.recordMetric(
      'client.metrics_submitted',
      1,
      'counter',
      {
        page_loads: pageLoads?.length || 0,
        interactions: interactions?.length || 0,
        api_calls: apiCalls?.length || 0,
        ip: clientIP
      }
    )

    return NextResponse.json({ 
      success: true,
      processed: {
        pageLoads: pageLoads?.length || 0,
        interactions: interactions?.length || 0,
        apiCalls: apiCalls?.length || 0
      }
    })

  } catch (error) {
    console.error("Client metrics error:", error)
    
    // Check if it's a rate limit error
    if ((error as any).status === 429) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          retryAfter: (error as any).retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String((error as any).retryAfter || 60)
          }
        }
      )
    }

    return NextResponse.json(
      { error: "Failed to process client metrics" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/analytics/client-metrics - Get aggregated client metrics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting for admin endpoints
    const rateLimitResult = RateLimiter.checkRateLimit(request, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 requests per minute
      keyGenerator: (req) => `admin_metrics:${req.headers?.get('x-forwarded-for') || 'unknown'}`
    })

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const timeWindow = parseInt(searchParams.get("timeWindow") || "3600000") // 1 hour default
    const format = searchParams.get("format") || "json"

    // Get performance statistics
    const stats = PerformanceMonitor.getPerformanceStats(timeWindow)
    const userActivity = PerformanceMonitor.getUserActivityStats(timeWindow)
    const systemHealth = PerformanceMonitor.getSystemHealth()

    const response = {
      performance: stats,
      userActivity,
      systemHealth,
      timestamp: Date.now()
    }

    if (format === 'prometheus') {
      const prometheusData = PerformanceMonitor.exportMetrics('prometheus')
      return new Response(prometheusData, {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8'
        }
      })
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("Get client metrics error:", error)
    return NextResponse.json(
      { error: "Failed to retrieve client metrics" },
      { status: 500 }
    )
  }
}