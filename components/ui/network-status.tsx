/**
 * Network Status Component
 * Shows connection status and offline capabilities
 */

'use client'

import React from 'react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { Button } from './button'
import { Alert, AlertDescription } from './alert'
import { Badge } from './badge'
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock, 
  Database,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NetworkStatusProps {
  showDetails?: boolean
  className?: string
}

export function NetworkStatus({ showDetails = false, className }: NetworkStatusProps) {
  const [status, actions] = useNetworkStatus()
  const [isSyncing, setIsSyncing] = React.useState(false)

  const handleSync = async () => {
    if (!status.isOnline) return
    
    setIsSyncing(true)
    try {
      await actions.syncNow()
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Simple status indicator
  if (!showDetails) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {status.isOnline ? (
          <div className="flex items-center gap-1 text-green-600">
            <Wifi className="h-4 w-4" />
            <span className="text-sm">Online</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-orange-600">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm">Offline</span>
          </div>
        )}
        
        {status.pendingSyncCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {status.pendingSyncCount} pending
          </Badge>
        )}
      </div>
    )
  }

  // Detailed status panel
  return (
    <div className={cn('space-y-4', className)}>
      {/* Connection Status */}
      <Alert className={cn(
        status.isOnline ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
      )}>
        <div className="flex items-center gap-2">
          {status.isOnline ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          )}
          <AlertDescription className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {status.isOnline ? 'Connected' : 'Offline Mode'}
              </span>
              {status.connectionType && (
                <Badge variant="outline" className="text-xs">
                  {status.connectionType}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {status.isOnline 
                ? 'All features are available'
                : 'Limited functionality - changes will sync when connection is restored'
              }
            </p>
          </AlertDescription>
        </div>
      </Alert>

      {/* Sync Status */}
      {status.pendingSyncCount > 0 && (
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-sm font-medium">
                {status.pendingSyncCount} operation{status.pendingSyncCount !== 1 ? 's' : ''} pending sync
              </p>
              <p className="text-xs text-muted-foreground">
                Changes will be synchronized when online
              </p>
            </div>
          </div>
          
          {status.isOnline && (
            <Button
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="ml-4"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Sync Now
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Cache Status */}
      {status.cacheSize > 0 && (
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm font-medium">
                {status.cacheSize} item{status.cacheSize !== 1 ? 's' : ''} cached
              </p>
              <p className="text-xs text-muted-foreground">
                Available for offline browsing
              </p>
            </div>
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={actions.clearCache}
          >
            Clear Cache
          </Button>
        </div>
      )}

      {/* Last Sync */}
      {status.lastSyncAttempt && (
        <div className="text-xs text-muted-foreground text-center">
          Last sync attempt: {status.lastSyncAttempt.toLocaleTimeString()}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {status.isOnline && status.pendingSyncCount > 0 && (
          <Button
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="flex-1"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync All Changes
              </>
            )}
          </Button>
        )}
        
        {status.pendingSyncCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={actions.clearSyncQueue}
          >
            Clear Queue
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Compact network status indicator for headers/navigation
 */
export function NetworkStatusIndicator({ className }: { className?: string }) {
  const [status] = useNetworkStatus()

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {status.isOnline ? (
        <Wifi className="h-4 w-4 text-green-600" />
      ) : (
        <WifiOff className="h-4 w-4 text-orange-600" />
      )}
      
      {status.pendingSyncCount > 0 && (
        <Badge variant="secondary" className="text-xs px-1 py-0 h-4 min-w-4">
          {status.pendingSyncCount}
        </Badge>
      )}
    </div>
  )
}

/**
 * Offline banner component
 */
export function OfflineBanner() {
  const [status, actions] = useNetworkStatus()
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    setIsVisible(!status.isOnline)
  }, [status.isOnline])

  if (!isVisible) return null

  return (
    <div className="bg-orange-100 border-b border-orange-200 px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <span className="text-sm font-medium text-orange-800">
            You're currently offline
          </span>
          {status.pendingSyncCount > 0 && (
            <span className="text-xs text-orange-600">
              • {status.pendingSyncCount} change{status.pendingSyncCount !== 1 ? 's' : ''} will sync when reconnected
            </span>
          )}
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsVisible(false)}
          className="text-orange-800 hover:bg-orange-200"
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}