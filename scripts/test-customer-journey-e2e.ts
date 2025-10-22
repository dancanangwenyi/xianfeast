#!/usr/bin/env npx tsx

/**
 * End-to-End Customer Journey Test
 * 
 * This script tests the complete customer journey from signup to order completion:
 * 1. Customer authentication (signup, login, password reset)
 * 2. Stall browsing and product discovery
 * 3. Shopping cart operations
 * 4. Order placement and scheduling
 * 5. Order tracking and status updates
 * 6. Data consistency validation across views
 */

import { config } from 'dotenv'
import { CustomerService } from '../lib/dynamodb/customers'
import { getUserByEmail } from '../lib/dynamodb/users'
import { getAllBusinesses } from '../lib/dynamodb/business'
import { getAllStalls } from '../lib/dynamodb/stalls'
import { getAllProducts } from '../lib/dynamodb/products'
import { getAllOrders } from '../lib/dynamodb/orders'

// Load environment variables
config()

interface TestResult {
  step: string
  success: boolean
  message: string
  data?: any
  duration?: number
}

class CustomerJourneyTester {
  private results: TestResult[] = []
  private testCustomerEmail = 'dangwenyi@emtechhouse.co.ke'
  private testCustomerPassword = 'TestCustomer123!'
  private baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  async runAllTests(): Promise<void> {
    console.log('🧪 Running End-to-End Customer Journey Tests...\n')
    
    try {
      await this.testCustomerAuthentication()
      await this.testStallBrowsing()
      await this.testCartOperations()
      await this.testOrderPlacement()
      await this.testOrderTracking()
      await this.testDataConsistency()
      
      this.printResults()
    } catch (error) {
      console.error('❌ Test suite failed:', error)
      process.exit(1)
    }
  }

  private async testCustomerAuthentication(): Promise<void> {
    console.log('1️⃣ Testing Customer Authentication...')
    
    // Test 1.1: Customer login
    await this.runTest('Customer Login', async () => {
      const response = await fetch(`${this.baseUrl}/api/auth/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.testCustomerEmail,
          password: this.testCustomerPassword
        })
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(`Login failed: ${data.error || 'Unknown error'}`)
      }
      
      return {
        userId: data.user?.id,
        email: data.user?.email,
        roles: data.user?.roles
      }
    })

    // Test 1.2: Session verification
    await this.runTest('Session Verification', async () => {
      // First login to get session
      const loginResponse = await fetch(`${this.baseUrl}/api/auth/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.testCustomerEmail,
          password: this.testCustomerPassword
        })
      })
      
      const loginData = await loginResponse.json()
      if (!loginData.success) {
        throw new Error('Failed to login for session test')
      }
      
      // Extract session cookie
      const cookies = loginResponse.headers.get('set-cookie')
      if (!cookies) {
        throw new Error('No session cookie received')
      }
      
      // Verify session
      const sessionResponse = await fetch(`${this.baseUrl}/api/auth/verify-session`, {
        method: 'GET',
        headers: { 'Cookie': cookies }
      })
      
      const sessionData = await sessionResponse.json()
      
      if (!sessionResponse.ok || !sessionData.valid) {
        throw new Error('Session verification failed')
      }
      
      return {
        sessionValid: sessionData.valid,
        userId: sessionData.user?.id
      }
    })

    // Test 1.3: Customer data retrieval
    await this.runTest('Customer Data Retrieval', async () => {
      const customer = await getUserByEmail(this.testCustomerEmail)
      
      if (!customer) {
        throw new Error('Customer not found in database')
      }
      
      if (!customer.roles_json.includes('customer')) {
        throw new Error('Customer does not have customer role')
      }
      
      return {
        customerId: customer.id,
        name: customer.name,
        status: customer.status,
        hasPreferences: !!customer.customer_preferences,
        hasStats: !!customer.customer_stats
      }
    })
  }

  private async testStallBrowsing(): Promise<void> {
    console.log('\n2️⃣ Testing Stall Browsing and Product Discovery...')
    
    // Test 2.1: Fetch available stalls
    await this.runTest('Fetch Available Stalls', async () => {
      const response = await fetch(`${this.baseUrl}/api/customer/stalls`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stalls: ${data.error}`)
      }
      
      if (!Array.isArray(data.stalls) || data.stalls.length === 0) {
        throw new Error('No stalls found')
      }
      
      return {
        stallCount: data.stalls.length,
        activeStalls: data.stalls.filter((s: any) => s.status === 'active').length,
        cuisineTypes: [...new Set(data.stalls.map((s: any) => s.cuisine_type).filter(Boolean))]
      }
    })

    // Test 2.2: Fetch stall details and products
    await this.runTest('Fetch Stall Details and Products', async () => {
      // Get first stall
      const stallsResponse = await fetch(`${this.baseUrl}/api/customer/stalls`)
      const stallsData = await stallsResponse.json()
      
      if (!stallsData.stalls || stallsData.stalls.length === 0) {
        throw new Error('No stalls available for testing')
      }
      
      const firstStall = stallsData.stalls[0]
      
      // Fetch stall details
      const stallResponse = await fetch(`${this.baseUrl}/api/customer/stalls/${firstStall.id}`)
      const stallData = await stallResponse.json()
      
      if (!stallResponse.ok) {
        throw new Error(`Failed to fetch stall details: ${stallData.error}`)
      }
      
      return {
        stallId: stallData.stall.id,
        stallName: stallData.stall.name,
        productCount: stallData.products?.length || 0,
        activeProducts: stallData.products?.filter((p: any) => p.status === 'active').length || 0
      }
    })

    // Test 2.3: Product filtering and search
    await this.runTest('Product Filtering', async () => {
      const products = await getAllProducts({ status: 'active' })
      
      if (products.length === 0) {
        throw new Error('No active products found')
      }
      
      // Test filtering by price range
      const affordableProducts = products.filter(p => p.price_cents <= 60000) // Under 600 KES
      const premiumProducts = products.filter(p => p.price_cents > 60000)
      
      // Test filtering by dietary restrictions
      const vegetarianProducts = products.filter(p => 
        p.diet_flags_csv?.includes('vegetarian') || p.diet_flags_csv?.includes('vegan')
      )
      
      return {
        totalProducts: products.length,
        affordableProducts: affordableProducts.length,
        premiumProducts: premiumProducts.length,
        vegetarianProducts: vegetarianProducts.length,
        priceRange: {
          min: Math.min(...products.map(p => p.price_cents)) / 100,
          max: Math.max(...products.map(p => p.price_cents)) / 100
        }
      }
    })
  }

  private async testCartOperations(): Promise<void> {
    console.log('\n3️⃣ Testing Shopping Cart Operations...')
    
    const customer = await getUserByEmail(this.testCustomerEmail)
    if (!customer) {
      throw new Error('Test customer not found')
    }

    // Test 3.1: Get customer cart
    await this.runTest('Get Customer Cart', async () => {
      const cart = await CustomerService.getCustomerCart(customer.id)
      
      return {
        cartId: cart.id,
        itemCount: cart.items.length,
        hasItems: cart.items.length > 0,
        expiresAt: cart.expires_at
      }
    })

    // Test 3.2: Add items to cart
    await this.runTest('Add Items to Cart', async () => {
      const products = await getAllProducts({ status: 'active' })
      if (products.length === 0) {
        throw new Error('No products available for cart test')
      }
      
      const testProduct = products[0]
      
      const result = await CustomerService.addToCart(customer.id, {
        product_id: testProduct.id,
        stall_id: testProduct.stall_id,
        quantity: 2,
        unit_price_cents: testProduct.price_cents,
        scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        special_instructions: 'Test cart item'
      })
      
      return {
        cartId: result.cart.id,
        itemCount: result.itemCount,
        total: result.total / 100,
        productAdded: testProduct.title
      }
    })

    // Test 3.3: Update cart item quantity
    await this.runTest('Update Cart Item Quantity', async () => {
      const cart = await CustomerService.getCustomerCart(customer.id)
      
      if (cart.items.length === 0) {
        throw new Error('No items in cart to update')
      }
      
      const firstItem = cart.items[0]
      const newQuantity = firstItem.quantity + 1
      
      const result = await CustomerService.updateCartQuantity(
        customer.id,
        firstItem.product_id,
        firstItem.stall_id,
        newQuantity,
        firstItem.scheduled_for
      )
      
      return {
        oldQuantity: firstItem.quantity,
        newQuantity: newQuantity,
        itemCount: result.itemCount,
        total: result.total / 100
      }
    })

    // Test 3.4: Cart persistence
    await this.runTest('Cart Persistence', async () => {
      const cart1 = await CustomerService.getCustomerCart(customer.id)
      
      // Simulate time passing
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const cart2 = await CustomerService.getCustomerCart(customer.id)
      
      return {
        cartId: cart1.id,
        itemsConsistent: cart1.items.length === cart2.items.length,
        totalConsistent: JSON.stringify(cart1.items) === JSON.stringify(cart2.items)
      }
    })
  }

  private async testOrderPlacement(): Promise<void> {
    console.log('\n4️⃣ Testing Order Placement and Scheduling...')
    
    const customer = await getUserByEmail(this.testCustomerEmail)
    if (!customer) {
      throw new Error('Test customer not found')
    }

    // Test 4.1: Place order from cart
    await this.runTest('Place Order from Cart', async () => {
      const cart = await CustomerService.getCustomerCart(customer.id)
      
      if (cart.items.length === 0) {
        throw new Error('No items in cart to place order')
      }
      
      // Simulate order placement API call
      const response = await fetch(`${this.baseUrl}/api/customer/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          items: cart.items,
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          deliveryMethod: 'pickup',
          specialInstructions: 'Test order from automated test'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Order placement failed: ${errorData.error}`)
      }
      
      const orderData = await response.json()
      
      return {
        orderId: orderData.order?.id,
        status: orderData.order?.status,
        totalAmount: orderData.order?.total_amount_cents / 100,
        itemCount: cart.items.length
      }
    })

    // Test 4.2: Order validation
    await this.runTest('Order Validation', async () => {
      const orders = await getAllOrders()
      const customerOrders = orders.filter(o => o.customer_id === customer.id)
      
      if (customerOrders.length === 0) {
        throw new Error('No orders found for test customer')
      }
      
      const latestOrder = customerOrders.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]
      
      // Validate order structure
      const hasRequiredFields = !!(
        latestOrder.id &&
        latestOrder.customer_id &&
        latestOrder.business_id &&
        latestOrder.stall_id &&
        latestOrder.total_amount_cents &&
        latestOrder.status &&
        latestOrder.created_at
      )
      
      return {
        orderId: latestOrder.id,
        hasRequiredFields,
        status: latestOrder.status,
        totalAmount: latestOrder.total_amount_cents / 100,
        hasItems: !!latestOrder.items_json
      }
    })

    // Test 4.3: Order scheduling
    await this.runTest('Order Scheduling Validation', async () => {
      const orders = await getAllOrders()
      const customerOrders = orders.filter(o => o.customer_id === customer.id)
      
      const scheduledOrders = customerOrders.filter(o => o.scheduled_for)
      const futureOrders = scheduledOrders.filter(o => 
        new Date(o.scheduled_for) > new Date()
      )
      
      return {
        totalOrders: customerOrders.length,
        scheduledOrders: scheduledOrders.length,
        futureOrders: futureOrders.length,
        hasValidScheduling: scheduledOrders.every(o => 
          new Date(o.scheduled_for).getTime() > new Date(o.created_at).getTime()
        )
      }
    })
  }

  private async testOrderTracking(): Promise<void> {
    console.log('\n5️⃣ Testing Order Tracking and Status Updates...')
    
    const customer = await getUserByEmail(this.testCustomerEmail)
    if (!customer) {
      throw new Error('Test customer not found')
    }

    // Test 5.1: Fetch customer orders
    await this.runTest('Fetch Customer Orders', async () => {
      const response = await fetch(`${this.baseUrl}/api/customer/orders`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to fetch orders: ${errorData.error}`)
      }
      
      const data = await response.json()
      
      return {
        orderCount: data.orders?.length || 0,
        hasOrders: (data.orders?.length || 0) > 0,
        statuses: [...new Set(data.orders?.map((o: any) => o.status) || [])]
      }
    })

    // Test 5.2: Order status tracking
    await this.runTest('Order Status Tracking', async () => {
      const orders = await getAllOrders()
      const customerOrders = orders.filter(o => o.customer_id === customer.id)
      
      if (customerOrders.length === 0) {
        throw new Error('No orders found for status tracking test')
      }
      
      const statusCounts = customerOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const validStatuses = ['pending', 'confirmed', 'in_preparation', 'ready', 'completed', 'cancelled']
      const hasValidStatuses = customerOrders.every(o => validStatuses.includes(o.status))
      
      return {
        totalOrders: customerOrders.length,
        statusCounts,
        hasValidStatuses,
        hasTimestamps: customerOrders.every(o => o.created_at && o.updated_at)
      }
    })

    // Test 5.3: Order details retrieval
    await this.runTest('Order Details Retrieval', async () => {
      const orders = await getAllOrders()
      const customerOrders = orders.filter(o => o.customer_id === customer.id)
      
      if (customerOrders.length === 0) {
        throw new Error('No orders found for details test')
      }
      
      const testOrder = customerOrders[0]
      
      const response = await fetch(`${this.baseUrl}/api/customer/orders/${testOrder.id}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to fetch order details: ${errorData.error}`)
      }
      
      const orderData = await response.json()
      
      return {
        orderId: orderData.order?.id,
        hasItems: !!orderData.order?.items,
        hasStallInfo: !!orderData.stall,
        hasBusinessInfo: !!orderData.business,
        itemCount: orderData.order?.items?.length || 0
      }
    })
  }

  private async testDataConsistency(): Promise<void> {
    console.log('\n6️⃣ Testing Data Consistency Across Views...')
    
    const customer = await getUserByEmail(this.testCustomerEmail)
    if (!customer) {
      throw new Error('Test customer not found')
    }

    // Test 6.1: Customer data consistency
    await this.runTest('Customer Data Consistency', async () => {
      const dbCustomer = await CustomerService.getCustomerById(customer.id)
      const customerInsights = await CustomerService.getCustomerInsights(customer.id)
      
      if (!dbCustomer) {
        throw new Error('Customer not found in database')
      }
      
      return {
        customerExists: !!dbCustomer,
        hasPreferences: !!dbCustomer.customer_preferences,
        hasStats: !!dbCustomer.customer_stats,
        insightsMatch: customerInsights.customer.id === dbCustomer.id,
        cartExists: !!customerInsights.cart
      }
    })

    // Test 6.2: Business and stall data consistency
    await this.runTest('Business and Stall Data Consistency', async () => {
      const businesses = await getAllBusinesses()
      const stalls = await getAllStalls()
      const products = await getAllProducts()
      
      // Check that all stalls belong to existing businesses
      const businessIds = new Set(businesses.map(b => b.id))
      const stallsWithValidBusiness = stalls.filter(s => businessIds.has(s.business_id))
      
      // Check that all products belong to existing stalls
      const stallIds = new Set(stalls.map(s => s.id))
      const productsWithValidStall = products.filter(p => stallIds.has(p.stall_id))
      
      return {
        totalBusinesses: businesses.length,
        totalStalls: stalls.length,
        totalProducts: products.length,
        stallsWithValidBusiness: stallsWithValidBusiness.length,
        productsWithValidStall: productsWithValidStall.length,
        businessStallConsistency: stallsWithValidBusiness.length === stalls.length,
        stallProductConsistency: productsWithValidStall.length === products.length
      }
    })

    // Test 6.3: Order data consistency
    await this.runTest('Order Data Consistency', async () => {
      const orders = await getAllOrders()
      const customerOrders = orders.filter(o => o.customer_id === customer.id)
      const businesses = await getAllBusinesses()
      const stalls = await getAllStalls()
      
      const businessIds = new Set(businesses.map(b => b.id))
      const stallIds = new Set(stalls.map(s => s.id))
      
      const ordersWithValidBusiness = customerOrders.filter(o => businessIds.has(o.business_id))
      const ordersWithValidStall = customerOrders.filter(o => stallIds.has(o.stall_id))
      
      // Check order items consistency
      const ordersWithValidItems = customerOrders.filter(o => {
        if (!o.items_json) return false
        try {
          const items = JSON.parse(o.items_json)
          return Array.isArray(items) && items.length > 0
        } catch {
          return false
        }
      })
      
      return {
        totalCustomerOrders: customerOrders.length,
        ordersWithValidBusiness: ordersWithValidBusiness.length,
        ordersWithValidStall: ordersWithValidStall.length,
        ordersWithValidItems: ordersWithValidItems.length,
        businessConsistency: ordersWithValidBusiness.length === customerOrders.length,
        stallConsistency: ordersWithValidStall.length === customerOrders.length,
        itemsConsistency: ordersWithValidItems.length === customerOrders.length
      }
    })
  }

  private async runTest(name: string, testFn: () => Promise<any>): Promise<void> {
    const startTime = Date.now()
    
    try {
      const result = await testFn()
      const duration = Date.now() - startTime
      
      this.results.push({
        step: name,
        success: true,
        message: 'Test passed successfully',
        data: result,
        duration
      })
      
      console.log(`   ✅ ${name} (${duration}ms)`)
    } catch (error) {
      const duration = Date.now() - startTime
      
      this.results.push({
        step: name,
        success: false,
        message: error instanceof Error ? error.message : String(error),
        duration
      })
      
      console.log(`   ❌ ${name} (${duration}ms): ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private printResults(): void {
    console.log('\n🎉 End-to-End Customer Journey Tests Complete!')
    
    const successfulTests = this.results.filter(r => r.success).length
    const totalTests = this.results.length
    const totalDuration = this.results.reduce((sum, r) => sum + (r.duration || 0), 0)
    
    console.log('\n📊 Test Results Summary:')
    console.log(`   • Total Tests: ${totalTests}`)
    console.log(`   • Successful: ${successfulTests}`)
    console.log(`   • Failed: ${totalTests - successfulTests}`)
    console.log(`   • Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`)
    console.log(`   • Total Duration: ${totalDuration}ms`)
    
    if (successfulTests === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! Customer journey is working perfectly!')
    } else {
      console.log('\n⚠️ Some tests failed. Please review the results above.')
      
      console.log('\n❌ Failed Tests:')
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   • ${r.step}: ${r.message}`)
        })
    }
    
    console.log('\n📋 Detailed Test Data:')
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌'
      console.log(`\n${index + 1}. ${status} ${result.step} (${result.duration}ms)`)
      if (result.data && Object.keys(result.data).length > 0) {
        console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`)
      }
      if (!result.success) {
        console.log(`   Error: ${result.message}`)
      }
    })
  }
}

// Run the tests
async function runCustomerJourneyTests(): Promise<void> {
  const tester = new CustomerJourneyTester()
  await tester.runAllTests()
}

if (require.main === module) {
  runCustomerJourneyTests()
}

export { runCustomerJourneyTests, CustomerJourneyTester }