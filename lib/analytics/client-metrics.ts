/**
 * Client-side performance metrics and user interaction tracking
 */

interface PageLoadMetric {
  url: string
  loadTime: number
  domContentLoaded: number
  firstContentfulPaint?: number
  largestContentfulPaint?: number
  cumulativeLayoutShift?: number
  firstInputDelay?: number
  timestamp: number
  userAgent: string
  viewport: { width: number; height: number }
  connection?: string
}

interface UserInteractionMetric {
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'form_submit' | 'cart_action' | 'order_action'
  element?: string
  page: string
  timestamp: number
  duration?: number
  metadata?: Record<string, any>
}

interface APICallMetric {
  endpoint: string
  method: string
  duration: number
  status: number
  timestamp: number
  cached?: boolean
}

export class ClientMetrics {
  private static isInitialized = false
  private static metrics: {
    pageLoads: PageLoadMetric[]
    interactions: UserInteractionMetric[]
    apiCalls: APICallMetric[]
  } = {
    pageLoads: [],
    interactions: [],
    apiCalls: []
  }

  /**
   * Initialize client-side metrics collection
   */
  static initialize() {
    if (this.isInitialized || typeof window === 'undefined') {
      return
    }

    this.isInitialized = true
    this.setupPageLoadMetrics()
    this.setupInteractionTracking()
    this.setupAPITracking()
    this.setupPeriodicReporting()
  }

  /**
   * Record page load metrics
   */
  static recordPageLoad(additionalData?: Record<string, any>) {
    if (typeof window === 'undefined') return

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')
    
    const metric: PageLoadMetric = {
      url: window.location.href,
      loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: (navigator as any).connection?.effectiveType,
      ...additionalData
    }

    // Get Web Vitals if available
    this.getWebVitals(metric)

    this.metrics.pageLoads.push(metric)
    this.trimMetrics()
  }

  /**
   * Record user interaction
   */
  static recordInteraction(
    type: UserInteractionMetric['type'],
    element?: string,
    metadata?: Record<string, any>,
    duration?: number
  ) {
    if (typeof window === 'undefined') return

    const metric: UserInteractionMetric = {
      type,
      element,
      page: window.location.pathname,
      timestamp: Date.now(),
      duration,
      metadata
    }

    this.metrics.interactions.push(metric)
    this.trimMetrics()
  }

  /**
   * Record API call metrics
   */
  static recordAPICall(
    endpoint: string,
    method: string,
    duration: number,
    status: number,
    cached: boolean = false
  ) {
    const metric: APICallMetric = {
      endpoint,
      method,
      duration,
      status,
      timestamp: Date.now(),
      cached
    }

    this.metrics.apiCalls.push(metric)
    this.trimMetrics()
  }

  /**
   * Get current metrics
   */
  static getMetrics() {
    return { ...this.metrics }
  }

  /**
   * Get performance summary
   */
  static getPerformanceSummary(timeWindow: number = 300000) { // 5 minutes
    const now = Date.now()
    const cutoff = now - timeWindow

    const recentPageLoads = this.metrics.pageLoads.filter(m => m.timestamp > cutoff)
    const recentInteractions = this.metrics.interactions.filter(m => m.timestamp > cutoff)
    const recentAPICalls = this.metrics.apiCalls.filter(m => m.timestamp > cutoff)

    return {
      pageLoads: {
        count: recentPageLoads.length,
        avgLoadTime: recentPageLoads.length > 0 
          ? recentPageLoads.reduce((sum, m) => sum + m.loadTime, 0) / recentPageLoads.length 
          : 0,
        avgDOMContentLoaded: recentPageLoads.length > 0
          ? recentPageLoads.reduce((sum, m) => sum + m.domContentLoaded, 0) / recentPageLoads.length
          : 0,
        avgFCP: this.calculateAverage(recentPageLoads, 'firstContentfulPaint'),
        avgLCP: this.calculateAverage(recentPageLoads, 'largestContentfulPaint')
      },
      interactions: {
        count: recentInteractions.length,
        byType: this.groupBy(recentInteractions, 'type'),
        byPage: this.groupBy(recentInteractions, 'page')
      },
      apiCalls: {
        count: recentAPICalls.length,
        avgDuration: recentAPICalls.length > 0
          ? recentAPICalls.reduce((sum, m) => sum + m.duration, 0) / recentAPICalls.length
          : 0,
        errorRate: recentAPICalls.length > 0
          ? recentAPICalls.filter(m => m.status >= 400).length / recentAPICalls.length
          : 0,
        cacheHitRate: recentAPICalls.length > 0
          ? recentAPICalls.filter(m => m.cached).length / recentAPICalls.length
          : 0
      },
      timeWindow,
      timestamp: now
    }
  }

  /**
   * Send metrics to server
   */
  static async sendMetrics() {
    if (typeof window === 'undefined' || this.metrics.pageLoads.length === 0) {
      return
    }

    try {
      const payload = {
        ...this.metrics,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      }

      await fetch('/api/analytics/client-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      // Clear sent metrics
      this.clearMetrics()
    } catch (error) {
      console.warn('Failed to send client metrics:', error)
    }
  }

  /**
   * Clear all metrics
   */
  static clearMetrics() {
    this.metrics = {
      pageLoads: [],
      interactions: [],
      apiCalls: []
    }
  }

  private static setupPageLoadMetrics() {
    if (typeof window === 'undefined') return

    // Record initial page load
    if (document.readyState === 'complete') {
      this.recordPageLoad()
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.recordPageLoad(), 100)
      })
    }

    // Track navigation changes (SPA)
    let currentPath = window.location.pathname
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname
        this.recordPageLoad({ navigationType: 'spa' })
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  private static setupInteractionTracking() {
    if (typeof window === 'undefined') return

    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      const element = this.getElementSelector(target)
      
      this.recordInteraction('click', element, {
        x: event.clientX,
        y: event.clientY,
        button: event.button
      })
    })

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const target = event.target as HTMLFormElement
      const element = this.getElementSelector(target)
      
      this.recordInteraction('form_submit', element, {
        action: target.action,
        method: target.method
      })
    })

    // Track scroll behavior
    let scrollTimeout: NodeJS.Timeout
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        this.recordInteraction('scroll', undefined, {
          scrollY: window.scrollY,
          scrollX: window.scrollX,
          documentHeight: document.documentElement.scrollHeight,
          viewportHeight: window.innerHeight
        })
      }, 250)
    })

    // Track input interactions
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement
      const element = this.getElementSelector(target)
      
      this.recordInteraction('input', element, {
        type: target.type,
        name: target.name,
        valueLength: target.value.length
      })
    })
  }

  private static setupAPITracking() {
    if (typeof window === 'undefined') return

    // Intercept fetch calls
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = Date.now()
      const url = typeof args[0] === 'string' ? args[0] : args[0].url
      const method = args[1]?.method || 'GET'
      
      try {
        const response = await originalFetch(...args)
        const endTime = Date.now()
        
        // Only track API calls to our own endpoints
        if (url.startsWith('/api/')) {
          this.recordAPICall(
            url,
            method,
            endTime - startTime,
            response.status,
            response.headers.get('x-cache') === 'HIT'
          )
        }
        
        return response
      } catch (error) {
        const endTime = Date.now()
        
        if (url.startsWith('/api/')) {
          this.recordAPICall(url, method, endTime - startTime, 0)
        }
        
        throw error
      }
    }
  }

  private static setupPeriodicReporting() {
    if (typeof window === 'undefined') return

    // Send metrics every 5 minutes
    setInterval(() => {
      this.sendMetrics()
    }, 300000)

    // Send metrics before page unload
    window.addEventListener('beforeunload', () => {
      this.sendMetrics()
    })

    // Send metrics when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.sendMetrics()
      }
    })
  }

  private static getWebVitals(metric: PageLoadMetric) {
    // Try to get Web Vitals using the web-vitals library if available
    if (typeof window !== 'undefined' && (window as any).webVitals) {
      const { getCLS, getFID, getLCP } = (window as any).webVitals
      
      getCLS((cls: any) => {
        metric.cumulativeLayoutShift = cls.value
      })
      
      getFID((fid: any) => {
        metric.firstInputDelay = fid.value
      })
      
      getLCP((lcp: any) => {
        metric.largestContentfulPaint = lcp.value
      })
    }
  }

  private static getElementSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`
    }
    
    if (element.className) {
      return `.${element.className.split(' ')[0]}`
    }
    
    return element.tagName.toLowerCase()
  }

  private static calculateAverage(items: any[], field: string): number {
    const values = items.map(item => item[field]).filter(val => val !== undefined)
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
  }

  private static groupBy<T>(items: T[], field: keyof T): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = String(item[field])
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  private static trimMetrics() {
    const maxItems = 1000
    
    if (this.metrics.pageLoads.length > maxItems) {
      this.metrics.pageLoads = this.metrics.pageLoads.slice(-maxItems / 2)
    }
    
    if (this.metrics.interactions.length > maxItems) {
      this.metrics.interactions = this.metrics.interactions.slice(-maxItems / 2)
    }
    
    if (this.metrics.apiCalls.length > maxItems) {
      this.metrics.apiCalls = this.metrics.apiCalls.slice(-maxItems / 2)
    }
  }
}

/**
 * React hook for tracking component performance
 */
export function usePerformanceTracking(componentName: string) {
  if (typeof window === 'undefined') return

  const startTime = Date.now()
  
  return {
    recordRender: () => {
      const renderTime = Date.now() - startTime
      ClientMetrics.recordInteraction('navigation', componentName, {
        renderTime,
        component: componentName
      })
    },
    
    recordInteraction: (type: string, metadata?: Record<string, any>) => {
      ClientMetrics.recordInteraction('click', `${componentName}:${type}`, {
        component: componentName,
        ...metadata
      })
    }
  }
}

/**
 * Initialize client metrics when module loads
 */
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ClientMetrics.initialize()
    })
  } else {
    ClientMetrics.initialize()
  }
}