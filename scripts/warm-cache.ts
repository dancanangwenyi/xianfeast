#!/usr/bin/env tsx

/**
 * Cache warming script for performance optimization
 * Run this script to pre-populate caches with frequently accessed data
 */

import { CacheWarmer } from '../lib/cache/cache-manager'
import { PerformanceMonitor } from '../lib/monitoring/performance-monitor'

async function main() {
  console.log('🔥 Starting cache warm-up process...')
  
  const startTime = Date.now()
  
  try {
    // Warm up the cache
    await CacheWarmer.warmCache()
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // Record the warm-up performance
    PerformanceMonitor.recordMetric(
      'cache_warmup_duration',
      duration,
      'timer',
      { success: 'true' }
    )
    
    console.log(`✅ Cache warm-up completed in ${duration}ms`)
    
    // Start periodic refresh
    console.log('🔄 Starting periodic cache refresh (every 5 minutes)...')
    CacheWarmer.startPeriodicRefresh(300000) // 5 minutes
    
    console.log('🎉 Cache warming system is now active!')
    
  } catch (error) {
    console.error('❌ Cache warm-up failed:', error)
    
    PerformanceMonitor.recordMetric(
      'cache_warmup_duration',
      Date.now() - startTime,
      'timer',
      { success: 'false', error: error instanceof Error ? error.message : 'unknown' }
    )
    
    process.exit(1)
  }
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { main as warmCache }