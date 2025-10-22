import { 
  createCustomerUser, 
  updateCustomerPreferences, 
  updateCustomerStats, 
  getCustomers,
  assignCustomerRole,
  getUserByEmail,
  getUserById,
  updateUser,
  User,
  CustomerPreferences,
  CustomerStats
} from './users'
import { 
  getOrCreateCart, 
  addItemToCart, 
  removeItemFromCart, 
  updateCartItemQuantity, 
  clearCart,
  calculateCartTotal,
  getCartItemCount,
  Cart,
  CartItem
} from './carts'
import { 
  createCustomerSignupMagicLink, 
  createCustomerPasswordResetMagicLink, 
  verifyCustomerMagicLink, 
  markCustomerMagicLinkAsUsed,
  CustomerMagicLink
} from './customer-magic-links'

/**
 * Customer service interface combining all customer operations
 */
export class CustomerService {
  
  /**
   * Create new customer account
   */
  static async createCustomer(customerData: {
    email: string
    name: string
    hashed_password?: string
  }): Promise<User> {
    const customer = await createCustomerUser(customerData)
    await assignCustomerRole(customer.id)
    return customer
  }

  /**
   * Get customer by email
   */
  static async getCustomerByEmail(email: string): Promise<User | null> {
    const user = await getUserByEmail(email)
    if (!user || !user.roles_json.includes('customer')) {
      return null
    }
    return user
  }

  /**
   * Get customer by ID
   */
  static async getCustomerById(id: string): Promise<User | null> {
    const user = await getUserById(id)
    if (!user || !user.roles_json.includes('customer')) {
      return null
    }
    return user
  }

  /**
   * Update customer profile
   */
  static async updateCustomerProfile(
    customerId: string, 
    updates: {
      name?: string
      email?: string
      preferences?: Partial<CustomerPreferences>
    }
  ): Promise<User | null> {
    const customer = await this.getCustomerById(customerId)
    if (!customer) {
      return null
    }

    // Update basic profile fields
    const profileUpdates: Partial<User> = {}
    if (updates.name) profileUpdates.name = updates.name
    if (updates.email) profileUpdates.email = updates.email

    let updatedCustomer = customer
    if (Object.keys(profileUpdates).length > 0) {
      updatedCustomer = await updateUser(customerId, profileUpdates) || customer
    }

    // Update preferences if provided
    if (updates.preferences) {
      updatedCustomer = await updateCustomerPreferences(customerId, updates.preferences) || updatedCustomer
    }

    return updatedCustomer
  }

  /**
   * Update customer order statistics
   */
  static async updateCustomerOrderStats(
    customerId: string,
    orderData: {
      orderTotal: number
      productIds: string[]
    }
  ): Promise<User | null> {
    const customer = await this.getCustomerById(customerId)
    if (!customer || !customer.customer_stats) {
      return null
    }

    const currentStats = customer.customer_stats
    const updatedStats: CustomerStats = {
      total_orders: currentStats.total_orders + 1,
      total_spent_cents: currentStats.total_spent_cents + orderData.orderTotal,
      favorite_products: Array.from(new Set([...currentStats.favorite_products, ...orderData.productIds])),
      last_order_date: new Date().toISOString()
    }

    return await updateCustomerStats(customerId, updatedStats)
  }

  /**
   * Get all customers
   */
  static async getAllCustomers(): Promise<User[]> {
    return await getCustomers()
  }

  /**
   * Customer cart operations
   */
  static async getCustomerCart(customerId: string): Promise<Cart> {
    return await getOrCreateCart(customerId)
  }

  static async addToCart(
    customerId: string, 
    item: CartItem
  ): Promise<{ cart: Cart; total: number; itemCount: number }> {
    const cart = await getOrCreateCart(customerId)
    const updatedCart = await addItemToCart(cart.id, item)
    
    if (!updatedCart) {
      throw new Error('Failed to add item to cart')
    }

    return {
      cart: updatedCart,
      total: calculateCartTotal(updatedCart),
      itemCount: getCartItemCount(updatedCart)
    }
  }

  static async removeFromCart(
    customerId: string, 
    productId: string, 
    stallId: string,
    scheduledFor?: string
  ): Promise<{ cart: Cart; total: number; itemCount: number }> {
    const cart = await getOrCreateCart(customerId)
    const updatedCart = await removeItemFromCart(cart.id, productId, stallId, scheduledFor)
    
    if (!updatedCart) {
      throw new Error('Failed to remove item from cart')
    }

    return {
      cart: updatedCart,
      total: calculateCartTotal(updatedCart),
      itemCount: getCartItemCount(updatedCart)
    }
  }

  static async updateCartQuantity(
    customerId: string, 
    productId: string, 
    stallId: string,
    quantity: number,
    scheduledFor?: string
  ): Promise<{ cart: Cart; total: number; itemCount: number }> {
    const cart = await getOrCreateCart(customerId)
    const updatedCart = await updateCartItemQuantity(cart.id, productId, stallId, quantity, scheduledFor)
    
    if (!updatedCart) {
      throw new Error('Failed to update cart item quantity')
    }

    return {
      cart: updatedCart,
      total: calculateCartTotal(updatedCart),
      itemCount: getCartItemCount(updatedCart)
    }
  }

  static async clearCustomerCart(customerId: string): Promise<Cart> {
    const cart = await getOrCreateCart(customerId)
    const clearedCart = await clearCart(cart.id)
    
    if (!clearedCart) {
      throw new Error('Failed to clear cart')
    }

    return clearedCart
  }

  /**
   * Customer authentication operations
   */
  static async createSignupMagicLink(email: string): Promise<{
    magicLink: CustomerMagicLink
    url: string
  }> {
    // Check if customer already exists
    const existingCustomer = await this.getCustomerByEmail(email)
    if (existingCustomer) {
      throw new Error('Customer with this email already exists')
    }

    return await createCustomerSignupMagicLink(email)
  }

  static async createPasswordResetMagicLink(email: string): Promise<{
    magicLink: CustomerMagicLink
    url: string
  }> {
    const customer = await this.getCustomerByEmail(email)
    if (!customer) {
      throw new Error('No customer found with this email')
    }

    return await createCustomerPasswordResetMagicLink(email, customer.id)
  }

  static async verifyMagicLink(token: string): Promise<{
    valid: boolean
    magicLink?: CustomerMagicLink
    error?: string
  }> {
    return await verifyCustomerMagicLink(token)
  }

  static async completeMagicLinkSignup(
    token: string, 
    customerData: {
      name: string
      password: string
    }
  ): Promise<User> {
    const verification = await verifyCustomerMagicLink(token)
    if (!verification.valid || !verification.magicLink) {
      throw new Error(verification.error || 'Invalid magic link')
    }

    // Create customer account
    const customer = await this.createCustomer({
      email: verification.magicLink.email,
      name: customerData.name,
      hashed_password: customerData.password
    })

    // Mark magic link as used
    await markCustomerMagicLinkAsUsed(token)

    // Activate customer account
    await updateUser(customer.id, { status: 'active' })

    return customer
  }

  static async completePasswordReset(
    token: string, 
    newPassword: string
  ): Promise<User> {
    const verification = await verifyCustomerMagicLink(token)
    if (!verification.valid || !verification.magicLink) {
      throw new Error(verification.error || 'Invalid magic link')
    }

    if (!verification.magicLink.user_id) {
      throw new Error('Invalid password reset link')
    }

    // Update customer password
    const customer = await updateUser(verification.magicLink.user_id, {
      hashed_password: newPassword,
      password_change_required: false
    })

    if (!customer) {
      throw new Error('Failed to update customer password')
    }

    // Mark magic link as used
    await markCustomerMagicLinkAsUsed(token)

    return customer
  }

  /**
   * Customer analytics and insights
   */
  static async getCustomerInsights(customerId: string): Promise<{
    customer: User
    cart: Cart
    orderHistory: {
      totalOrders: number
      totalSpent: number
      averageOrderValue: number
      lastOrderDate?: string
    }
    preferences: CustomerPreferences | null
  }> {
    const customer = await this.getCustomerById(customerId)
    if (!customer) {
      throw new Error('Customer not found')
    }

    const cart = await this.getCustomerCart(customerId)
    const stats = customer.customer_stats

    return {
      customer,
      cart,
      orderHistory: {
        totalOrders: stats?.total_orders || 0,
        totalSpent: stats?.total_spent_cents || 0,
        averageOrderValue: stats?.total_orders ? (stats.total_spent_cents / stats.total_orders) : 0,
        lastOrderDate: stats?.last_order_date
      },
      preferences: customer.customer_preferences || null
    }
  }
}

// Export individual functions for backward compatibility
export {
  createCustomerUser,
  updateCustomerPreferences,
  updateCustomerStats,
  getCustomers,
  assignCustomerRole
} from './users'

export {
  getOrCreateCart,
  addItemToCart,
  removeItemFromCart,
  updateCartItemQuantity,
  clearCart,
  calculateCartTotal,
  getCartItemCount
} from './carts'

export {
  createCustomerSignupMagicLink,
  createCustomerPasswordResetMagicLink,
  verifyCustomerMagicLink,
  markCustomerMagicLinkAsUsed
} from './customer-magic-links'

// Export types
export type { Cart, CartItem } from './carts'
export type { CustomerMagicLink } from './customer-magic-links'
export type { User, CustomerPreferences, CustomerStats } from './users'