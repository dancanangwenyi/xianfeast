/**
 * Offline Page - Displayed when user is completely offline
 * Provides helpful information and cached functionality
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  WifiOff, 
  RefreshCw, 
  Clock, 
  Database,
  Home,
  ShoppingCart,
  AlertTriangle
} from 'lucide-react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { NetworkStatus } from '@/components/ui/network-status'

export default function OfflinePage() {
  const [networkStatus, networkActions] = useNetworkStatus()

  const handleRetry = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Offline Status */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
              <WifiOff className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">You're Offline</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No internet connection detected. Some features may be limited until you reconnect.
              </AlertDescription>
            </Alert>

            {/* Network Status Details */}
            <NetworkStatus showDetails={true} />

            {/* What you can do offline */}
            <div className="space-y-3">
              <h3 className="font-medium">What you can do offline:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Browse previously viewed stalls and menus
                </li>
                <li className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Add items to your cart (will sync when online)
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  View your order history
                </li>
              </ul>
            </div>

            {/* Pending sync info */}
            {networkStatus.pendingSyncCount > 0 && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  You have {networkStatus.pendingSyncCount} change{networkStatus.pendingSyncCount !== 1 ? 's' : ''} waiting to sync when you reconnect.
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Connection
              </Button>
              
              <Button variant="outline" onClick={handleGoHome} className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Button>
            </div>

            {/* Connection tips */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Connection Tips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check your WiFi or mobile data connection</li>
                <li>Try moving to an area with better signal</li>
                <li>Restart your router or toggle airplane mode</li>
                <li>Contact your internet service provider if issues persist</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Cached Data Info */}
        {networkStatus.cacheSize > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                Offline Data Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {networkStatus.cacheSize} item{networkStatus.cacheSize !== 1 ? 's' : ''} cached
                </span>
                <Badge variant="secondary">Available Offline</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                You can browse previously loaded content while offline.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}