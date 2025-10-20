'use client'

import { useSession } from '@/hooks/useSessionManager'
import { SessionWarningToast } from '@/components/ui/toast'
import { useEffect } from 'react'

interface SessionAwareLayoutProps {
  children: React.ReactNode
  requiredRoles?: string[]
  fallback?: React.ReactNode
}

export function SessionAwareLayout({ 
  children, 
  requiredRoles = [], 
  fallback = null 
}: SessionAwareLayoutProps) {
  const { 
    session, 
    timeUntilExpiry, 
    extendSession, 
    logout,
    hasAnyRole 
  } = useSession()

  // Check if user has required roles
  const hasRequiredRoles = requiredRoles.length === 0 || hasAnyRole(requiredRoles)

  // Show loading state while checking session
  if (session.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100"></div>
      </div>
    )
  }

  // Show fallback if user doesn't have required roles
  if (!session.isAuthenticated || !hasRequiredRoles) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Access Denied
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {children}
      
      {/* Session warning toast */}
      {timeUntilExpiry <= 300000 && timeUntilExpiry > 0 && (
        <SessionWarningToast
          timeUntilExpiry={timeUntilExpiry}
          onExtend={extendSession}
          onLogout={logout}
        />
      )}
    </>
  )
}
