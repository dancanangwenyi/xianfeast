'use client'

import { useEffect } from 'react'
import { ClientMetrics, usePerformanceTracking } from '@/lib/analytics/client-metrics'

interface PerformanceTrackerProps {
  children: React.ReactNode
  componentName?: string
  trackInteractions?: boolean
}

/**
 * Performance tracking wrapper component
 * Automatically tracks page loads, interactions, and component performance
 */
export function PerformanceTracker({ 
  children, 
  componentName = 'unknown',
  trackInteractions = true 
}: PerformanceTrackerProps) {
  const performanceHook = usePerformanceTracking(componentName)

  useEffect(() => {
    // Initialize client metrics if not already done
    ClientMetrics.initialize()

    // Record component mount
    performanceHook?.recordRender()

    // Track page visibility changes for performance metrics
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is being hidden, send metrics
        ClientMetrics.sendMetrics()
      } else {
        // Page is visible again, record page load
        ClientMetrics.recordPageLoad({ 
          navigationType: 'visibility_change',
          component: componentName 
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [componentName, performanceHook])

  // Track interactions if enabled
  useEffect(() => {
    if (!trackInteractions) return

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const elementType = target.tagName.toLowerCase()
      const elementId = target.id
      const elementClass = target.className

      ClientMetrics.recordInteraction('click', undefined, {
        component: componentName,
        elementType,
        elementId: elementId || undefined,
        elementClass: elementClass || undefined,
        x: event.clientX,
        y: event.clientY
      })
    }

    const handleFormSubmit = (event: SubmitEvent) => {
      const target = event.target as HTMLFormElement
      
      ClientMetrics.recordInteraction('form_submit', undefined, {
        component: componentName,
        formAction: target.action,
        formMethod: target.method,
        formId: target.id || undefined
      })
    }

    // Add event listeners to the document
    document.addEventListener('click', handleClick)
    document.addEventListener('submit', handleFormSubmit)

    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('submit', handleFormSubmit)
    }
  }, [componentName, trackInteractions])

  return <>{children}</>
}

/**
 * Hook for manual performance tracking in components
 */
export function useManualPerformanceTracking(componentName: string) {
  return {
    recordAction: (action: string, metadata?: Record<string, any>) => {
      ClientMetrics.recordInteraction('click', `${componentName}:${action}`, {
        component: componentName,
        ...metadata
      })
    },
    
    recordNavigation: (destination: string, metadata?: Record<string, any>) => {
      ClientMetrics.recordInteraction('navigation', undefined, {
        component: componentName,
        destination,
        ...metadata
      })
    },
    
    recordCartAction: (action: 'add' | 'remove' | 'update' | 'clear', metadata?: Record<string, any>) => {
      ClientMetrics.recordInteraction('cart_action', undefined, {
        component: componentName,
        cartAction: action,
        ...metadata
      })
    },
    
    recordOrderAction: (action: 'create' | 'update' | 'cancel' | 'view', metadata?: Record<string, any>) => {
      ClientMetrics.recordInteraction('order_action', undefined, {
        component: componentName,
        orderAction: action,
        ...metadata
      })
    }
  }
}

/**
 * Performance metrics display component (for debugging)
 */
export function PerformanceDebugger() {
  useEffect(() => {
    const interval = setInterval(() => {
      const metrics = ClientMetrics.getMetrics()
      const summary = ClientMetrics.getPerformanceSummary()
      
      console.group('Performance Metrics')
      console.log('Raw Metrics:', metrics)
      console.log('Summary:', summary)
      console.groupEnd()
    }, 10000) // Log every 10 seconds

    return () => clearInterval(interval)
  }, [])

  return null // This component doesn't render anything
}

/**
 * API call performance tracker
 */
export function trackAPICall(
  endpoint: string,
  method: string,
  startTime: number,
  endTime: number,
  status: number,
  cached: boolean = false
) {
  const duration = endTime - startTime
  ClientMetrics.recordAPICall(endpoint, method, duration, status, cached)
}

/**
 * Enhanced fetch wrapper with automatic performance tracking
 */
export async function trackedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const startTime = performance.now()
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const method = init?.method || 'GET'
  
  try {
    const response = await fetch(input, init)
    const endTime = performance.now()
    
    // Only track API calls to our own endpoints
    if (url.startsWith('/api/')) {
      trackAPICall(
        url,
        method,
        startTime,
        endTime,
        response.status,
        response.headers.get('x-cache-status') === 'HIT'
      )
    }
    
    return response
  } catch (error) {
    const endTime = performance.now()
    
    if (url.startsWith('/api/')) {
      trackAPICall(url, method, startTime, endTime, 0)
    }
    
    throw error
  }
}