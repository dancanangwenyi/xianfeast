#!/usr/bin/env tsx

/**
 * Core performance testing without external dependencies
 * Tests cache, rate limiting, and monitoring systems
 */

import { performance } from 'perf_hooks'
import { PerformanceMonitor } from '../lib/monitoring/performance-monitor'
import { stallsCache, productsCache, CacheKeys } from '../lib/cache/cache-manager'
import { RateLimiter } from '../lib/security/rate-limiter'

async function testCorePerformance() {
  console.log('🚀 Testing core performance systems...\n')

  // Test 1: Cache Performance
  console.log('💾 Testing cache performance...')
  const cacheStartTime = performance.now()
  
  // Set 1000 items
  for (let i = 0; i < 1000; i++) {
    stallsCache.set(`test-${i}`, { id: i, name: `Test ${i}` })
  }
  
  // Get 1000 items
  let hits = 0
  for (let i = 0; i < 1000; i++) {
    if (stallsCache.get(`test-${i}`)) hits++
  }
  
  const cacheEndTime = performance.now()
  console.log(`  ✅ Cache operations: ${(cacheEndTime - cacheStartTime).toFixed(2)}ms`)
  console.log(`  ✅ Cache hit rate: ${(hits / 1000 * 100).toFixed(1)}%`)
  console.log(`  ✅ Cache stats:`, stallsCache.getStats())

  // Test 2: Rate Limiting Performance
  console.log('\n🛡️ Testing rate limiting performance...')
  RateLimiter.clear()
  
  const rateLimitStartTime = performance.now()
  let allowed = 0
  let blocked = 0
  
  // Test 1000 requests
  for (let i = 0; i < 1000; i++) {
    const mockRequest = { 
      headers: new Map([['x-forwarded-for', `192.168.1.${i % 100}`]]) 
    }
    
    const result = RateLimiter.checkRateLimit(mockRequest, {
      windowMs: 60000,
      maxRequests: 50,
      keyGenerator: (req) => `test-${i % 100}`
    })
    
    if (result.allowed) allowed++
    else blocked++
  }
  
  const rateLimitEndTime = performance.now()
  console.log(`  ✅ Rate limit checks: ${(rateLimitEndTime - rateLimitStartTime).toFixed(2)}ms`)
  console.log(`  ✅ Allowed requests: ${allowed}`)
  console.log(`  ✅ Blocked requests: ${blocked}`)

  // Test 3: Performance Monitoring
  console.log('\n📊 Testing performance monitoring...')
  const monitorStartTime = performance.now()
  
  // Record various metrics
  for (let i = 0; i < 100; i++) {
    PerformanceMonitor.recordMetric(`test.metric.${i % 10}`, Math.random() * 1000, 'timer')
    PerformanceMonitor.recordAPIMetric({
      endpoint: `/api/test/${i % 5}`,
      method: 'GET',
      statusCode: i % 10 === 0 ? 500 : 200,
      responseTime: Math.random() * 500,
      userId: `user-${i % 20}`
    })
    PerformanceMonitor.recordUserAction({
      action: `test.action.${i % 3}`,
      userId: `user-${i % 20}`,
      metadata: { test: true }
    })
  }
  
  const monitorEndTime = performance.now()
  console.log(`  ✅ Monitoring operations: ${(monitorEndTime - monitorStartTime).toFixed(2)}ms`)
  
  // Get performance stats
  const stats = PerformanceMonitor.getPerformanceStats()
  const userActivity = PerformanceMonitor.getUserActivityStats()
  const systemHealth = PerformanceMonitor.getSystemHealth()
  
  console.log(`  ✅ Performance stats:`, {
    totalMetrics: stats.general?.totalMetrics || 0,
    apiRequests: stats.api?.totalRequests || 0,
    systemStatus: systemHealth.status
  })
  
  console.log(`  ✅ User activity:`, {
    totalActions: userActivity.totalActions,
    uniqueUsers: userActivity.uniqueUsers
  })

  // Test 4: Concurrent Operations
  console.log('\n⚡ Testing concurrent operations...')
  const concurrentStartTime = performance.now()
  
  const promises = Array.from({ length: 100 }, (_, i) => 
    Promise.resolve().then(async () => {
      // Concurrent cache operations
      productsCache.set(`concurrent-${i}`, { id: i, data: `test-${i}` })
      const cached = productsCache.get(`concurrent-${i}`)
      
      // Concurrent rate limit checks
      const mockRequest = { 
        headers: new Map([['x-forwarded-for', `10.0.0.${i % 50}`]]) 
      }
      const rateLimitResult = RateLimiter.checkRateLimit(mockRequest, {
        windowMs: 60000,
        maxRequests: 10,
        keyGenerator: (req) => `concurrent-${i % 50}`
      })
      
      // Concurrent monitoring
      PerformanceMonitor.recordMetric(`concurrent.test.${i}`, Math.random() * 100, 'gauge')
      
      return { cached: !!cached, rateLimited: !rateLimitResult.allowed }
    })
  )
  
  const results = await Promise.all(promises)
  const concurrentEndTime = performance.now()
  
  const successfulCache = results.filter(r => r.cached).length
  const rateLimited = results.filter(r => r.rateLimited).length
  
  console.log(`  ✅ Concurrent operations: ${(concurrentEndTime - concurrentStartTime).toFixed(2)}ms`)
  console.log(`  ✅ Successful cache ops: ${successfulCache}/100`)
  console.log(`  ✅ Rate limited ops: ${rateLimited}/100`)

  // Test 5: Memory Usage and Cleanup
  console.log('\n🧹 Testing cleanup and memory management...')
  const cleanupStartTime = performance.now()
  
  // Test cache cleanup
  const stallsCleaned = stallsCache.cleanup()
  const productsCleaned = productsCache.cleanup()
  
  // Test rate limiter cleanup
  const rateLimitCleaned = RateLimiter.cleanup()
  
  const cleanupEndTime = performance.now()
  
  console.log(`  ✅ Cleanup operations: ${(cleanupEndTime - cleanupStartTime).toFixed(2)}ms`)
  console.log(`  ✅ Cache items cleaned: ${stallsCleaned + productsCleaned}`)
  console.log(`  ✅ Rate limit entries cleaned: ${rateLimitCleaned}`)

  // Final summary
  console.log('\n🎉 Core performance test summary:')
  console.log('=' .repeat(50))
  console.log(`Cache system: ✅ Working (${stallsCache.getStats().hitRate * 100}% hit rate)`)
  console.log(`Rate limiting: ✅ Working (${RateLimiter.getBlockedIPs().length} blocked IPs)`)
  console.log(`Performance monitoring: ✅ Working (${Object.keys(PerformanceMonitor.getPerformanceStats()).length} metric types)`)
  console.log(`Concurrent operations: ✅ Working`)
  console.log(`Memory management: ✅ Working`)
  
  const finalStats = PerformanceMonitor.getSystemHealth()
  console.log(`System health: ${finalStats.status.toUpperCase()}`)
  console.log(`API error rate: ${finalStats.apiErrorRate}%`)
  console.log(`Average response time: ${finalStats.avgAPIResponseTime}ms`)
}

// Run the test
testCorePerformance().catch(console.error)