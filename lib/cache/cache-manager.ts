/**
 * In-memory cache manager for frequently accessed data
 * Implements LRU (Least Recently Used) eviction policy
 */

interface CacheItem<T> {
  value: T
  timestamp: number
  accessCount: number
  lastAccessed: number
  ttl?: number
}

interface CacheStats {
  hits: number
  misses: number
  evictions: number
  size: number
  hitRate: number
}

export class CacheManager<T = any> {
  private cache: Map<string, CacheItem<T>> = new Map()
  private maxSize: number
  private defaultTTL: number
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    hitRate: 0
  }

  constructor(maxSize: number = 1000, defaultTTL: number = 300000) { // 5 minutes default
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Check if item has expired
    if (this.isExpired(item)) {
      this.cache.delete(key)
      this.stats.misses++
      this.stats.size = this.cache.size
      this.updateHitRate()
      return null
    }

    // Update access statistics
    item.accessCount++
    item.lastAccessed = Date.now()
    
    this.stats.hits++
    this.updateHitRate()
    
    return item.value
  }

  /**
   * Set item in cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Check if we need to evict items
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU()
    }

    const now = Date.now()
    const item: CacheItem<T> = {
      value,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      ttl: ttl || this.defaultTTL
    }

    this.cache.set(key, item)
    this.stats.size = this.cache.size
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    this.stats.size = this.cache.size
    return deleted
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.stats.size = 0
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<R>(
    key: string, 
    fetchFn: () => Promise<R>, 
    ttl?: number
  ): Promise<R> {
    const cached = this.get(key)
    if (cached !== null) {
      return cached as R
    }

    const value = await fetchFn()
    this.set(key, value as T, ttl)
    return value
  }

  /**
   * Check if item exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false
    
    if (this.isExpired(item)) {
      this.cache.delete(key)
      this.stats.size = this.cache.size
      return false
    }
    
    return true
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Cleanup expired items
   */
  cleanup(): number {
    let cleaned = 0
    const now = Date.now()
    
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.cache.delete(key)
        cleaned++
      }
    }
    
    this.stats.size = this.cache.size
    return cleaned
  }

  private isExpired(item: CacheItem<T>): boolean {
    if (!item.ttl) return false
    return Date.now() - item.timestamp > item.ttl
  }

  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.stats.evictions++
      this.stats.size = this.cache.size
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }
}

/**
 * Global cache instances for different data types
 */
export const stallsCache = new CacheManager(500, 600000) // 10 minutes for stalls
export const productsCache = new CacheManager(2000, 300000) // 5 minutes for products
export const ordersCache = new CacheManager(1000, 60000) // 1 minute for orders
export const businessCache = new CacheManager(200, 900000) // 15 minutes for businesses
export const userCache = new CacheManager(1000, 300000) // 5 minutes for users

/**
 * Cache key generators
 */
export const CacheKeys = {
  stall: (id: string) => `stall:${id}`,
  stallsByBusiness: (businessId: string) => `stalls:business:${businessId}`,
  stallsActive: () => 'stalls:active',
  
  product: (id: string) => `product:${id}`,
  productsByStall: (stallId: string) => `products:stall:${stallId}`,
  productsActive: () => 'products:active',
  
  order: (id: string) => `order:${id}`,
  ordersByCustomer: (customerId: string) => `orders:customer:${customerId}`,
  orderItems: (orderId: string) => `order:items:${orderId}`,
  
  business: (id: string) => `business:${id}`,
  businessesActive: () => 'businesses:active',
  
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  
  cart: (customerId: string) => `cart:${customerId}`,
  
  // Aggregated data
  stallsWithProducts: () => 'stalls:with-products',
  customerOrderStats: (customerId: string) => `customer:stats:${customerId}`,
  businessMetrics: (businessId: string) => `business:metrics:${businessId}`
}

/**
 * Cache warming utilities
 */
export class CacheWarmer {
  /**
   * Warm up frequently accessed data
   */
  static async warmCache() {
    console.log('Starting cache warm-up...')
    
    try {
      // Import here to avoid circular dependencies
      const { getAllStalls } = await import('../dynamodb/stalls')
      const { getAllProducts } = await import('../dynamodb/products')
      const { getAllBusinesses } = await import('../dynamodb/business')
      
      // Warm stalls cache
      const stalls = await getAllStalls({ status: 'active' })
      stallsCache.set(CacheKeys.stallsActive(), stalls, 600000)
      
      // Cache individual stalls
      stalls.forEach(stall => {
        stallsCache.set(CacheKeys.stall(stall.id), stall, 600000)
      })
      
      // Warm products cache
      const products = await getAllProducts({ status: 'active' })
      productsCache.set(CacheKeys.productsActive(), products, 300000)
      
      // Cache individual products
      products.forEach(product => {
        productsCache.set(CacheKeys.product(product.id), product, 300000)
      })
      
      // Warm businesses cache
      const businesses = await getAllBusinesses()
      businessCache.set(CacheKeys.businessesActive(), businesses, 900000)
      
      // Cache individual businesses
      businesses.forEach(business => {
        businessCache.set(CacheKeys.business(business.id), business, 900000)
      })
      
      console.log(`Cache warmed: ${stalls.length} stalls, ${products.length} products, ${businesses.length} businesses`)
      
    } catch (error) {
      console.error('Cache warm-up failed:', error)
    }
  }

  /**
   * Schedule periodic cache refresh
   */
  static startPeriodicRefresh(intervalMs: number = 300000) { // 5 minutes
    setInterval(async () => {
      try {
        await this.warmCache()
        
        // Cleanup expired items
        const cleanedStalls = stallsCache.cleanup()
        const cleanedProducts = productsCache.cleanup()
        const cleanedOrders = ordersCache.cleanup()
        const cleanedBusiness = businessCache.cleanup()
        const cleanedUsers = userCache.cleanup()
        
        console.log(`Cache cleanup: ${cleanedStalls + cleanedProducts + cleanedOrders + cleanedBusiness + cleanedUsers} items removed`)
        
      } catch (error) {
        console.error('Periodic cache refresh failed:', error)
      }
    }, intervalMs)
  }
}

/**
 * Cache middleware for API routes
 */
export function withCache<T>(
  cache: CacheManager<T>,
  keyGenerator: (...args: any[]) => string,
  ttl?: number
) {
  return function cacheDecorator(
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator(...args)
      
      // Try to get from cache first
      const cached = cache.get(cacheKey)
      if (cached !== null) {
        return cached
      }
      
      // Execute original method
      const result = await method.apply(this, args)
      
      // Cache the result
      cache.set(cacheKey, result, ttl)
      
      return result
    }

    return descriptor
  }
}