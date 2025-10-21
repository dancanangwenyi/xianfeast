/**
 * Offline Mode Support with Cached Data and Auto-Sync
 * Provides seamless offline experience for customer ordering
 */

export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  expiry: number
  version: string
}

export interface SyncQueueItem {
  id: string
  type: 'create' | 'update' | 'delete'
  endpoint: string
  data: any
  timestamp: number
  retries: number
}

export interface OfflineConfig {
  maxCacheAge: number // milliseconds
  maxRetries: number
  syncInterval: number // milliseconds
  enableBackgroundSync: boolean
}

export class OfflineManager {
  private static instance: OfflineManager
  private isOnline: boolean = navigator.onLine
  private cache: Map<string, CacheEntry> = new Map()
  private syncQueue: SyncQueueItem[] = []
  private syncInProgress: boolean = false
  private config: OfflineConfig
  private listeners: Set<(isOnline: boolean) => void> = new Set()

  private constructor(config: Partial<OfflineConfig> = {}) {
    this.config = {
      maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
      maxRetries: 3,
      syncInterval: 30 * 1000, // 30 seconds
      enableBackgroundSync: true,
      ...config
    }

    this.initializeOfflineSupport()
  }

  static getInstance(config?: Partial<OfflineConfig>): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager(config)
    }
    return OfflineManager.instance
  }

  /**
   * Initialize offline support
   */
  private initializeOfflineSupport(): void {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))

    // Load cached data and sync queue from localStorage
    this.loadFromStorage()

    // Start background sync if enabled
    if (this.config.enableBackgroundSync) {
      this.startBackgroundSync()
    }

    // Register service worker for background sync (if available)
    this.registerServiceWorker()
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log('🌐 Connection restored')
    this.isOnline = true
    this.notifyListeners(true)
    this.syncPendingOperations()
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('📴 Connection lost - switching to offline mode')
    this.isOnline = false
    this.notifyListeners(false)
  }

  /**
   * Add listener for online/offline status changes
   */
  addStatusListener(listener: (isOnline: boolean) => void): void {
    this.listeners.add(listener)
  }

  /**
   * Remove status listener
   */
  removeStatusListener(listener: (isOnline: boolean) => void): void {
    this.listeners.delete(listener)
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach(listener => listener(isOnline))
  }

  /**
   * Get cached data
   */
  getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if cache entry has expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      this.saveToStorage()
      return null
    }

    return entry.data
  }

  /**
   * Set cached data
   */
  setCachedData<T>(key: string, data: T, customExpiry?: number): void {
    const expiry = customExpiry || (Date.now() + this.config.maxCacheAge)
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry,
      version: '1.0'
    }

    this.cache.set(key, entry)
    this.saveToStorage()
  }

  /**
   * Enhanced fetch with offline support
   */
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const cacheKey = this.getCacheKey(url, options)

    // If online, try network first
    if (this.isOnline) {
      try {
        const response = await fetch(url, options)
        
        // Cache successful GET requests
        if (response.ok && options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE') {
          const clonedResponse = response.clone()
          const data = await clonedResponse.json()
          this.setCachedData(cacheKey, {
            status: response.status,
            data,
            headers: Object.fromEntries(response.headers.entries())
          })
        }

        return response
      } catch (error) {
        console.warn('Network request failed, checking cache:', error)
        // Fall through to cache check
      }
    }

    // Try to serve from cache
    const cachedData = this.getCachedData(cacheKey)
    if (cachedData) {
      console.log('📦 Serving from cache:', url)
      return new Response(JSON.stringify(cachedData.data), {
        status: cachedData.status,
        headers: {
          'Content-Type': 'application/json',
          'X-Served-From': 'cache',
          ...cachedData.headers
        }
      })
    }

    // If it's a mutation (POST, PUT, DELETE), queue it for later sync
    if (['POST', 'PUT', 'DELETE'].includes(options.method || 'GET')) {
      await this.queueForSync(url, options)
      
      // Return a success response for queued operations
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Operation queued for sync when online',
        queued: true 
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // No cache available and offline
    throw new Error('No cached data available and device is offline')
  }

  /**
   * Queue operation for sync when online
   */
  private async queueForSync(url: string, options: RequestInit): Promise<void> {
    const syncItem: SyncQueueItem = {
      id: this.generateId(),
      type: this.getOperationType(options.method || 'GET'),
      endpoint: url,
      data: options.body ? JSON.parse(options.body as string) : null,
      timestamp: Date.now(),
      retries: 0
    }

    this.syncQueue.push(syncItem)
    this.saveToStorage()
    
    console.log('📝 Queued operation for sync:', syncItem)
  }

  /**
   * Sync pending operations
   */
  async syncPendingOperations(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return
    }

    this.syncInProgress = true
    console.log(`🔄 Syncing ${this.syncQueue.length} pending operations`)

    const itemsToSync = [...this.syncQueue]
    const successfulSyncs: string[] = []

    for (const item of itemsToSync) {
      try {
        await this.syncItem(item)
        successfulSyncs.push(item.id)
        console.log('✅ Synced operation:', item.id)
      } catch (error) {
        console.error('❌ Failed to sync operation:', item.id, error)
        
        // Increment retry count
        item.retries++
        
        // Remove item if max retries exceeded
        if (item.retries >= this.config.maxRetries) {
          console.warn('🗑️ Removing failed operation after max retries:', item.id)
          successfulSyncs.push(item.id)
        }
      }
    }

    // Remove successfully synced items
    this.syncQueue = this.syncQueue.filter(item => !successfulSyncs.includes(item.id))
    this.saveToStorage()

    this.syncInProgress = false
    console.log(`✅ Sync complete. ${successfulSyncs.length} operations synced, ${this.syncQueue.length} remaining`)
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    const options: RequestInit = {
      method: item.type.toUpperCase(),
      headers: {
        'Content-Type': 'application/json'
      }
    }

    if (item.data) {
      options.body = JSON.stringify(item.data)
    }

    const response = await fetch(item.endpoint, options)
    
    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`)
    }
  }

  /**
   * Start background sync
   */
  private startBackgroundSync(): void {
    setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncPendingOperations()
      }
    }, this.config.syncInterval)
  }

  /**
   * Register service worker for background sync
   */
  private async registerServiceWorker(): void {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('📱 Service worker registered for background sync')
        
        // Register background sync
        if (registration.sync) {
          await registration.sync.register('background-sync')
        }
      } catch (error) {
        console.warn('Service worker registration failed:', error)
      }
    }
  }

  /**
   * Save cache and sync queue to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('offline_cache', JSON.stringify(Array.from(this.cache.entries())))
      localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue))
    } catch (error) {
      console.warn('Failed to save offline data to localStorage:', error)
    }
  }

  /**
   * Load cache and sync queue from localStorage
   */
  private loadFromStorage(): void {
    try {
      const cacheData = localStorage.getItem('offline_cache')
      if (cacheData) {
        const entries = JSON.parse(cacheData)
        this.cache = new Map(entries)
      }

      const queueData = localStorage.getItem('sync_queue')
      if (queueData) {
        this.syncQueue = JSON.parse(queueData)
      }
    } catch (error) {
      console.warn('Failed to load offline data from localStorage:', error)
    }
  }

  /**
   * Utility methods
   */
  private getCacheKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET'
    const body = options.body ? JSON.stringify(options.body) : ''
    return `${method}:${url}:${body}`
  }

  private getOperationType(method: string): 'create' | 'update' | 'delete' {
    switch (method.toUpperCase()) {
      case 'POST':
        return 'create'
      case 'PUT':
      case 'PATCH':
        return 'update'
      case 'DELETE':
        return 'delete'
      default:
        return 'create'
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Public getters
   */
  get online(): boolean {
    return this.isOnline
  }

  get pendingSyncCount(): number {
    return this.syncQueue.length
  }

  get cacheSize(): number {
    return this.cache.size
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear()
    this.saveToStorage()
  }

  /**
   * Clear sync queue
   */
  clearSyncQueue(): void {
    this.syncQueue = []
    this.saveToStorage()
  }
}

/**
 * Global offline manager instance
 */
export const offlineManager = OfflineManager.getInstance({
  maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
  maxRetries: 3,
  syncInterval: 30 * 1000, // 30 seconds
  enableBackgroundSync: true
})