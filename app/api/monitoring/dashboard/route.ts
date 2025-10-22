import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { PerformanceMonitor } from '@/lib/monitoring/performance-monitor'
import { dynamoClient } from '@/lib/dynamodb/client'

// Dashboard data aggregation for monitoring
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dashboardType = searchParams.get('type') || 'overview'
    const timeRange = searchParams.get('timeRange') || '24h'

    let dashboardData

    switch (dashboardType) {
      case 'customer-metrics':
        dashboardData = await getCustomerMetrics(timeRange)
        break
      case 'order-processing':
        dashboardData = await getOrderProcessingMetrics(timeRange)
        break
      case 'system-health':
        dashboardData = await getSystemHealthMetrics(timeRange)
        break
      default:
        dashboardData = await getOverviewMetrics(timeRange)
    }

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

async function getCustomerMetrics(timeRange: string) {
  const dynamodb = getDynamoDBClient()
  const now = new Date()
  const startTime = getStartTime(now, timeRange)

  try {
    // Customer signup metrics
    const signupMetrics = await PerformanceMonitor.getMetric('customer_signups', startTime, now)
    
    // Active customers (customers who placed orders in timeRange)
    const activeCustomers = await PerformanceMonitor.getMetric('active_customers', startTime, now)
    
    // Customer retention rate
    const retentionRate = await calculateRetentionRate(startTime, now)
    
    // Popular stalls
    const popularStalls = await getPopularStalls(startTime, now)

    return {
      signups: {
        total: signupMetrics.total || 0,
        trend: signupMetrics.trend || [],
        growth: signupMetrics.growth || 0
      },
      activeCustomers: {
        count: activeCustomers.count || 0,
        percentage: activeCustomers.percentage || 0
      },
      retention: {
        rate: retentionRate,
        target: 85 // Target retention rate
      },
      popularStalls: popularStalls || []
    }
  } catch (error) {
    console.error('Error fetching customer metrics:', error)
    return {
      signups: { total: 0, trend: [], growth: 0 },
      activeCustomers: { count: 0, percentage: 0 },
      retention: { rate: 0, target: 85 },
      popularStalls: []
    }
  }
}

async function getOrderProcessingMetrics(timeRange: string) {
  const now = new Date()
  const startTime = getStartTime(now, timeRange)

  try {
    // Order volume over time
    const orderVolume = await PerformanceMonitor.getMetric('order_volume', startTime, now)
    
    // Order status distribution
    const statusDistribution = await getOrderStatusDistribution(startTime, now)
    
    // Average processing time
    const avgProcessingTime = await calculateAverageProcessingTime(startTime, now)
    
    // Order completion rate
    const completionRate = await calculateOrderCompletionRate(startTime, now)

    return {
      volume: {
        total: orderVolume.total || 0,
        trend: orderVolume.trend || [],
        peak: orderVolume.peak || 0
      },
      statusDistribution: statusDistribution || {},
      processingTime: {
        average: avgProcessingTime,
        target: 30 // Target: 30 minutes
      },
      completionRate: {
        rate: completionRate,
        target: 95 // Target: 95%
      }
    }
  } catch (error) {
    console.error('Error fetching order processing metrics:', error)
    return {
      volume: { total: 0, trend: [], peak: 0 },
      statusDistribution: {},
      processingTime: { average: 0, target: 30 },
      completionRate: { rate: 0, target: 95 }
    }
  }
}

async function getSystemHealthMetrics(timeRange: string) {
  const now = new Date()
  const startTime = getStartTime(now, timeRange)

  try {
    // API response times
    const responseTimeMetrics = await PerformanceMonitor.getResponseTimeMetrics(startTime, now)
    
    // Error rate
    const errorRate = await PerformanceMonitor.getErrorRate(startTime, now)
    
    // System uptime
    const uptime = await PerformanceMonitor.getUptime(startTime, now)
    
    // Database performance
    const dbMetrics = await PerformanceMonitor.getDatabaseMetrics(startTime, now)

    return {
      responseTime: {
        average: responseTimeMetrics.average || 0,
        p95: responseTimeMetrics.p95 || 0,
        trend: responseTimeMetrics.trend || []
      },
      errorRate: {
        rate: errorRate || 0,
        target: 1 // Target: <1% error rate
      },
      uptime: {
        percentage: uptime || 0,
        target: 99.9 // Target: 99.9% uptime
      },
      database: {
        queryTime: dbMetrics.queryTime || 0,
        connections: dbMetrics.connections || 0,
        errors: dbMetrics.errors || 0
      }
    }
  } catch (error) {
    console.error('Error fetching system health metrics:', error)
    return {
      responseTime: { average: 0, p95: 0, trend: [] },
      errorRate: { rate: 0, target: 1 },
      uptime: { percentage: 0, target: 99.9 },
      database: { queryTime: 0, connections: 0, errors: 0 }
    }
  }
}

async function getOverviewMetrics(timeRange: string) {
  const customerMetrics = await getCustomerMetrics(timeRange)
  const orderMetrics = await getOrderProcessingMetrics(timeRange)
  const systemMetrics = await getSystemHealthMetrics(timeRange)

  return {
    summary: {
      totalCustomers: customerMetrics.signups.total,
      totalOrders: orderMetrics.volume.total,
      systemUptime: systemMetrics.uptime.percentage,
      avgResponseTime: systemMetrics.responseTime.average
    },
    alerts: await getActiveAlerts(),
    trends: {
      customerGrowth: customerMetrics.signups.growth,
      orderGrowth: orderMetrics.volume.trend.length > 1 ? 
        calculateGrowthRate(orderMetrics.volume.trend) : 0
    }
  }
}

// Helper functions
function getStartTime(now: Date, timeRange: string): Date {
  const start = new Date(now)
  
  switch (timeRange) {
    case '1h':
      start.setHours(start.getHours() - 1)
      break
    case '24h':
      start.setDate(start.getDate() - 1)
      break
    case '7d':
      start.setDate(start.getDate() - 7)
      break
    case '30d':
      start.setDate(start.getDate() - 30)
      break
    default:
      start.setDate(start.getDate() - 1)
  }
  
  return start
}

async function calculateRetentionRate(startTime: Date, endTime: Date): Promise<number> {
  // Implementation would calculate customer retention based on repeat orders
  // This is a simplified version
  try {
    const totalCustomers = await PerformanceMonitor.getMetric('total_customers', startTime, endTime)
    const returningCustomers = await PerformanceMonitor.getMetric('returning_customers', startTime, endTime)
    
    if (totalCustomers.count === 0) return 0
    return Math.round((returningCustomers.count / totalCustomers.count) * 100)
  } catch (error) {
    console.error('Error calculating retention rate:', error)
    return 0
  }
}

async function getPopularStalls(startTime: Date, endTime: Date) {
  try {
    return await PerformanceMonitor.getMetric('popular_stalls', startTime, endTime)
  } catch (error) {
    console.error('Error fetching popular stalls:', error)
    return []
  }
}

async function getOrderStatusDistribution(startTime: Date, endTime: Date) {
  try {
    return await PerformanceMonitor.getMetric('order_status_distribution', startTime, endTime)
  } catch (error) {
    console.error('Error fetching order status distribution:', error)
    return {}
  }
}

async function calculateAverageProcessingTime(startTime: Date, endTime: Date): Promise<number> {
  try {
    const processingTimes = await PerformanceMonitor.getMetric('processing_times', startTime, endTime)
    return processingTimes.average || 0
  } catch (error) {
    console.error('Error calculating processing time:', error)
    return 0
  }
}

async function calculateOrderCompletionRate(startTime: Date, endTime: Date): Promise<number> {
  try {
    const completionData = await PerformanceMonitor.getMetric('completion_rate', startTime, endTime)
    return completionData.rate || 0
  } catch (error) {
    console.error('Error calculating completion rate:', error)
    return 0
  }
}

async function getActiveAlerts() {
  try {
    return await PerformanceMonitor.getActiveAlerts()
  } catch (error) {
    console.error('Error fetching active alerts:', error)
    return []
  }
}

function calculateGrowthRate(trend: number[]): number {
  if (trend.length < 2) return 0
  
  const current = trend[trend.length - 1]
  const previous = trend[trend.length - 2]
  
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 100)
}