"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

interface CartItem {
  product_id: string
  stall_id: string
  quantity: number
  product_title: string
  product_price_cents: number
  stall_name: string
  scheduled_for?: string
  special_instructions?: string
}

interface CartContextType {
  items: CartItem[]
  loading: boolean
  error: string | null
  addItem: (item: Omit<CartItem, 'quantity'>) => Promise<void>
  removeItem: (productId: string, stallId?: string, scheduledFor?: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number, stallId?: string, scheduledFor?: string) => Promise<void>
  clearCart: () => Promise<void>
  getTotalItems: () => number
  getTotalValue: () => number
  getItemQuantity: (productId: string) => number
  syncWithServer: () => Promise<void>
  validation?: {
    valid: boolean
    invalidItems: string[]
    unavailableItems: string[]
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = "xianfeast_cart"

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [validation, setValidation] = useState<{
    valid: boolean
    invalidItems: string[]
    unavailableItems: string[]
  }>()

  // Load cart from localStorage on mount and sync with server
  useEffect(() => {
    loadCartFromStorage()
    syncWithServer()
  }, [])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
      } catch (error) {
        console.error("Failed to save cart to localStorage:", error)
      }
    }
  }, [items, isLoaded])

  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      if (savedCart) {
        setItems(JSON.parse(savedCart))
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error)
    } finally {
      setIsLoaded(true)
    }
  }

  const syncWithServer = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/customer/cart')
      if (response.ok) {
        const data = await response.json()
        
        // Handle warning from server (e.g., database not available)
        if (data.warning) {
          console.warn("Cart service warning:", data.warning)
          // Don't set error for warnings, just log them
        }
        
        if (data.cart?.items) {
          // Convert server cart items to local format
          const serverItems: CartItem[] = data.cart.items.map((item: any) => ({
            product_id: item.product_id,
            stall_id: item.stall_id,
            quantity: item.quantity,
            product_title: item.product_title || 'Unknown Product',
            product_price_cents: item.unit_price_cents,
            stall_name: item.stall_name || 'Unknown Stall',
            scheduled_for: item.scheduled_for,
            special_instructions: item.special_instructions
          }))
          
          setItems(serverItems)
          setValidation(data.validation)
        } else {
          // Handle empty cart from server
          setItems([])
          setValidation(data.validation)
        }
      } else if (response.status === 503) {
        // Service unavailable - database issues
        const errorData = await response.json()
        console.warn("Cart service temporarily unavailable:", errorData.warning)
        // Keep local cart but don't show error to user
      } else if (response.status !== 401) {
        // Don't show error for unauthenticated users
        console.error("Failed to sync cart with server")
      }
    } catch (error) {
      console.error("Cart sync error:", error)
      // Don't set user-facing error for sync issues, keep local cart working
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (newItem: Omit<CartItem, 'quantity'>) => {
    try {
      setLoading(true)
      setError(null)

      // Optimistic update
      setItems(prevItems => {
        const existingItem = prevItems.find(item => 
          item.product_id === newItem.product_id && 
          item.stall_id === newItem.stall_id &&
          item.scheduled_for === newItem.scheduled_for
        )
        
        if (existingItem) {
          return prevItems.map(item =>
            item.product_id === newItem.product_id && 
            item.stall_id === newItem.stall_id &&
            item.scheduled_for === newItem.scheduled_for
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        } else {
          return [...prevItems, { ...newItem, quantity: 1 }]
        }
      })

      // Sync with server
      const response = await fetch('/api/customer/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: newItem.product_id,
          stall_id: newItem.stall_id,
          quantity: 1,
          scheduled_for: newItem.scheduled_for,
          special_instructions: newItem.special_instructions
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 503 && errorData.warning) {
          // Service unavailable - show user-friendly message
          setError('Cart service is temporarily unavailable. Your items are saved locally.')
          return // Don't sync with server, keep local changes
        }
        throw new Error(errorData.error || 'Failed to add item to cart')
      }

      // Refresh cart from server to ensure consistency
      await syncWithServer()
    } catch (error) {
      console.error("Add to cart error:", error)
      setError(error instanceof Error ? error.message : 'Failed to add item to cart')
      // Revert optimistic update on error
      await syncWithServer()
    } finally {
      setLoading(false)
    }
  }

  const removeItem = async (productId: string, stallId?: string, scheduledFor?: string) => {
    try {
      setLoading(true)
      setError(null)

      // Optimistic update
      setItems(prevItems => prevItems.filter(item => 
        !(item.product_id === productId && 
          (!stallId || item.stall_id === stallId) &&
          (!scheduledFor || item.scheduled_for === scheduledFor))
      ))

      // Sync with server
      const params = new URLSearchParams({
        product_id: productId,
        ...(stallId && { stall_id: stallId }),
        ...(scheduledFor && { scheduled_for: scheduledFor })
      })

      const response = await fetch(`/api/customer/cart?${params}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove item from cart')
      }

      // Refresh cart from server to ensure consistency
      await syncWithServer()
    } catch (error) {
      console.error("Remove from cart error:", error)
      setError(error instanceof Error ? error.message : 'Failed to remove item from cart')
      // Revert optimistic update on error
      await syncWithServer()
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (productId: string, quantity: number, stallId?: string, scheduledFor?: string) => {
    if (quantity <= 0) {
      await removeItem(productId, stallId, scheduledFor)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Optimistic update
      setItems(prevItems =>
        prevItems.map(item =>
          item.product_id === productId && 
          (!stallId || item.stall_id === stallId) &&
          (!scheduledFor || item.scheduled_for === scheduledFor)
            ? { ...item, quantity }
            : item
        )
      )

      // Sync with server
      const response = await fetch('/api/customer/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          stall_id: stallId,
          quantity,
          scheduled_for: scheduledFor
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update cart')
      }

      // Refresh cart from server to ensure consistency
      await syncWithServer()
    } catch (error) {
      console.error("Update cart error:", error)
      setError(error instanceof Error ? error.message : 'Failed to update cart')
      // Revert optimistic update on error
      await syncWithServer()
    } finally {
      setLoading(false)
    }
  }

  const clearCart = async () => {
    try {
      setLoading(true)
      setError(null)

      // Optimistic update
      setItems([])

      // Sync with server
      const response = await fetch('/api/customer/cart?clear_all=true', {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to clear cart')
      }

      // Refresh cart from server to ensure consistency
      await syncWithServer()
    } catch (error) {
      console.error("Clear cart error:", error)
      setError(error instanceof Error ? error.message : 'Failed to clear cart')
      // Revert optimistic update on error
      await syncWithServer()
    } finally {
      setLoading(false)
    }
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalValue = () => {
    return items.reduce((total, item) => total + (item.product_price_cents * item.quantity), 0)
  }

  const getItemQuantity = (productId: string) => {
    const item = items.find(item => item.product_id === productId)
    return item ? item.quantity : 0
  }

  const value: CartContextType = {
    items,
    loading,
    error,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalValue,
    getItemQuantity,
    syncWithServer,
    validation
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}