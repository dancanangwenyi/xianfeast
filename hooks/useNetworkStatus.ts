/**
 * React Hook for Network Status and Offline Support
 * Provides real-time network status and offline capabilities
 */

import { useState, useEffect, useCallback } from 'react'
import { offlineManager } from '@/lib/offline/offline-manager'

export interface NetworkStatus {
  isOnline: boolean
  isOffline: boolean
  pendingSyncCount: number
  cacheSize: number
  lastSyncAttempt: Date | null
  connectionType: string | null
}

export interface NetworkActions {
  syncNow: () => Promise<void>
  clearCache: () => void
  clearSyncQueue: () => void
  retryFailedOperations: () => Promise<void>
}

export function useNetworkStatus(): [NetworkStatus, NetworkActions] {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const [cacheSize, setCacheSize] = useState(0)
  const [lastSyncAttempt, setLastSyncAttempt] = useState<Date | null>(null)
  const [connectionType, setConnectionType] = useState<string | null>(null)

  // Update network status
  const updateStatus = useCallback(() => {
    setIsOnline(offlineManager.online)
    setPendingSyncCount(offlineManager.pendingSyncCount)
    setCacheSize(offlineManager.cacheSize)
    
    // Get connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      setConnectionType(connection?.effectiveType || connection?.type || null)
    }
  }, [])

  // Handle online/offline events
  useEffect(() => {
    const handleStatusChange = (online: boolean) => {
      setIsOnline(online)
      updateStatus()
    }

    // Add listener to offline manager
    offlineManager.addStatusListener(handleStatusChange)

    // Initial status update
    updateStatus()

    // Cleanup
    return () => {
      offlineManager.removeStatusListener(handleStatusChange)
    }
  }, [updateStatus])

  // Sync now
  const syncNow = useCallback(async () => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline')
    }

    setLastSyncAttempt(new Date())
    
    try {
      await offlineManager.syncPendingOperations()
      updateStatus()
    } catch (error) {
      console.error('Sync failed:', error)
      throw error
    }
  }, [isOnline, updateStatus])

  // Clear cache
  const clearCache = useCallback(() => {
    offlineManager.clearCache()
    updateStatus()
  }, [updateStatus])

  // Clear sync queue
  const clearSyncQueue = useCallback(() => {
    offlineManager.clearSyncQueue()
    updateStatus()
  }, [updateStatus])

  // Retry failed operations
  const retryFailedOperations = useCallback(async () => {
    await syncNow()
  }, [syncNow])

  const status: NetworkStatus = {
    isOnline,
    isOffline: !isOnline,
    pendingSyncCount,
    cacheSize,
    lastSyncAttempt,
    connectionType
  }

  const actions: NetworkActions = {
    syncNow,
    clearCache,
    clearSyncQueue,
    retryFailedOperations
  }

  return [status, actions]
}

/**
 * Hook for enhanced API calls with offline support
 */
export function useOfflineApi() {
  const [networkStatus] = useNetworkStatus()

  const apiCall = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    try {
      return await offlineManager.fetch(url, options)
    } catch (error) {
      // If offline and no cache available, provide helpful error
      if (!networkStatus.isOnline) {
        throw new Error('This feature requires an internet connection. Please check your connection and try again.')
      }
      throw error
    }
  }, [networkStatus.isOnline])

  return {
    apiCall,
    isOnline: networkStatus.isOnline,
    isOffline: networkStatus.isOffline,
    pendingSyncCount: networkStatus.pendingSyncCount
  }
}