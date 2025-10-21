'use client'

import { useState, useEffect, useCallback, useRef, createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export interface SessionData {
  userId: string
  email: string
  roles: string[]
  businessId?: string
  isAuthenticated: boolean
  isLoading: boolean
}

export interface SessionManagerOptions {
  onSessionExpired?: () => void
  onSessionRefresh?: (session: SessionData) => void
  sessionTimeoutWarning?: number // seconds before expiry to show warning
}

// Global session manager to prevent multiple instances
class GlobalSessionManager {
  private static instance: GlobalSessionManager
  private session: SessionData = {
    userId: '',
    email: '',
    roles: [],
    businessId: '',
    isAuthenticated: false,
    isLoading: true,
  }
  private listeners: Set<(session: SessionData) => void> = new Set()
  private lastCheckTime = 0
  private isChecking = false
  private checkInterval: NodeJS.Timeout | null = null
  private timeUntilExpiry = 0
  private expiryInterval: NodeJS.Timeout | null = null

  static getInstance(): GlobalSessionManager {
    if (!GlobalSessionManager.instance) {
      GlobalSessionManager.instance = new GlobalSessionManager()
    }
    return GlobalSessionManager.instance
  }

  subscribe(listener: (session: SessionData) => void): () => void {
    this.listeners.add(listener)
    // Immediately notify the new listener
    listener(this.session)
    
    // Start checking if this is the first subscriber
    if (this.listeners.size === 1) {
      this.startSessionChecking()
    }
    
    return () => {
      this.listeners.delete(listener)
      // Stop checking if no more subscribers
      if (this.listeners.size === 0) {
        this.stopSessionChecking()
      }
    }
  }

  private async checkSession(): Promise<void> {
    const now = Date.now()
    
    // Throttle: Don't check more than once every 30 seconds
    if (now - this.lastCheckTime < 30000) {
      return
    }
    
    // Prevent concurrent checks
    if (this.isChecking) {
      return
    }
    
    this.isChecking = true
    this.lastCheckTime = now
    
    try {
      const response = await fetch('/api/auth/verify-session', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        const sessionData: SessionData = {
          userId: data.userId,
          email: data.email,
          roles: data.roles || [],
          businessId: data.businessId || '',
          isAuthenticated: true,
          isLoading: false,
        }
        
        this.session = sessionData
        this.notifyListeners()
        
        // Calculate time until expiry
        const expiresAt = data.expiresAt
        if (expiresAt) {
          const now = Date.now()
          const expiryTime = new Date(expiresAt).getTime()
          this.timeUntilExpiry = Math.max(0, expiryTime - now)
          this.startExpiryCountdown()
        }
      } else {
        // Session invalid or expired
        this.handleSessionExpired()
      }
    } catch (error) {
      console.error('Session check failed:', error)
      this.handleSessionExpired()
    } finally {
      this.isChecking = false
    }
  }

  private handleSessionExpired(): void {
    this.session = {
      userId: '',
      email: '',
      roles: [],
      businessId: '',
      isAuthenticated: false,
      isLoading: false,
    }
    this.timeUntilExpiry = 0
    this.notifyListeners()
    this.stopExpiryCountdown()
  }

  private startSessionChecking(): void {
    // Initial check
    this.checkSession()
    
    // Set up periodic checks every 2 minutes (much less frequent)
    this.checkInterval = setInterval(() => {
      this.checkSession()
    }, 120000) // 2 minutes
  }

  private stopSessionChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.stopExpiryCountdown()
  }

  private startExpiryCountdown(): void {
    this.stopExpiryCountdown()
    
    if (this.timeUntilExpiry > 0) {
      this.expiryInterval = setInterval(() => {
        this.timeUntilExpiry = Math.max(0, this.timeUntilExpiry - 1000)
        
        if (this.timeUntilExpiry === 0) {
          this.handleSessionExpired()
        }
      }, 1000)
    }
  }

  private stopExpiryCountdown(): void {
    if (this.expiryInterval) {
      clearInterval(this.expiryInterval)
      this.expiryInterval = null
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.session))
  }

  getTimeUntilExpiry(): number {
    return this.timeUntilExpiry
  }

  async extendSession(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        this.session = {
          userId: data.userId,
          email: data.email,
          roles: data.roles || [],
          businessId: data.businessId || '',
          isAuthenticated: true,
          isLoading: false,
        }
        
        // Update expiry time after successful refresh
        const expiresAt = data.expiresAt
        if (expiresAt) {
          const now = Date.now()
          const expiryTime = new Date(expiresAt).getTime()
          this.timeUntilExpiry = Math.max(0, expiryTime - now)
          this.startExpiryCountdown()
        }
        
        this.notifyListeners()
        return true
      } else {
        this.handleSessionExpired()
        return false
      }
    } catch (error) {
      console.error('Session extension failed:', error)
      this.handleSessionExpired()
      return false
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      this.handleSessionExpired()
    }
  }
}

// Context for session data
const SessionContext = createContext<{
  session: SessionData
  timeUntilExpiry: number
  extendSession: () => Promise<boolean>
  logout: () => Promise<void>
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  isSuperAdmin: () => boolean
} | null>(null)

// Provider component
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionData>({
    userId: '',
    email: '',
    roles: [],
    businessId: '',
    isAuthenticated: false,
    isLoading: true,
  })
  const [timeUntilExpiry, setTimeUntilExpiry] = useState(0)
  const globalManager = GlobalSessionManager.getInstance()

  useEffect(() => {
    const unsubscribe = globalManager.subscribe((newSession) => {
      setSession(newSession)
      setTimeUntilExpiry(globalManager.getTimeUntilExpiry())
    })

    // Update time until expiry periodically
    const interval = setInterval(() => {
      setTimeUntilExpiry(globalManager.getTimeUntilExpiry())
    }, 1000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const hasRole = useCallback((role: string): boolean => {
    return session.roles.includes(role)
  }, [session.roles])

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return roles.some(role => session.roles.includes(role))
  }, [session.roles])

  const isSuperAdmin = useCallback((): boolean => {
    return hasRole('super_admin')
  }, [hasRole])

  const extendSession = useCallback(async (): Promise<boolean> => {
    return globalManager.extendSession()
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    return globalManager.logout()
  }, [])

  return (
    <SessionContext.Provider value={{
      session,
      timeUntilExpiry,
      extendSession,
      logout,
      hasRole,
      hasAnyRole,
      isSuperAdmin,
    }}>
      {children}
    </SessionContext.Provider>
  )
}

// Hook to use session
export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}

// Legacy hook for backward compatibility
export function useSessionManager(options: SessionManagerOptions = {}) {
  const router = useRouter()
  const { session, timeUntilExpiry, extendSession, logout, hasRole, hasAnyRole, isSuperAdmin } = useSession()
  
  const [showSessionWarning, setShowSessionWarning] = useState(false)
  const { sessionTimeoutWarning = 300 } = options

  // Show warning if session is about to expire
  useEffect(() => {
    if (timeUntilExpiry <= sessionTimeoutWarning * 1000 && timeUntilExpiry > 0) {
      setShowSessionWarning(true)
    } else {
      setShowSessionWarning(false)
    }
  }, [timeUntilExpiry, sessionTimeoutWarning])

  const handleSessionExpired = useCallback(() => {
    router.push('/login')
  }, [router])

  return {
    session,
    showSessionWarning,
    timeUntilExpiry,
    checkSession: () => {}, // No-op for backward compatibility
    extendSession,
    logout,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
  }
}