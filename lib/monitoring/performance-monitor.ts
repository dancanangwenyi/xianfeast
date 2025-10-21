/**
 * Performance monitoring and metrics collection
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
  type: 'counter' | 'gauge' | 'histogram' | 'timer'
}

interface APIMetric {
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  timestamp: number
  userId?: string
  userAgent?: string
  ip?: string
}

interface DatabaseMetric {
  operation: string
  table: string
  duration: number
  timestamp: number
  success: boolean
  error?: string
}

interface UserActionMetric {
  action: string
  userId: string
  sessionId?: string
  timestamp: number
  metadata?: Record<string, any>
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = []
  private static apiMetrics: APIMetric[] = []
  private static dbMetrics: DatabaseMetric[] = []
  private static userActions: UserActionMetric[] = []
  private static maxMetrics = 10000 // Prevent memory leaks

  /**
   * Record a performance metric
   */
  static recordMetric(
    name: string,
    value: number,
    type: 'counter' | 'gauge' | 'histogram' | 'timer' = 'gauge',
    tags?: Record<string, string>
  ) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      type,
      tags
    }

    this.metrics.push(metric)
    this.trimMetrics()

    // Log significant metrics
    if (type === 'timer' && value > 1000) {
      console.warn(`Slow operation: ${name} took ${value}ms`, tags)
    }
  }

  /**
   * Record API request metrics
   */
  static recordAPIMetric(data: Omit<APIMetric, 'timestamp'>) {
    const metric: APIMetric = {
      ...data,
      timestamp: Date.now()
    }

    this.apiMetrics.push(metric)
    this.trimAPIMetrics()

    // Log slow API calls
    if (data.responseTime > 2000) {
      console.warn(`Slow API call: ${data.method} ${data.endpoint} took ${data.responseTime}ms`)
    }

    // Log error responses
    if (data.statusCode >= 400) {
      console.error(`API error: ${data.method} ${data.endpoint} returned ${data.statusCode}`)
    }
  }

  /**
   * Record database operation metrics
   */
  static recordDatabaseMetric(data: Omit<DatabaseMetric, 'timestamp'>) {
    const metric: DatabaseMetric = {
      ...data,
      timestamp: Date.now()
    }

    this.dbMetrics.push(metric)
    this.trimDBMetrics()

    // Log slow database operations
    if (data.duration > 500) {
      console.warn(`Slow DB operation: ${data.operation} on ${data.table} took ${data.duration}ms`)
    }

    // Log database errors
    if (!data.success) {
      console.error(`DB operation failed: ${data.operation} on ${data.table}`, data.error)
    }
  }

  /**
   * Record user action for analytics
   */
  static recordUserAction(data: Omit<UserActionMetric, 'timestamp'>) {
    const action: UserActionMetric = {
      ...data,
      timestamp: Date.now()
    }

    this.userActions.push(action)
    this.trimUserActions()
  }

  /**
   * Get performance statistics
   */
  static getPerformanceStats(timeWindow: number = 300000) { // 5 minutes
    const now = Date.now()
    const cutoff = now - timeWindow

    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff)
    const recentAPIMetrics = this.apiMetrics.filter(m => m.timestamp > cutoff)
    const recentDBMetrics = this.dbMetrics.filter(m => m.timestamp > cutoff)

    return {
      general: this.calculateGeneralStats(recentMetrics),
      api: this.calculateAPIStats(recentAPIMetrics),
      database: this.calculateDBStats(recentDBMetrics),
      timeWindow: timeWindow,
      timestamp: now
    }
  }

  /**
   * Get user activity analytics
   */
  static getUserActivityStats(timeWindow: number = 3600000) { // 1 hour
    const now = Date.now()
    const cutoff = now - timeWindow

    const recentActions = this.userActions.filter(a => a.timestamp > cutoff)
    
    const actionCounts = recentActions.reduce((acc, action) => {
      acc[action.action] = (acc[action.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const uniqueUsers = new Set(recentActions.map(a => a.userId)).size

    return {
      totalActions: recentActions.length,
      uniqueUsers,
      actionBreakdown: actionCounts,
      timeWindow,
      timestamp: now
    }
  }

  /**
   * Get system health metrics
   */
  static getSystemHealth() {
    const now = Date.now()
    const fiveMinutesAgo = now - 300000

    const recentAPIMetrics = this.apiMetrics.filter(m => m.timestamp > fiveMinutesAgo)
    const recentDBMetrics = this.dbMetrics.filter(m => m.timestamp > fiveMinutesAgo)

    const apiErrorRate = recentAPIMetrics.length > 0 
      ? recentAPIMetrics.filter(m => m.statusCode >= 400).length / recentAPIMetrics.length 
      : 0

    const dbErrorRate = recentDBMetrics.length > 0
      ? recentDBMetrics.filter(m => !m.success).length / recentDBMetrics.length
      : 0

    const avgAPIResponseTime = recentAPIMetrics.length > 0
      ? recentAPIMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentAPIMetrics.length
      : 0

    const avgDBResponseTime = recentDBMetrics.length > 0
      ? recentDBMetrics.reduce((sum, m) => sum + m.duration, 0) / recentDBMetrics.length
      : 0

    return {
      status: this.determineHealthStatus(apiErrorRate, dbErrorRate, avgAPIResponseTime, avgDBResponseTime),
      apiErrorRate: Math.round(apiErrorRate * 100),
      dbErrorRate: Math.round(dbErrorRate * 100),
      avgAPIResponseTime: Math.round(avgAPIResponseTime),
      avgDBResponseTime: Math.round(avgDBResponseTime),
      totalAPIRequests: recentAPIMetrics.length,
      totalDBOperations: recentDBMetrics.length,
      timestamp: now
    }
  }

  /**
   * Clear all metrics (for testing or memory management)
   */
  static clearMetrics() {
    this.metrics = []
    this.apiMetrics = []
    this.dbMetrics = []
    this.userActions = []
  }

  /**
   * Export metrics for external monitoring systems
   */
  static exportMetrics(format: 'json' | 'prometheus' = 'json') {
    if (format === 'prometheus') {
      return this.toPrometheusFormat()
    }
    
    return {
      metrics: this.metrics,
      apiMetrics: this.apiMetrics,
      dbMetrics: this.dbMetrics,
      userActions: this.userActions,
      exportedAt: Date.now()
    }
  }

  private static calculateGeneralStats(metrics: PerformanceMetric[]) {
    if (metrics.length === 0) return null

    const timers = metrics.filter(m => m.type === 'timer')
    const counters = metrics.filter(m => m.type === 'counter')
    const gauges = metrics.filter(m => m.type === 'gauge')

    return {
      totalMetrics: metrics.length,
      timers: timers.length,
      counters: counters.length,
      gauges: gauges.length,
      avgTimerValue: timers.length > 0 ? timers.reduce((sum, m) => sum + m.value, 0) / timers.length : 0
    }
  }

  private static calculateAPIStats(metrics: APIMetric[]) {
    if (metrics.length === 0) return null

    const statusCodes = metrics.reduce((acc, m) => {
      const code = Math.floor(m.statusCode / 100) * 100
      acc[code] = (acc[code] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length
    const maxResponseTime = Math.max(...metrics.map(m => m.responseTime))
    const minResponseTime = Math.min(...metrics.map(m => m.responseTime))

    return {
      totalRequests: metrics.length,
      avgResponseTime: Math.round(avgResponseTime),
      maxResponseTime,
      minResponseTime,
      statusCodes,
      errorRate: Math.round(((statusCodes[400] || 0) + (statusCodes[500] || 0)) / metrics.length * 100)
    }
  }

  private static calculateDBStats(metrics: DatabaseMetric[]) {
    if (metrics.length === 0) return null

    const operations = metrics.reduce((acc, m) => {
      acc[m.operation] = (acc[m.operation] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const tables = metrics.reduce((acc, m) => {
      acc[m.table] = (acc[m.table] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length
    const maxDuration = Math.max(...metrics.map(m => m.duration))
    const errorCount = metrics.filter(m => !m.success).length

    return {
      totalOperations: metrics.length,
      avgDuration: Math.round(avgDuration),
      maxDuration,
      errorCount,
      errorRate: Math.round(errorCount / metrics.length * 100),
      operationBreakdown: operations,
      tableBreakdown: tables
    }
  }

  private static determineHealthStatus(
    apiErrorRate: number,
    dbErrorRate: number,
    avgAPITime: number,
    avgDBTime: number
  ): 'healthy' | 'warning' | 'critical' {
    if (apiErrorRate > 0.1 || dbErrorRate > 0.1 || avgAPITime > 5000 || avgDBTime > 1000) {
      return 'critical'
    }
    
    if (apiErrorRate > 0.05 || dbErrorRate > 0.05 || avgAPITime > 2000 || avgDBTime > 500) {
      return 'warning'
    }
    
    return 'healthy'
  }

  private static toPrometheusFormat(): string {
    const lines: string[] = []
    
    // API metrics
    lines.push('# HELP api_requests_total Total number of API requests')
    lines.push('# TYPE api_requests_total counter')
    
    const apiCounts = this.apiMetrics.reduce((acc, m) => {
      const key = `${m.method}_${m.endpoint}_${m.statusCode}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    Object.entries(apiCounts).forEach(([key, count]) => {
      const [method, endpoint, statusCode] = key.split('_')
      lines.push(`api_requests_total{method="${method}",endpoint="${endpoint}",status="${statusCode}"} ${count}`)
    })
    
    return lines.join('\n')
  }

  private static trimMetrics() {
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics / 2)
    }
  }

  private static trimAPIMetrics() {
    if (this.apiMetrics.length > this.maxMetrics) {
      this.apiMetrics = this.apiMetrics.slice(-this.maxMetrics / 2)
    }
  }

  private static trimDBMetrics() {
    if (this.dbMetrics.length > this.maxMetrics) {
      this.dbMetrics = this.dbMetrics.slice(-this.maxMetrics / 2)
    }
  }

  private static trimUserActions() {
    if (this.userActions.length > this.maxMetrics) {
      this.userActions = this.userActions.slice(-this.maxMetrics / 2)
    }
  }
}

/**
 * Middleware for automatic API monitoring
 */
export function withPerformanceMonitoring(handler: Function) {
  return async function monitoredHandler(request: any, ...args: any[]) {
    const startTime = Date.now()
    const method = request.method || 'UNKNOWN'
    const url = new URL(request.url || 'http://localhost')
    const endpoint = url.pathname
    
    try {
      const response = await handler(request, ...args)
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      // Extract status code from response
      let statusCode = 200
      if (response && typeof response.status === 'number') {
        statusCode = response.status
      }
      
      PerformanceMonitor.recordAPIMetric({
        endpoint,
        method,
        statusCode,
        responseTime,
        userId: (request as any).userId,
        userAgent: request.headers?.get('user-agent'),
        ip: request.headers?.get('x-forwarded-for') || request.headers?.get('x-real-ip')
      })
      
      return response
    } catch (error) {
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      PerformanceMonitor.recordAPIMetric({
        endpoint,
        method,
        statusCode: 500,
        responseTime,
        userId: (request as any).userId,
        userAgent: request.headers?.get('user-agent'),
        ip: request.headers?.get('x-forwarded-for') || request.headers?.get('x-real-ip')
      })
      
      throw error
    }
  }
}

/**
 * Database operation monitoring decorator
 */
export function withDatabaseMonitoring(operation: string, table: string) {
  return function decorator(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      
      try {
        const result = await method.apply(this, args)
        const endTime = Date.now()
        const duration = endTime - startTime
        
        PerformanceMonitor.recordDatabaseMetric({
          operation,
          table,
          duration,
          success: true
        })
        
        return result
      } catch (error) {
        const endTime = Date.now()
        const duration = endTime - startTime
        
        PerformanceMonitor.recordDatabaseMetric({
          operation,
          table,
          duration,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })
        
        throw error
      }
    }

    return descriptor
  }
}