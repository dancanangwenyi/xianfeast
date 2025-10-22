#!/usr/bin/env tsx

/**
 * Performance testing script for customer ordering system
 * Tests various scenarios and measures response times
 */

import { performance } from 'perf_hooks'
import { PerformanceMonitor } from '../lib/monitoring/performance-monitor'
import { QueryPerformanceMonitor } from '../lib/dynamodb/performance'
import { stallsCache, productsCache, CacheKeys } from '../lib/cache/cache-manager'
import { RateLimiter } from '../lib/security/rate-limiter'

interface TestResult {
  name: string
  duration: number
  success: boolean
  error?: string
  metadata?: Record<string, any>
}

class PerformanceTester {
  private results: TestResult[] = []

  async runAllTests() {
    console.log('🚀 Starting performance tests...\n')

    // Test database operations
    await this.testDatabaseOperations()
    
    // Test cache operations
    await this.testCacheOperations()
    
    // Test rate limiting
    await this.testRateLimiting()
    
    // Test concurrent operations
    await this.testConcurrentOperations()
    
    // Generate report
    this.generateReport()
  }

  private async testDatabaseOperations() {
    console.log('📊 Testing database operations...')

    // Test stall queries
    await this.runTest('Get All Stalls', async () => {
      const { getAllStalls } = await import('../lib/dynamodb/stalls')
      return await QueryPerformanceMonitor.measureQuery('getAllStalls', () => getAllStalls())
    })

    // Test product queries
    await this.runTest('Get All Products', async () => {
      const { getAllProducts } = await import('../lib/dynamodb/products')
      return await QueryPerformanceMonitor.measureQuery('getAllProducts', () => getAllProducts())
    })

    // Test optimized queries
    await this.runTest('Optimized Customer Orders Query', async () => {
      const { OptimizedQueries } = await import('../lib/dynamodb/performance')
      return await OptimizedQueries.getCustomerOrdersOptimized('test-customer-id', { limit: 10 })
    })

    // Test batch operations
    await this.runTest('Batch Get Products', async () => {
      const { OptimizedQueries } = await import('../lib/dynamodb/performance')
      return await OptimizedQueries.batchGetProducts(['product-1', 'product-2', 'product-3'])
    })

    console.log('✅ Database operations tests completed\n')
  }

  private async testCacheOperations() {
    console.log('💾 Testing cache operations...')

    // Test cache set/get performance
    await this.runTest('Cache Set Operation', async () => {
      const testData = { id: 'test', name: 'Test Stall', products: [] }
      stallsCache.set(CacheKeys.stall('test'), testData)
      return testData
    })

    await this.runTest('Cache Get Operation', async () => {
      return stallsCache.get(CacheKeys.stall('test'))
    })

    // Test cache with large dataset
    await this.runTest('Cache Large Dataset', async () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        data: 'x'.repeat(1000) // 1KB per item
      }))
      
      productsCache.set('large-dataset', largeData)
      return productsCache.get('large-dataset')
    })

    // Test cache cleanup
    await this.runTest('Cache Cleanup', async () => {
      const cleaned = stallsCache.cleanup()
      return { cleaned }
    })

    console.log('✅ Cache operations tests completed\n')
  }

  private async testRateLimiting() {
    console.log('🛡️ Testing rate limiting...')

    // Clear rate limiter for clean test
    RateLimiter.clear()

    // Test normal requests
    await this.runTest('Rate Limit - Normal Requests', async () => {
      const mockRequest = { headers: new Map([['x-forwarded-for', '192.168.1.100']]) }
      
      const results = []
      for (let i = 0; i < 5; i++) {
        const result = RateLimiter.checkRateLimit(mockRequest, {
          windowMs: 60000,
          maxRequests: 10,
          keyGenerator: () => 'test-key'
        })
        results.push(result.allowed)
      }
      
      return { allAllowed: results.every(r => r) }
    })

    // Test rate limit exceeded
    await this.runTest('Rate Limit - Exceeded', async () => {
      const mockRequest = { headers: new Map([['x-forwarded-for', '192.168.1.101']]) }
      
      // Make requests up to limit
      for (let i = 0; i < 10; i++) {
        RateLimiter.checkRateLimit(mockRequest, {
          windowMs: 60000,
          maxRequests: 10,
          keyGenerator: () => 'test-key-2'
        })
      }
      
      // This should be blocked
      const result = RateLimiter.checkRateLimit(mockRequest, {
        windowMs: 60000,
        maxRequests: 10,
        keyGenerator: () => 'test-key-2'
      })
      
      return { blocked: !result.allowed }
    })

    console.log('✅ Rate limiting tests completed\n')
  }

  private async testConcurrentOperations() {
    console.log('⚡ Testing concurrent operations...')

    // Test concurrent cache operations
    await this.runTest('Concurrent Cache Operations', async () => {
      const promises = Array.from({ length: 100 }, (_, i) => 
        Promise.resolve().then(() => {
          stallsCache.set(`concurrent-${i}`, { id: i, data: `test-${i}` })
          return stallsCache.get(`concurrent-${i}`)
        })
      )
      
      const results = await Promise.all(promises)
      return { completed: results.length, allSuccessful: results.every(r => r !== null) }
    })

    // Test concurrent rate limit checks
    await this.runTest('Concurrent Rate Limit Checks', async () => {
      const promises = Array.from({ length: 50 }, (_, i) => 
        Promise.resolve().then(() => {
          const mockRequest = { headers: new Map([['x-forwarded-for', `192.168.1.${i}`]]) }
          return RateLimiter.checkRateLimit(mockRequest, {
            windowMs: 60000,
            maxRequests: 100,
            keyGenerator: (req) => `concurrent-${i}`
          })
        })
      )
      
      const results = await Promise.all(promises)
      return { 
        completed: results.length, 
        allAllowed: results.every(r => r.allowed),
        avgRemaining: results.reduce((sum, r) => sum + r.remaining, 0) / results.length
      }
    })

    console.log('✅ Concurrent operations tests completed\n')
  }

  private async runTest(name: string, testFn: () => Promise<any>): Promise<void> {
    const startTime = performance.now()
    
    try {
      const result = await testFn()
      const endTime = performance.now()
      const duration = endTime - startTime
      
      this.results.push({
        name,
        duration,
        success: true,
        metadata: typeof result === 'object' ? result : { result }
      })
      
      // Record in performance monitor
      PerformanceMonitor.recordMetric(
        `test.${name.toLowerCase().replace(/\s+/g, '_')}`,
        duration,
        'timer',
        { success: 'true' }
      )
      
      console.log(`  ✅ ${name}: ${duration.toFixed(2)}ms`)
      
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      this.results.push({
        name,
        duration,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
      
      // Record in performance monitor
      PerformanceMonitor.recordMetric(
        `test.${name.toLowerCase().replace(/\s+/g, '_')}`,
        duration,
        'timer',
        { success: 'false', error: error instanceof Error ? error.message : 'unknown' }
      )
      
      console.log(`  ❌ ${name}: ${duration.toFixed(2)}ms - ${error}`)
    }
  }

  private generateReport() {
    console.log('\n📋 Performance Test Report')
    console.log('=' .repeat(50))
    
    const successful = this.results.filter(r => r.success)
    const failed = this.results.filter(r => !r.success)
    
    console.log(`Total Tests: ${this.results.length}`)
    console.log(`Successful: ${successful.length}`)
    console.log(`Failed: ${failed.length}`)
    console.log(`Success Rate: ${((successful.length / this.results.length) * 100).toFixed(1)}%`)
    
    if (successful.length > 0) {
      const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length
      const maxDuration = Math.max(...successful.map(r => r.duration))
      const minDuration = Math.min(...successful.map(r => r.duration))
      
      console.log(`\nPerformance Summary:`)
      console.log(`  Average Duration: ${avgDuration.toFixed(2)}ms`)
      console.log(`  Max Duration: ${maxDuration.toFixed(2)}ms`)
      console.log(`  Min Duration: ${minDuration.toFixed(2)}ms`)
    }
    
    if (failed.length > 0) {
      console.log(`\nFailed Tests:`)
      failed.forEach(test => {
        console.log(`  ❌ ${test.name}: ${test.error}`)
      })
    }
    
    // Show slowest tests
    const slowest = [...successful].sort((a, b) => b.duration - a.duration).slice(0, 5)
    if (slowest.length > 0) {
      console.log(`\nSlowest Tests:`)
      slowest.forEach((test, i) => {
        console.log(`  ${i + 1}. ${test.name}: ${test.duration.toFixed(2)}ms`)
      })
    }
    
    // Get system performance stats
    const systemStats = PerformanceMonitor.getPerformanceStats()
    const queryStats = QueryPerformanceMonitor.getMetrics()
    
    console.log(`\nSystem Performance:`)
    console.log(`  Query Metrics: ${Object.keys(queryStats).length} tracked`)
    console.log(`  Cache Hit Rates:`)
    console.log(`    Stalls: ${(stallsCache.getStats().hitRate * 100).toFixed(1)}%`)
    console.log(`    Products: ${(productsCache.getStats().hitRate * 100).toFixed(1)}%`)
    
    console.log('\n🎉 Performance testing completed!')
  }
}

async function main() {
  const tester = new PerformanceTester()
  await tester.runAllTests()
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { PerformanceTester }