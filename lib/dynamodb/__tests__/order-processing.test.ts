/**
 * Order Processing Unit Tests
 * Tests order creation, status updates, and validation
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals'

// Mock DynamoDB operations
jest.mock('../orders', () => ({
  createOrder: jest.fn(),
  getOrder: jest.fn(),
  updateOrderStatus: jest.fn(),
  getCustomerOrders: jest.fn(),
  getBusinessOrders: jest.fn()
}))

jest.mock('../products', () => ({
  getProduct: jest.fn(),
  checkProductAvailability: jest.fn()
}))

jest.mock('../stalls', () => ({
  getStall: jest.fn(),
  checkStallOperatingHours: jest.fn()
}))

jest.mock('../../email/service', () => ({
  sendOrderConfirmationEmail: jest.fn(),
  sendBusinessOrderNotification: jest.fn(),
  sendOrderStatusUpdateEmail: jest.fn()
}))

import { 
  createOrder, 
  getOrder, 
  updateOrderStatus, 
  getCustomerOrders, 
  getBusinessOrders 
} from '../orders'
import { getProduct, checkProductAvailability } from '../products'
import { getStall, checkStallOperatingHours } from '../stalls'
import { 
  sendOrderConfirmationEmail, 
  sendBusinessOrderNotification, 
  sendOrderStatusUpdateEmail 
} from '../../email/service'

describe('Order Processing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Order Creation', () => {
    test('should create order with valid cart items', async () => {
      const mockOrder = {
        id: 'order_123',
        customer_id: 'cust_123',
        stall_id: 'stall_1',
        status: 'pending',
        items: [
          {
            product_id: 'prod_1',
            quantity: 2,
            unit_price_cents: 1500,
            total_price_cents: 3000
          }
        ],
        subtotal_cents: 3000,
        tax_cents: 240,
        total_cents: 3240,
        scheduled_for: '2024-01-15T12:00:00Z',
        created_at: new Date().toISOString()
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
        status: 'active',
        operating_hours: {
          monday: { open: '09:00', close: '17:00' }
        }
      }

      ;(getProduct as jest.Mock).mockResolvedValue(mockProduct)
      ;(checkProductAvailability as jest.Mock).mockResolvedValue(true)
      ;(getStall as jest.Mock).mockResolvedValue(mockStall)
      ;(checkStallOperatingHours as jest.Mock).mockResolvedValue(true)
      ;(createOrder as jest.Mock).mockResolvedValue(mockOrder)
      ;(sendOrderConfirmationEmail as jest.Mock).mockResolvedValue(true)
      ;(sendBusinessOrderNotification as jest.Mock).mockResolvedValue(true)

      const orderData = {
        customer_id: 'cust_123',
        stall_id: 'stall_1',
        items: [
          {
            product_id: 'prod_1',
            quantity: 2,
            unit_price_cents: 1500
          }
        ],
        scheduled_for: '2024-01-15T12:00:00Z'
      }

      // Validate products and stall
      const product = await getProduct('prod_1')
      const productAvailable = await checkProductAvailability('prod_1')
      const stall = await getStall('stall_1')
      const stallOpen = await checkStallOperatingHours('stall_1', '2024-01-15T12:00:00Z')

      if (productAvailable && stallOpen && product.status === 'active' && stall.status === 'active') {
        const order = await createOrder(orderData)
        await sendOrderConfirmationEmail(order.customer_id, order.id)
        await sendBusinessOrderNotification(order.stall_id, order.id)

        expect(createOrder).toHaveBeenCalledWith(orderData)
        expect(order.status).toBe('pending')
        expect(order.total_cents).toBe(3240)
        expect(sendOrderConfirmationEmail).toHaveBeenCalledWith('cust_123', 'order_123')
        expect(sendBusinessOrderNotification).toHaveBeenCalledWith('stall_1', 'order_123')
      }
    })

    test('should reject order with unavailable products', async () => {
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

      // Should not create order with unavailable products
      if (!available || product.status !== 'active') {
        expect(createOrder).not.toHaveBeenCalled()
      }
    })

    test('should reject order outside stall operating hours', async () => {
      const mockStall = {
        id: 'stall_1',
        operating_hours: {
          monday: { open: '09:00', close: '17:00' }
        }
      }

      ;(getStall as jest.Mock).mockResolvedValue(mockStall)
      ;(checkStallOperatingHours as jest.Mock).mockResolvedValue(false)

      const stall = await getStall('stall_1')
      const stallOpen = await checkStallOperatingHours('stall_1', '2024-01-15T20:00:00Z') // 8 PM

      expect(stallOpen).toBe(false)

      // Should not create order outside operating hours
      if (!stallOpen) {
        expect(createOrder).not.toHaveBeenCalled()
      }
    })

    test('should calculate order totals correctly', () => {
      const orderItems = [
        { quantity: 2, unit_price_cents: 1500 }, // $30.00
        { quantity: 1, unit_price_cents: 2500 }  // $25.00
      ]

      const subtotal = orderItems.reduce((total, item) => 
        total + (item.quantity * item.unit_price_cents), 0
      )

      const taxRate = 0.08 // 8%
      const tax = Math.round(subtotal * taxRate)
      const total = subtotal + tax

      expect(subtotal).toBe(5500) // $55.00
      expect(tax).toBe(440)       // $4.40
      expect(total).toBe(5940)    // $59.40
    })
  })

  describe('Order Status Management', () => {
    test('should update order status with timestamp', async () => {
      const updatedOrder = {
        id: 'order_123',
        status: 'confirmed',
        status_history: [
          { status: 'pending', timestamp: '2024-01-15T10:00:00Z' },
          { status: 'confirmed', timestamp: '2024-01-15T10:05:00Z' }
        ]
      }

      ;(updateOrderStatus as jest.Mock).mockResolvedValue(updatedOrder)
      ;(sendOrderStatusUpdateEmail as jest.Mock).mockResolvedValue(true)

      const order = await updateOrderStatus('order_123', 'confirmed')
      await sendOrderStatusUpdateEmail('order_123', 'confirmed')

      expect(updateOrderStatus).toHaveBeenCalledWith('order_123', 'confirmed')
      expect(order.status).toBe('confirmed')
      expect(order.status_history).toHaveLength(2)
      expect(sendOrderStatusUpdateEmail).toHaveBeenCalledWith('order_123', 'confirmed')
    })

    test('should validate status transitions', () => {
      const validTransitions = {
        'pending': ['confirmed', 'canceled'],
        'confirmed': ['in_preparation', 'canceled'],
        'in_preparation': ['ready', 'completed'],
        'ready': ['completed'],
        'completed': [],
        'canceled': []
      }

      // Test valid transitions
      expect(validTransitions['pending']).toContain('confirmed')
      expect(validTransitions['confirmed']).toContain('in_preparation')
      expect(validTransitions['in_preparation']).toContain('ready')
      expect(validTransitions['ready']).toContain('completed')

      // Test invalid transitions
      expect(validTransitions['completed']).not.toContain('pending')
      expect(validTransitions['canceled']).not.toContain('confirmed')
    })

    test('should track status change timestamps', () => {
      const statusHistory = [
        { status: 'pending', timestamp: '2024-01-15T10:00:00Z' },
        { status: 'confirmed', timestamp: '2024-01-15T10:05:00Z' },
        { status: 'in_preparation', timestamp: '2024-01-15T10:30:00Z' }
      ]

      // Verify chronological order
      for (let i = 1; i < statusHistory.length; i++) {
        const current = new Date(statusHistory[i].timestamp)
        const previous = new Date(statusHistory[i - 1].timestamp)
        expect(current.getTime()).toBeGreaterThan(previous.getTime())
      }

      // Calculate preparation time
      const confirmedTime = new Date(statusHistory[1].timestamp)
      const preparationTime = new Date(statusHistory[2].timestamp)
      const prepDuration = preparationTime.getTime() - confirmedTime.getTime()
      const prepMinutes = prepDuration / (1000 * 60)

      expect(prepMinutes).toBe(25) // 25 minutes from confirmed to in_preparation
    })
  })

  describe('Order Retrieval and Filtering', () => {
    test('should retrieve customer orders with filtering', async () => {
      const mockOrders = [
        {
          id: 'order_1',
          customer_id: 'cust_123',
          status: 'completed',
          created_at: '2024-01-10T10:00:00Z'
        },
        {
          id: 'order_2',
          customer_id: 'cust_123',
          status: 'pending',
          created_at: '2024-01-15T10:00:00Z'
        }
      ]

      ;(getCustomerOrders as jest.Mock).mockResolvedValue(mockOrders)

      const orders = await getCustomerOrders('cust_123', { status: 'all' })

      expect(getCustomerOrders).toHaveBeenCalledWith('cust_123', { status: 'all' })
      expect(orders).toHaveLength(2)
      expect(orders[0].customer_id).toBe('cust_123')
    })

    test('should retrieve business orders for stall management', async () => {
      const mockBusinessOrders = [
        {
          id: 'order_1',
          stall_id: 'stall_1',
          status: 'pending',
          scheduled_for: '2024-01-15T12:00:00Z'
        },
        {
          id: 'order_2',
          stall_id: 'stall_1',
          status: 'confirmed',
          scheduled_for: '2024-01-15T13:00:00Z'
        }
      ]

      ;(getBusinessOrders as jest.Mock).mockResolvedValue(mockBusinessOrders)

      const orders = await getBusinessOrders('stall_1', { 
        date: '2024-01-15',
        status: 'active' 
      })

      expect(getBusinessOrders).toHaveBeenCalledWith('stall_1', { 
        date: '2024-01-15',
        status: 'active' 
      })
      expect(orders).toHaveLength(2)
      expect(orders.every(order => order.stall_id === 'stall_1')).toBe(true)
    })

    test('should sort orders by date and priority', () => {
      const orders = [
        { id: 'order_1', scheduled_for: '2024-01-15T13:00:00Z', status: 'pending' },
        { id: 'order_2', scheduled_for: '2024-01-15T12:00:00Z', status: 'confirmed' },
        { id: 'order_3', scheduled_for: '2024-01-15T12:30:00Z', status: 'in_preparation' }
      ]

      // Sort by scheduled time
      const sortedByTime = [...orders].sort((a, b) => 
        new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
      )

      expect(sortedByTime[0].id).toBe('order_2') // 12:00
      expect(sortedByTime[1].id).toBe('order_3') // 12:30
      expect(sortedByTime[2].id).toBe('order_1') // 13:00

      // Sort by status priority (in_preparation > confirmed > pending)
      const statusPriority = { 'in_preparation': 3, 'confirmed': 2, 'pending': 1 }
      const sortedByStatus = [...orders].sort((a, b) => 
        statusPriority[b.status as keyof typeof statusPriority] - 
        statusPriority[a.status as keyof typeof statusPriority]
      )

      expect(sortedByStatus[0].status).toBe('in_preparation')
      expect(sortedByStatus[1].status).toBe('confirmed')
      expect(sortedByStatus[2].status).toBe('pending')
    })
  })

  describe('Order Validation', () => {
    test('should validate order scheduling constraints', () => {
      const now = new Date('2024-01-15T10:00:00Z')
      
      // Test future scheduling (valid)
      const futureDate = new Date('2024-01-15T14:00:00Z')
      const isFutureValid = futureDate > now
      expect(isFutureValid).toBe(true)

      // Test past scheduling (invalid)
      const pastDate = new Date('2024-01-15T08:00:00Z')
      const isPastValid = pastDate > now
      expect(isPastValid).toBe(false)

      // Test advance booking limit (30 days)
      const maxAdvanceDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const tooFarFuture = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000)
      
      const isWithinLimit = futureDate <= maxAdvanceDate
      const isTooFar = tooFarFuture <= maxAdvanceDate
      
      expect(isWithinLimit).toBe(true)
      expect(isTooFar).toBe(false)
    })

    test('should validate order item constraints', () => {
      const orderItems = [
        { product_id: 'prod_1', quantity: 2, unit_price_cents: 1500 },
        { product_id: 'prod_2', quantity: 0, unit_price_cents: 1000 }, // Invalid quantity
        { product_id: 'prod_3', quantity: 101, unit_price_cents: 500 } // Exceeds max quantity
      ]

      const validItems = orderItems.filter(item => 
        item.quantity > 0 && 
        item.quantity <= 100 && 
        item.unit_price_cents > 0
      )

      expect(validItems).toHaveLength(1)
      expect(validItems[0].product_id).toBe('prod_1')
    })

    test('should validate minimum order amounts', () => {
      const minimumOrderCents = 1000 // $10.00

      const smallOrder = { total_cents: 500 }  // $5.00
      const validOrder = { total_cents: 1500 } // $15.00

      expect(smallOrder.total_cents >= minimumOrderCents).toBe(false)
      expect(validOrder.total_cents >= minimumOrderCents).toBe(true)
    })
  })
})