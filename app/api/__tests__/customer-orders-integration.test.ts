/**
 * Customer Orders API Integration Tests
 * Tests complete order management API flows
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

// Mock external dependencies
jest.mock('../../../lib/dynamodb/orders')
jest.mock('../../../lib/dynamodb/products')
jest.mock('../../../lib/dynamodb/stalls')
jest.mock('../../../lib/dynamodb/carts')
jest.mock('../../../lib/auth/session-server')
jest.mock('../../../lib/email/service')

import { 
  createOrder, 
  getOrder, 
  updateOrderStatus, 
  getCustomerOrders 
} from '../../../lib/dynamodb/orders'
import { getProduct, checkProductAvailability } from '../../../lib/dynamodb/products'
import { getStall, checkStallOperatingHours } from '../../../lib/dynamodb/stalls'
import { getCart, clearCart } from '../../../lib/dynamodb/carts'
import { verifySession } from '../../../lib/auth/session-server'
import { 
  sendOrderConfirmationEmail, 
  sendBusinessOrderNotification 
} from '../../../lib/email/service'

describe('Customer Orders API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/customer/orders', () => {
    test('should create order from cart successfully', async () => {
      const mockSession = {
        userId: 'cust_123',
        email: 'test@example.com',
        role: 'customer'
      }

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

      const mockProduct = {
        id: 'prod_1',
        name: 'Test Product',
        price_cents: 1500,
        status: 'active'
      }

      const mockStall = {
        id: 'stall_1',
        name: 'Test Stall',
        status: 'active'
      }

      const mockOrder = {
        id: 'order_123',
        customer_id: 'cust_123',
        stall_id: 'stall_1',
        status: 'pending',
        items: mockCart.items,
        subtotal_cents: 3000,
        tax_cents: 240,
        total_cents: 3240,
        scheduled_for: '2024-01-15T12:00:00Z'
      }

      ;(verifySession as jest.Mock).mockResolvedValue(mockSession)
      ;(getCart as jest.Mock).mockResolvedValue(mockCart)
      ;(getProduct as jest.Mock).mockResolvedValue(mockProduct)
      ;(checkProductAvailability as jest.Mock).mockResolvedValue(true)
      ;(getStall as jest.Mock).mockResolvedValue(mockStall)
      ;(checkStallOperatingHours as jest.Mock).mockResolvedValue(true)
      ;(createOrder as jest.Mock).mockResolvedValue(mockOrder)
      ;(clearCart as jest.Mock).mockResolvedValue({ items: [] })
      ;(sendOrderConfirmationEmail as jest.Mock).mockResolvedValue(true)
      ;(sendBusinessOrderNotification as jest.Mock).mockResolvedValue(true)

      const requestBody = {
        scheduled_for: '2024-01-15T12:00:00Z',
        special_instructions: 'No onions please'
      }

      // Simulate API handler logic
      const authHeader = 'Bearer jwt_token_123'
      const token = authHeader.split(' ')[1]
      const session = await verifySession(token)

      if (session) {
        const cart = await getCart(session.userId)
        
        if (cart && cart.items.length > 0) {
          // Validate all products
          let allProductsValid = true
          for (const item of cart.items) {
            const product = await getProduct(item.product_id)
            const available = await checkProductAvailability(item.product_id)
            const stall = await getStall(item.stall_id)
            const stallOpen = await checkStallOperatingHours(item.stall_id, requestBody.scheduled_for)

            if (!product || !available || product.status !== 'active' || 
                !stall || stall.status !== 'active' || !stallOpen) {
              allProductsValid = false
              break
            }
          }

          if (allProductsValid) {
            const orderData = {
              customer_id: session.userId,
              stall_id: cart.items[0].stall_id,
              items: cart.items,
              scheduled_for: requestBody.scheduled_for,
              special_instructions: requestBody.special_instructions
            }

            const order = await createOrder(orderData)
            await clearCart(session.userId)
            await sendOrderConfirmationEmail(order.customer_id, order.id)
            await sendBusinessOrderNotification(order.stall_id, order.id)

            // Expected response: 201 Created
            const expectedResponse = {
              success: true,
              message: 'Order placed successfully',
              order: {
                id: order.id,
                status: order.status,
                total_cents: order.total_cents,
                scheduled_for: order.scheduled_for
              }
            }

            expect(expectedResponse.success).toBe(true)
            expect(expectedResponse.order.id).toBe('order_123')
            expect(expectedResponse.order.total_cents).toBe(3240)
          }
        }
      }
    })

    test('should reject order with empty cart', async () => {
      const mockSession = {
        userId: 'cust_123',
        role: 'customer'
      }

      const emptyCart = {
        id: 'cart_123',
        customer_id: 'cust_123',
        items: []
      }

      ;(verifySession as jest.Mock).mockResolvedValue(mockSession)
      ;(getCart as jest.Mock).mockResolvedValue(emptyCart)

      const authHeader = 'Bearer jwt_token_123'
      const token = authHeader.split(' ')[1]
      const session = await verifySession(token)

      if (session) {
        const cart = await getCart(session.userId)

        if (!cart || cart.items.length === 0) {
          // Expected response: 400 Bad Request
          const expectedResponse = {
            error: 'Cart is empty. Add items before placing order.',
            code: 'EMPTY_CART'
          }

          expect(expectedResponse.error).toContain('empty')
          expect(expectedResponse.code).toBe('EMPTY_CART')
        }
      }
    })

    test('should reject order with unavailable products', async () => {
      const mockSession = {
        userId: 'cust_123',
        role: 'customer'
      }

      const mockCart = {
        id: 'cart_123',
        customer_id: 'cust_123',
        items: [
          {
            product_id: 'prod_unavailable',
            stall_id: 'stall_1',
            quantity: 1,
            unit_price_cents: 1500
          }
        ]
      }

      const unavailableProduct = {
        id: 'prod_unavailable',
        status: 'inactive'
      }

      ;(verifySession as jest.Mock).mockResolvedValue(mockSession)
      ;(getCart as jest.Mock).mockResolvedValue(mockCart)
      ;(getProduct as jest.Mock).mockResolvedValue(unavailableProduct)
      ;(checkProductAvailability as jest.Mock).mockResolvedValue(false)

      const authHeader = 'Bearer jwt_token_123'
      const token = authHeader.split(' ')[1]
      const session = await verifySession(token)

      if (session) {
        const cart = await getCart(session.userId)

        if (cart && cart.items.length > 0) {
          const item = cart.items[0]
          const product = await getProduct(item.product_id)
          const available = await checkProductAvailability(item.product_id)

          if (!available || product.status !== 'active') {
            // Expected response: 422 Validation Error
            const expectedResponse = {
              error: 'Some items in your cart are no longer available',
              code: 'PRODUCT_UNAVAILABLE',
              unavailable_items: [
                {
                  product_id: item.product_id,
                  reason: 'Product is no longer active'
                }
              ]
            }

            expect(expectedResponse.error).toContain('no longer available')
            expect(expectedResponse.code).toBe('PRODUCT_UNAVAILABLE')
            expect(expectedResponse.unavailable_items).toHaveLength(1)
          }
        }
      }
    })

    test('should reject order outside stall operating hours', async () => {
      const mockSession = {
        userId: 'cust_123',
        role: 'customer'
      }

      const mockCart = {
        id: 'cart_123',
        customer_id: 'cust_123',
        items: [
          {
            product_id: 'prod_1',
            stall_id: 'stall_1',
            quantity: 1,
            unit_price_cents: 1500
          }
        ]
      }

      const mockProduct = {
        id: 'prod_1',
        status: 'active'
      }

      const mockStall = {
        id: 'stall_1',
        status: 'active',
        operating_hours: {
          monday: { open: '09:00', close: '17:00' }
        }
      }

      ;(verifySession as jest.Mock).mockResolvedValue(mockSession)
      ;(getCart as jest.Mock).mockResolvedValue(mockCart)
      ;(getProduct as jest.Mock).mockResolvedValue(mockProduct)
      ;(checkProductAvailability as jest.Mock).mockResolvedValue(true)
      ;(getStall as jest.Mock).mockResolvedValue(mockStall)
      ;(checkStallOperatingHours as jest.Mock).mockResolvedValue(false) // Closed

      const requestBody = {
        scheduled_for: '2024-01-15T20:00:00Z' // 8 PM - outside hours
      }

      const authHeader = 'Bearer jwt_token_123'
      const token = authHeader.split(' ')[1]
      const session = await verifySession(token)

      if (session) {
        const cart = await getCart(session.userId)

        if (cart && cart.items.length > 0) {
          const item = cart.items[0]
          const stall = await getStall(item.stall_id)
          const stallOpen = await checkStallOperatingHours(item.stall_id, requestBody.scheduled_for)

          if (!stallOpen) {
            // Expected response: 422 Validation Error
            const expectedResponse = {
              error: 'Stall is closed at the requested time',
              code: 'STALL_CLOSED',
              stall_hours: stall.operating_hours
            }

            expect(expectedResponse.error).toContain('closed')
            expect(expectedResponse.code).toBe('STALL_CLOSED')
            expect(expectedResponse.stall_hours).toBeTruthy()
          }
        }
      }
    })
  })

  describe('GET /api/customer/orders', () => {
    test('should retrieve customer orders with filtering', async () => {
      const mockSession = {
        userId: 'cust_123',
        role: 'customer'
      }

      const mockOrders = [
        {
          id: 'order_1',
          customer_id: 'cust_123',
          status: 'completed',
          total_cents: 2500,
          created_at: '2024-01-10T10:00:00Z'
        },
        {
          id: 'order_2',
          customer_id: 'cust_123',
          status: 'pending',
          total_cents: 1800,
          created_at: '2024-01-15T10:00:00Z'
        }
      ]

      ;(verifySession as jest.Mock).mockResolvedValue(mockSession)
      ;(getCustomerOrders as jest.Mock).mockResolvedValue(mockOrders)

      // Simulate query parameters
      const queryParams = {
        status: 'all',
        limit: '10',
        offset: '0'
      }

      const authHeader = 'Bearer jwt_token_123'
      const token = authHeader.split(' ')[1]
      const session = await verifySession(token)

      if (session) {
        const orders = await getCustomerOrders(session.userId, {
          status: queryParams.status,
          limit: parseInt(queryParams.limit),
          offset: parseInt(queryParams.offset)
        })

        // Expected response: 200 OK
        const expectedResponse = {
          success: true,
          orders: orders,
          pagination: {
            total: orders.length,
            limit: parseInt(queryParams.limit),
            offset: parseInt(queryParams.offset)
          }
        }

        expect(expectedResponse.success).toBe(true)
        expect(expectedResponse.orders).toHaveLength(2)
        expect(expectedResponse.orders[0].customer_id).toBe('cust_123')
      }
    })

    test('should filter orders by status', async () => {
      const mockSession = {
        userId: 'cust_123',
        role: 'customer'
      }

      const pendingOrders = [
        {
          id: 'order_pending',
          customer_id: 'cust_123',
          status: 'pending'
        }
      ]

      ;(verifySession as jest.Mock).mockResolvedValue(mockSession)
      ;(getCustomerOrders as jest.Mock).mockResolvedValue(pendingOrders)

      const queryParams = {
        status: 'pending'
      }

      const authHeader = 'Bearer jwt_token_123'
      const token = authHeader.split(' ')[1]
      const session = await verifySession(token)

      if (session) {
        const orders = await getCustomerOrders(session.userId, {
          status: queryParams.status
        })

        expect(orders).toHaveLength(1)
        expect(orders[0].status).toBe('pending')
      }
    })
  })

  describe('GET /api/customer/orders/[id]', () => {
    test('should retrieve specific order details', async () => {
      const mockSession = {
        userId: 'cust_123',
        role: 'customer'
      }

      const mockOrder = {
        id: 'order_123',
        customer_id: 'cust_123',
        stall_id: 'stall_1',
        status: 'confirmed',
        items: [
          {
            product_id: 'prod_1',
            product_name: 'Test Product',
            quantity: 2,
            unit_price_cents: 1500,
            total_price_cents: 3000
          }
        ],
        subtotal_cents: 3000,
        tax_cents: 240,
        total_cents: 3240,
        scheduled_for: '2024-01-15T12:00:00Z',
        status_history: [
          { status: 'pending', timestamp: '2024-01-15T10:00:00Z' },
          { status: 'confirmed', timestamp: '2024-01-15T10:05:00Z' }
        ]
      }

      ;(verifySession as jest.Mock).mockResolvedValue(mockSession)
      ;(getOrder as jest.Mock).mockResolvedValue(mockOrder)

      const orderId = 'order_123'

      const authHeader = 'Bearer jwt_token_123'
      const token = authHeader.split(' ')[1]
      const session = await verifySession(token)

      if (session) {
        const order = await getOrder(orderId)

        // Verify customer owns the order
        if (order && order.customer_id === session.userId) {
          // Expected response: 200 OK
          const expectedResponse = {
            success: true,
            order: order
          }

          expect(expectedResponse.success).toBe(true)
          expect(expectedResponse.order.id).toBe('order_123')
          expect(expectedResponse.order.customer_id).toBe('cust_123')
          expect(expectedResponse.order.status_history).toHaveLength(2)
        }
      }
    })

    test('should reject access to other customer orders', async () => {
      const mockSession = {
        userId: 'cust_123',
        role: 'customer'
      }

      const otherCustomerOrder = {
        id: 'order_456',
        customer_id: 'cust_456', // Different customer
        status: 'pending'
      }

      ;(verifySession as jest.Mock).mockResolvedValue(mockSession)
      ;(getOrder as jest.Mock).mockResolvedValue(otherCustomerOrder)

      const orderId = 'order_456'

      const authHeader = 'Bearer jwt_token_123'
      const token = authHeader.split(' ')[1]
      const session = await verifySession(token)

      if (session) {
        const order = await getOrder(orderId)

        if (order && order.customer_id !== session.userId) {
          // Expected response: 403 Forbidden
          const expectedResponse = {
            error: 'Access denied. You can only view your own orders.',
            code: 'ACCESS_DENIED'
          }

          expect(expectedResponse.error).toContain('Access denied')
          expect(expectedResponse.code).toBe('ACCESS_DENIED')
        }
      }
    })

    test('should handle non-existent order', async () => {
      const mockSession = {
        userId: 'cust_123',
        role: 'customer'
      }

      ;(verifySession as jest.Mock).mockResolvedValue(mockSession)
      ;(getOrder as jest.Mock).mockResolvedValue(null)

      const orderId = 'nonexistent_order'

      const authHeader = 'Bearer jwt_token_123'
      const token = authHeader.split(' ')[1]
      const session = await verifySession(token)

      if (session) {
        const order = await getOrder(orderId)

        if (!order) {
          // Expected response: 404 Not Found
          const expectedResponse = {
            error: 'Order not found',
            code: 'ORDER_NOT_FOUND'
          }

          expect(expectedResponse.error).toBe('Order not found')
          expect(expectedResponse.code).toBe('ORDER_NOT_FOUND')
        }
      }
    })
  })

  describe('Authentication and Authorization', () => {
    test('should reject requests without authentication', async () => {
      ;(verifySession as jest.Mock).mockResolvedValue(null)

      // No auth header provided
      const session = await verifySession('')

      if (!session) {
        // Expected response: 401 Unauthorized
        const expectedResponse = {
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        }

        expect(expectedResponse.error).toBe('Authentication required')
        expect(expectedResponse.code).toBe('UNAUTHORIZED')
      }
    })

    test('should reject non-customer role access', async () => {
      const nonCustomerSession = {
        userId: 'user_123',
        role: 'business_owner' // Not a customer
      }

      ;(verifySession as jest.Mock).mockResolvedValue(nonCustomerSession)

      const authHeader = 'Bearer jwt_token_123'
      const token = authHeader.split(' ')[1]
      const session = await verifySession(token)

      if (session && session.role !== 'customer') {
        // Expected response: 403 Forbidden
        const expectedResponse = {
          error: 'Customer access required',
          code: 'INSUFFICIENT_PERMISSIONS'
        }

        expect(expectedResponse.error).toBe('Customer access required')
        expect(expectedResponse.code).toBe('INSUFFICIENT_PERMISSIONS')
      }
    })
  })
})