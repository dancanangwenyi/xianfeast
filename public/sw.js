/**
 * Service Worker for Background Sync and Offline Support
 * Handles background synchronization of customer orders and data
 */

const CACHE_NAME = 'xianfeast-v1'
const OFFLINE_URL = '/offline'

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/customer/login',
  '/customer/stalls',
  '/offline',
  '/manifest.json'
]

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static resources')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log('Service Worker installed successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker installation failed:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker activated successfully')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If request is successful, cache the response
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone)
            })
        }
        return response
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            
            // If no cached version, serve offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL)
            }
            
            // For other requests, return a generic offline response
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            })
          })
      })
  )
})

// Background sync event - sync pending operations
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(syncPendingOperations())
  }
})

// Sync pending operations
async function syncPendingOperations() {
  try {
    console.log('Starting background sync...')
    
    // Get sync queue from IndexedDB or localStorage
    const syncQueue = await getSyncQueue()
    
    if (syncQueue.length === 0) {
      console.log('No operations to sync')
      return
    }
    
    console.log(`Syncing ${syncQueue.length} operations`)
    
    for (const operation of syncQueue) {
      try {
        await syncOperation(operation)
        await removeFromSyncQueue(operation.id)
        console.log('Synced operation:', operation.id)
      } catch (error) {
        console.error('Failed to sync operation:', operation.id, error)
        
        // Increment retry count
        operation.retries = (operation.retries || 0) + 1
        
        // Remove if max retries exceeded
        if (operation.retries >= 3) {
          await removeFromSyncQueue(operation.id)
          console.warn('Removed failed operation after max retries:', operation.id)
        } else {
          await updateSyncQueue(operation)
        }
      }
    }
    
    console.log('Background sync completed')
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Sync individual operation
async function syncOperation(operation) {
  const { endpoint, method, data } = operation
  
  const response = await fetch(endpoint, {
    method: method || 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : undefined
  })
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

// Get sync queue from storage
async function getSyncQueue() {
  try {
    // Try to get from IndexedDB first, fallback to localStorage
    const stored = localStorage.getItem('sync_queue')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to get sync queue:', error)
    return []
  }
}

// Remove operation from sync queue
async function removeFromSyncQueue(operationId) {
  try {
    const queue = await getSyncQueue()
    const updatedQueue = queue.filter(op => op.id !== operationId)
    localStorage.setItem('sync_queue', JSON.stringify(updatedQueue))
  } catch (error) {
    console.error('Failed to remove from sync queue:', error)
  }
}

// Update operation in sync queue
async function updateSyncQueue(operation) {
  try {
    const queue = await getSyncQueue()
    const index = queue.findIndex(op => op.id === operation.id)
    if (index !== -1) {
      queue[index] = operation
      localStorage.setItem('sync_queue', JSON.stringify(queue))
    }
  } catch (error) {
    console.error('Failed to update sync queue:', error)
  }
}

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data)
  
  if (event.data && event.data.type === 'SYNC_NOW') {
    syncPendingOperations()
      .then(() => {
        event.ports[0].postMessage({ success: true })
      })
      .catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message })
      })
  }
})

// Push event - handle push notifications (future feature)
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)
  
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body || 'You have a new notification',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: data.tag || 'default',
      data: data.data || {}
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'XianFeast', options)
    )
  }
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  
  event.notification.close()
  
  // Handle notification click
  event.waitUntil(
    self.clients.openWindow(event.notification.data.url || '/')
  )
})