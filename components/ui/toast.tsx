"use client"

import * as React from "react"

// Simple toast notifications hook without external dependencies
export function useToastNotifications() {
  const showSuccess = (title: string, description?: string) => {
    // For now, use console.log and alert - you can implement actual toast later
    console.log('✅ Success:', title, description)
    if (typeof window !== 'undefined') {
      // Simple browser notification for now
      alert(`✅ ${title}${description ? '\n' + description : ''}`)
    }
  }

  const showError = (title: string, description?: string) => {
    console.error('❌ Error:', title, description)
    if (typeof window !== 'undefined') {
      alert(`❌ ${title}${description ? '\n' + description : ''}`)
    }
  }

  const showWarning = (title: string, description?: string) => {
    console.warn('⚠️ Warning:', title, description)
    if (typeof window !== 'undefined') {
      alert(`⚠️ ${title}${description ? '\n' + description : ''}`)
    }
  }

  return { showSuccess, showError, showWarning }
}

// Simple ToastProvider component for compatibility
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

// Session warning toast component
interface SessionWarningToastProps {
  timeUntilExpiry: number
  onExtend: () => void
  onLogout: () => void
}

export function SessionWarningToast({ timeUntilExpiry, onExtend, onLogout }: SessionWarningToastProps) {
  const minutes = Math.floor(timeUntilExpiry / 60000)
  
  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Session Expiring Soon</p>
          <p className="text-sm">Your session will expire in {minutes} minute{minutes !== 1 ? 's' : ''}.</p>
        </div>
        <div className="ml-4 flex gap-2">
          <button
            onClick={onExtend}
            className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
          >
            Extend
          </button>
          <button
            onClick={onLogout}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}