'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface ToastContextType {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => void
  hideToast: (id: string) => void
  clearAllToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      id,
      duration: 5000, // 5 seconds default
      ...toast,
    }

    setToasts(prev => [...prev, newToast])

    // Auto-hide toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id)
      }, newToast.duration)
    }
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, clearAllToasts }}>
      {children}
      <ToastContainer toasts={toasts} onHideToast={hideToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Convenience hooks for different toast types
export function useToastNotifications() {
  const { showToast } = useToast()

  const showSuccess = useCallback((title: string, message?: string, action?: Toast['action']) => {
    showToast({ type: 'success', title, message, action })
  }, [showToast])

  const showError = useCallback((title: string, message?: string, action?: Toast['action']) => {
    showToast({ type: 'error', title, message, action })
  }, [showToast])

  const showWarning = useCallback((title: string, message?: string, action?: Toast['action']) => {
    showToast({ type: 'warning', title, message, action })
  }, [showToast])

  const showInfo = useCallback((title: string, message?: string, action?: Toast['action']) => {
    showToast({ type: 'info', title, message, action })
  }, [showToast])

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}

interface ToastContainerProps {
  toasts: Toast[]
  onHideToast: (id: string) => void
}

function ToastContainer({ toasts, onHideToast }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onHide={onHideToast} />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onHide: (id: string) => void
}

function ToastItem({ toast, onHide }: ToastItemProps) {
  const getToastStyles = () => {
    const baseStyles = "min-w-80 max-w-md p-4 rounded-lg shadow-lg border backdrop-blur-sm"
    
    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-100`
      case 'error':
        return `${baseStyles} bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-100`
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-100`
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100`
      default:
        return `${baseStyles} bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-900/20 dark:border-slate-800 dark:text-slate-100`
    }
  }

  const getIcon = () => {
    const iconClass = "h-5 w-5 flex-shrink-0"
    
    switch (toast.type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-600 dark:text-green-400`} />
      case 'error':
        return <XCircle className={`${iconClass} text-red-600 dark:text-red-400`} />
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-600 dark:text-yellow-400`} />
      case 'info':
        return <Info className={`${iconClass} text-blue-600 dark:text-blue-400`} />
      default:
        return <Info className={`${iconClass} text-slate-600 dark:text-slate-400`} />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={getToastStyles()}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm leading-tight">
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-sm opacity-90 mt-1 leading-tight">
              {toast.message}
            </p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="text-sm font-medium underline mt-2 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => onHide(toast.id)}
          className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

// Session warning toast component
export function SessionWarningToast({ 
  timeUntilExpiry, 
  onExtend, 
  onLogout 
}: { 
  timeUntilExpiry: number
  onExtend: () => void
  onLogout: () => void
}) {
  const minutes = Math.floor(timeUntilExpiry / 60000)
  const seconds = Math.floor((timeUntilExpiry % 60000) / 1000)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
    >
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 backdrop-blur-sm dark:bg-yellow-900/20 dark:border-yellow-800">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-yellow-900 dark:text-yellow-100">
              Session Expiring Soon
            </h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Your session will expire in {minutes}:{seconds.toString().padStart(2, '0')}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onExtend}
              className="px-3 py-1 text-xs font-medium bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
            >
              Extend
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-1 text-xs font-medium bg-slate-600 text-white rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}