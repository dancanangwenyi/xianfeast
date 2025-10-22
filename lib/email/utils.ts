/**
 * Email utility functions for order-related notifications
 */

import { 
  emailService,
  CustomerOrderConfirmationOptions,
  CustomerOrderStatusUpdateOptions,
  BusinessOwnerOrderNotificationOptions
} from './service'
import { getOrderById, getOrderItems, Order, OrderItem } from '../dynamodb/orders'
import { getProductById } from '../dynamodb/products'
import { getStallById } from '../dynamodb/stalls'
import { getBusinessById } from '../dynamodb/businesses'
import { getUserById } from '../dynamodb/users'

export interface OrderEmailData {
  order: Order
  items: OrderItem[]
  stall: any
  business: any
  customer: any
  businessOwner?: any
}

/**
 * Fetch complete order data for email notifications
 */
export async function fetchOrderEmailData(orderId: string): Promise<OrderEmailData | null> {
  try {
    // Get order with items
    const order = await getOrderById(orderId)
    if (!order) {
      console.error(`[EMAIL UTILS] Order not found: ${orderId}`)
      return null
    }

    const items = await getOrderItems(orderId)
    
    // Get stall information
    const stall = await getStallById(order.stall_id)
    if (!stall) {
      console.error(`[EMAIL UTILS] Stall not found: ${order.stall_id}`)
      return null
    }

    // Get business information
    const business = await getBusinessById(order.business_id)
    if (!business) {
      console.error(`[EMAIL UTILS] Business not found: ${order.business_id}`)
      return null
    }

    // Get customer information
    const customer = await getUserById(order.customer_user_id)
    if (!customer) {
      console.error(`[EMAIL UTILS] Customer not found: ${order.customer_user_id}`)
      return null
    }

    // Get business owner information
    let businessOwner = null
    if (business.owner_user_id) {
      businessOwner = await getUserById(business.owner_user_id)
    }

    return {
      order,
      items,
      stall,
      business,
      customer,
      businessOwner
    }
  } catch (error) {
    console.error('[EMAIL UTILS] Error fetching order email data:', error)
    return null
  }
}

/**
 * Format order items for email display
 */
export async function formatOrderItemsForEmail(items: OrderItem[]): Promise<Array<{
  quantity: number
  productName: string
  price: string
}>> {
  const formattedItems = []

  for (const item of items) {
    try {
      const product = await getProductById(item.product_id)
      const productName = product ? product.title : `Product ${item.product_id}`
      const price = formatCurrency(item.total_price_cents, 'USD')

      formattedItems.push({
        quantity: item.qty,
        productName,
        price
      })
    } catch (error) {
      console.error(`[EMAIL UTILS] Error formatting item ${item.id}:`, error)
      // Add fallback item
      formattedItems.push({
        quantity: item.qty,
        productName: `Product ${item.product_id}`,
        price: formatCurrency(item.total_price_cents, 'USD')
      })
    }
  }

  return formattedItems
}

/**
 * Format currency for display
 */
export function formatCurrency(cents: number, currency: string = 'USD'): string {
  const amount = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

/**
 * Format date for email display
 */
export function formatDateForEmail(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    console.error('[EMAIL UTILS] Error formatting date:', error)
    return dateString
  }
}

/**
 * Format time for email display
 */
export function formatTimeForEmail(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } catch (error) {
    console.error('[EMAIL UTILS] Error formatting time:', error)
    return dateString
  }
}

/**
 * Generate order tracking URL
 */
export function generateOrderTrackingUrl(orderId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/customer/orders/${orderId}`
}

/**
 * Generate order management URL for business owners
 */
export function generateOrderManagementUrl(orderId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/business/dashboard/orders/${orderId}`
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationToCustomer(orderId: string): Promise<string | null> {
  try {
    const orderData = await fetchOrderEmailData(orderId)
    if (!orderData) {
      console.error('[EMAIL UTILS] Could not fetch order data for confirmation email')
      return null
    }

    const { order, items, stall, customer } = orderData
    const formattedItems = await formatOrderItemsForEmail(items)

    const emailOptions: CustomerOrderConfirmationOptions = {
      to: customer.email,
      customerName: customer.name,
      orderNumber: order.id,
      stallName: stall.name,
      scheduledDate: formatDateForEmail(order.scheduled_for),
      scheduledTime: formatTimeForEmail(order.scheduled_for),
      items: formattedItems,
      totalAmount: formatCurrency(order.total_cents, order.currency),
      orderTrackingUrl: generateOrderTrackingUrl(order.id)
    }

    const emailId = await emailService.sendCustomerOrderConfirmation(emailOptions)
    console.log(`✅ [EMAIL UTILS] Order confirmation sent to customer: ${customer.email}`)
    return emailId
  } catch (error) {
    console.error('[EMAIL UTILS] Error sending order confirmation to customer:', error)
    throw error
  }
}

/**
 * Send order status update email to customer
 */
export async function sendOrderStatusUpdateToCustomer(
  orderId: string, 
  oldStatus: string, 
  newStatus: string, 
  statusMessage?: string,
  estimatedReadyTime?: string
): Promise<string | null> {
  try {
    const orderData = await fetchOrderEmailData(orderId)
    if (!orderData) {
      console.error('[EMAIL UTILS] Could not fetch order data for status update email')
      return null
    }

    const { order, stall, customer } = orderData

    const emailOptions: CustomerOrderStatusUpdateOptions = {
      to: customer.email,
      customerName: customer.name,
      orderNumber: order.id,
      stallName: stall.name,
      oldStatus,
      newStatus,
      statusMessage: statusMessage || `Your order status has been updated to ${newStatus}.`,
      estimatedReadyTime,
      orderTrackingUrl: generateOrderTrackingUrl(order.id)
    }

    const emailId = await emailService.sendCustomerOrderStatusUpdate(emailOptions)
    console.log(`✅ [EMAIL UTILS] Order status update sent to customer: ${customer.email}`)
    return emailId
  } catch (error) {
    console.error('[EMAIL UTILS] Error sending order status update to customer:', error)
    throw error
  }
}

/**
 * Send new order notification to business owner
 */
export async function sendOrderNotificationToBusinessOwner(orderId: string): Promise<string | null> {
  try {
    const orderData = await fetchOrderEmailData(orderId)
    if (!orderData) {
      console.error('[EMAIL UTILS] Could not fetch order data for business notification email')
      return null
    }

    const { order, items, stall, business, customer, businessOwner } = orderData
    
    if (!businessOwner) {
      console.error('[EMAIL UTILS] Business owner not found for notification')
      return null
    }

    const formattedItems = await formatOrderItemsForEmail(items)

    const emailOptions: BusinessOwnerOrderNotificationOptions = {
      to: businessOwner.email,
      businessOwnerName: businessOwner.name,
      stallName: stall.name,
      orderNumber: order.id,
      customerName: customer.name,
      customerEmail: customer.email,
      scheduledDate: formatDateForEmail(order.scheduled_for),
      scheduledTime: formatTimeForEmail(order.scheduled_for),
      items: formattedItems,
      totalAmount: formatCurrency(order.total_cents, order.currency),
      orderManagementUrl: generateOrderManagementUrl(order.id)
    }

    const emailId = await emailService.sendBusinessOwnerOrderNotification(emailOptions)
    console.log(`✅ [EMAIL UTILS] Order notification sent to business owner: ${businessOwner.email}`)
    return emailId
  } catch (error) {
    console.error('[EMAIL UTILS] Error sending order notification to business owner:', error)
    throw error
  }
}

/**
 * Send all order-related emails (confirmation + business notification)
 */
export async function sendAllOrderEmails(orderId: string): Promise<{
  customerConfirmation: string | null
  businessNotification: string | null
}> {
  try {
    console.log(`[EMAIL UTILS] Sending all order emails for order: ${orderId}`)
    
    const [customerConfirmation, businessNotification] = await Promise.allSettled([
      sendOrderConfirmationToCustomer(orderId),
      sendOrderNotificationToBusinessOwner(orderId)
    ])

    const result = {
      customerConfirmation: customerConfirmation.status === 'fulfilled' ? customerConfirmation.value : null,
      businessNotification: businessNotification.status === 'fulfilled' ? businessNotification.value : null
    }

    if (customerConfirmation.status === 'rejected') {
      console.error('[EMAIL UTILS] Customer confirmation email failed:', customerConfirmation.reason)
    }

    if (businessNotification.status === 'rejected') {
      console.error('[EMAIL UTILS] Business notification email failed:', businessNotification.reason)
    }

    return result
  } catch (error) {
    console.error('[EMAIL UTILS] Error sending all order emails:', error)
    return {
      customerConfirmation: null,
      businessNotification: null
    }
  }
}

/**
 * Get email delivery statistics
 */
export function getEmailDeliveryStats() {
  return emailService.getDeliveryStats()
}

/**
 * Get email delivery logs for debugging
 */
export function getEmailDeliveryLogs() {
  return emailService.getAllDeliveryLogs()
}