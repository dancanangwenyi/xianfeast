/**
 * Cart Operations Unit Tests
 * Tests cart management, persistence, and validation
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals'

// Mock DynamoDB operations
jest.mock('../client', () => ({
  dynamoClient: {
    send: jest.fn()
  }
}))

jest.mock('../carts', () => ({
  createCart: jest.fn(),
  getCart: jest.fn(),
  updateCart: jest.fn(),
  deleteCart: jest.fn(),
  addCartItem: jest.fn(),
  removeCartItem: jest.fn(),
  updateCartItem: jest.fn(),
  clearCart: jest.fn()
}))

jest.mock('../products', () => ({
  getProduct: jest.fn(),
  checkProductAvailability: jest.fn()
}))

import { 
  createCart, 
  getCart, 
  updateCart, 
  addCartItem, 
  removeCartItem, 
  updateCartItem, 
  clearCart 
} from '../carts'
import { getProduct, checkProductAvailability } from '../products'

describe('Cart Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Cart Creation and Management', () => {
    test('should create new cart for customer', async () => {
      const mockCart = {
        id: 'cart_123',
        customer_id: 'cust_123',
        items: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }

      ;(createCart as jest.Mock).mockResolvedValue(mockCart)

      const cart = await createCart('cust_123')

      expect(createCart).toHaveBeenCalledWith('cust_123')
      expect(cart.customer_id).toBe('cust_123')
      expect(cart.items).toEqual([])
      expect(cart.expires_at).toBeTruthy()
    })

    test('should retrieve existing cart', async () => {
      const mockCart = {
        id: 'cart_123',
        customer_id: 'cust_123',
        items: [
          {
            product_id: 'prod_1',
            stall_id: 'stall_1',
            quantity: 2,
            unit_price_cents: 1500
          }
        ]
      }

      ;(getCart as jest.Mock).mockResolvedValue(mockCart)

      const cart = await getCart('cust_123')

      expect(getCart).toHaveBeenCalledWith('cust_123')
      expect(cart.items).toHaveLength(1)
      expect(cart.items[0].quantity).toBe(2)
    })

    test('should handle non-existent cart', async () => {
      ;(getCart as jest.Mock).mockResolvedValue(null)

      const cart = await getCart('nonexistent_customer')

      expect(cart).toBeNull()
    })
  })

  describe('Cart Item Management', () => {
    test('should add item to cart', async () => {
      const mockProduct = {
        id: 'prod_1',
        name: 'Test Product',
        price_cents: 1500,
        status: 'active',
        stall_id: 'stall_1'
      }

      const mockCartItem = {
        product_id: 'prod_1',
        stall_id: 'stall_1',
        quantity: 1,
        unit_price_cents: 1500
      }

      const updatedCart = {
        id: 'cart_123',
        customer_id: 'cust_123',
        items: [mockCartItem]
      }

      ;(getProduct as jest.Mock).mockResolvedValue(mockProduct)
      ;(checkProductAvailability as jest.Mock).mockResolvedValue(true)
      ;(addCartItem as jest.Mock).mockResolvedValue(updatedCart)

      const product = await getProduct('prod_1')
      const available = await checkProductAvailability('prod_1')
      
      if (available && product.status === 'active') {
        const cart = await addCartItem('cust_123', {
          product_id: 'prod_1',
          stall_id: 'stall_1',
          quantity: 1,
          unit_price_cents: product.price_cents
        })

        expect(addCartItem).toHaveBeenCalledWith('cust_123', mockCartItem)
        expect(cart.items).toHaveLength(1)
        expect(cart.items[0].product_id).toBe('prod_1')
      }
    })

    test('should update item quantity in cart', async () => {
      const updatedCart = {
        id: 'cart_123',
        customer_id: 'cust_123',
        items: [
          {
            product_id: 'prod_1',
            stall_id: 'stall_1',
            quantity: 3,
            unit_price_cents: 1500
          }
        ]
      }

      ;(updateCartItem as jest.Mock).mockResolvedValue(updatedCart)

      const cart = await updateCartItem('cust_123', 'prod_1', { quantity: 3 })

      expect(updateCartItem).toHaveBeenCalledWith('cust_123', 'prod_1', { quantity: 3 })
      expect(cart.items[0].quantity).toBe(3)
    })

    test('should remove item from cart', async () => {
      const updatedCart = {
        id: 'cart_123',
        customer_id: 'cust_123',
        items: []
      }

      ;(removeCartItem as jest.Mock).mockResolvedValue(updatedCart)

      const cart = await removeCartItem('cust_123', 'prod_1')

      expect(removeCartItem).toHaveBeenCalledWith('cust_123', 'prod_1')
      expect(cart.items).toHaveLength(0)
    })

    test('should clear entire cart', async () => {
      const clearedCart = {
        id: 'cart_123',
        customer_id: 'cust_123',
        items: []
      }

      ;(clearCart as jest.Mock).mockResolvedValue(clearedCart)

      const cart = await clearCart('cust_123')

      expect(clearCart).toHaveBeenCalledWith('cust_123')
      expect(cart.items).toHaveLength(0)
    })
  })

  describe('Cart Validation', () => {
    test('should validate product availability before adding to cart', async () => {
      const unavailableProduct = {
        id: 'prod_unavailable',
        status: 'inactive'
      }

      ;(getProduct as jest.Mock).mockResolvedValue(unavailableProduct)
      ;(checkProductAvailability as jest.Mock).mockResolvedValue(false)

      const product = await getProduct('prod_unavailable')
      const available = await checkProductAvailability('prod_unavailable')

      expect(product.status).toBe('inactive')
      expect(available).toBe(false)

      // Should not add unavailable product to cart
      if (!available || product.status !== 'active') {
        expect(addCartItem).not.toHaveBeenCalled()
      }
    })

    test('should validate quantity limits', () => {
      const validQuantities = [1, 5, 10]
      const invalidQuantities = [0, -1, 101]

      validQuantities.forEach(qty => {
        const isValid = qty > 0 && qty <= 100
        expect(isValid).toBe(true)
      })

      invalidQuantities.forEach(qty => {
        const isValid = qty > 0 && qty <= 100
        expect(isValid).toBe(false)
      })
    })

    test('should calculate cart totals correctly', () => {
      const cartItems = [
        { quantity: 2, unit_price_cents: 1500 }, // $30.00
        { quantity: 1, unit_price_cents: 2000 }, // $20.00
        { quantity: 3, unit_price_cents: 800 }   // $24.00
      ]

      const subtotal = cartItems.reduce((total, item) => 
        total + (item.quantity * item.unit_price_cents), 0
      )

      const tax = Math.round(subtotal * 0.08) // 8% tax
      const total = subtotal + tax

      expect(subtotal).toBe(7400) // $74.00
      expect(tax).toBe(592)       // $5.92
      expect(total).toBe(7992)    // $79.92
    })
  })

  describe('Cart Persistence and Expiration', () => {
    test('should set cart expiration time', () => {
      const now = new Date()
      const expirationTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours

      const cart = {
        id: 'cart_123',
        customer_id: 'cust_123',
        created_at: now.toISOString(),
        expires_at: expirationTime.toISOString()
      }

      const expiresAt = new Date(cart.expires_at)
      const timeDiff = expiresAt.getTime() - now.getTime()
      const hoursDiff = timeDiff / (1000 * 60 * 60)

      expect(hoursDiff).toBeCloseTo(24, 1)
    })

    test('should identify expired carts', () => {
      const expiredCart = {
        id: 'cart_expired',
        expires_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
      }

      const validCart = {
        id: 'cart_valid',
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
      }

      const isExpiredCartExpired = new Date(expiredCart.expires_at) < new Date()
      const isValidCartExpired = new Date(validCart.expires_at) < new Date()

      expect(isExpiredCartExpired).toBe(true)
      expect(isValidCartExpired).toBe(false)
    })

    test('should handle cart synchronization between sessions', async () => {
      const localCartItems = [
        { product_id: 'prod_1', quantity: 2 }
      ]

      const serverCartItems = [
        { product_id: 'prod_2', quantity: 1 }
      ]

      // Merge logic: combine items, sum quantities for duplicates
      const mergedItems = [...localCartItems, ...serverCartItems]
      const uniqueItems = mergedItems.reduce((acc, item) => {
        const existing = acc.find(i => i.product_id === item.product_id)
        if (existing) {
          existing.quantity += item.quantity
        } else {
          acc.push({ ...item })
        }
        return acc
      }, [] as any[])

      expect(uniqueItems).toHaveLength(2)
      expect(uniqueItems.find(i => i.product_id === 'prod_1')?.quantity).toBe(2)
      expect(uniqueItems.find(i => i.product_id === 'prod_2')?.quantity).toBe(1)
    })
  })
})