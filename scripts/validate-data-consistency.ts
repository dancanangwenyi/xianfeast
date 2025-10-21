#!/usr/bin/env npx tsx

/**
 * Data Consistency Validation Script
 * 
 * This script validates data consistency across customer, business, and admin views:
 * - Validates referential integrity between entities
 * - Checks data synchronization across different access patterns
 * - Verifies business rules and constraints
 * - Tests cross-view data consistency
 * - Validates security and access control
 */

import { config } from 'dotenv'
import { CustomerService } from '../lib/dynamodb/customers'
import { getUserByEmail, getAllUsers } from '../lib/dynamodb/users'
import { getAllBusinesses } from '../lib/dynamodb/business'
import { getAllStalls } from '../lib/dynamodb/stalls'
import { getAllProducts } from '../lib/dynamodb/products'
import { getAllOrders } from '../lib/dynamodb/orders'

// Load environment variables
config()

interface ValidationResult {
  category: string
  test: string
  success: boolean
  message: string
  details?: any
  severity: 'critical' | 'warning' | 'info'
}

class DataConsistencyValidator {
  private results: ValidationResult[] = []
  private testCustomerEmail = 'dangwenyi@emtechhouse.co.ke'

  async runAllValidations(): Promise<void> {
    console.log('🔍 Running Data Consistency Validation...\n')
    
    try {
      await this.validateReferentialIntegrity()
      await this.validateBusinessRules()
      await this.validateCustomerDataIntegrity()
      await this.validateOrderDataIntegrity()
      await this.validateCrossViewConsistency()
      await this.validateSecurityConstraints()
      
      this.printResults()
    } catch (error) {
      console.error('❌ Validation suite failed:', error)
      process.exit(1)
    }
  }

  private async validateReferentialIntegrity(): Promise<void> {
    console.log('1️⃣ Validating Referential Integrity...')
    
    // Get all data
    const users = await getAllUsers()
    const businesses = await getAllBusinesses()
    const stalls = await getAllStalls()
    const products = await getAllProducts()
    const orders = await getAllOrders()

    // Test 1.1: Business owner references
    await this.validate('Referential Integrity', 'Business Owner References', () => {
      const userIds = new Set(users.map(u => u.id))
      const businessesWithInvalidOwner = businesses.filter(b => !userIds.has(b.owner_user_id))
      
      return {
        success: businessesWithInvalidOwner.length === 0,
        message: businessesWithInvalidOwner.length === 0 
          ? 'All businesses have valid owner references'
          : `${businessesWithInvalidOwner.length} businesses have invalid owner references`,
        details: {
          totalBusinesses: businesses.length,
          invalidReferences: businessesWithInvalidOwner.length,
          invalidBusinesses: businessesWithInvalidOwner.map(b => ({ id: b.id, name: b.name, owner_user_id: b.owner_user_id }))
        },
        severity: businessesWithInvalidOwner.length > 0 ? 'critical' : 'info'
      }
    })

    // Test 1.2: Stall business references
    await this.validate('Referential Integrity', 'Stall Business References', () => {
      const businessIds = new Set(businesses.map(b => b.id))
      const stallsWithInvalidBusiness = stalls.filter(s => !businessIds.has(s.business_id))
      
      return {
        success: stallsWithInvalidBusiness.length === 0,
        message: stallsWithInvalidBusiness.length === 0
          ? 'All stalls have valid business references'
          : `${stallsWithInvalidBusiness.length} stalls have invalid business references`,
        details: {
          totalStalls: stalls.length,
          invalidReferences: stallsWithInvalidBusiness.length,
          invalidStalls: stallsWithInvalidBusiness.map(s => ({ id: s.id, name: s.name, business_id: s.business_id }))
        },
        severity: stallsWithInvalidBusiness.length > 0 ? 'critical' : 'info'
      }
    })

    // Test 1.3: Product stall and business references
    await this.validate('Referential Integrity', 'Product References', () => {
      const businessIds = new Set(businesses.map(b => b.id))
      const stallIds = new Set(stalls.map(s => s.id))
      
      const productsWithInvalidBusiness = products.filter(p => !businessIds.has(p.business_id))
      const productsWithInvalidStall = products.filter(p => !stallIds.has(p.stall_id))
      
      const totalInvalid = productsWithInvalidBusiness.length + productsWithInvalidStall.length
      
      return {
        success: totalInvalid === 0,
        message: totalInvalid === 0
          ? 'All products have valid business and stall references'
          : `${totalInvalid} products have invalid references`,
        details: {
          totalProducts: products.length,
          invalidBusinessReferences: productsWithInvalidBusiness.length,
          invalidStallReferences: productsWithInvalidStall.length,
          invalidProducts: [
            ...productsWithInvalidBusiness.map(p => ({ id: p.id, title: p.title, issue: 'invalid_business_id', business_id: p.business_id })),
            ...productsWithInvalidStall.map(p => ({ id: p.id, title: p.title, issue: 'invalid_stall_id', stall_id: p.stall_id }))
          ]
        },
        severity: totalInvalid > 0 ? 'critical' : 'info'
      }
    })

    // Test 1.4: Order references
    await this.validate('Referential Integrity', 'Order References', () => {
      const userIds = new Set(users.map(u => u.id))
      const businessIds = new Set(businesses.map(b => b.id))
      const stallIds = new Set(stalls.map(s => s.id))
      
      const ordersWithInvalidCustomer = orders.filter(o => o.customer_id && !userIds.has(o.customer_id))
      const ordersWithInvalidBusiness = orders.filter(o => !businessIds.has(o.business_id))
      const ordersWithInvalidStall = orders.filter(o => !stallIds.has(o.stall_id))
      
      const totalInvalid = ordersWithInvalidCustomer.length + ordersWithInvalidBusiness.length + ordersWithInvalidStall.length
      
      return {
        success: totalInvalid === 0,
        message: totalInvalid === 0
          ? 'All orders have valid references'
          : `${totalInvalid} orders have invalid references`,
        details: {
          totalOrders: orders.length,
          invalidCustomerReferences: ordersWithInvalidCustomer.length,
          invalidBusinessReferences: ordersWithInvalidBusiness.length,
          invalidStallReferences: ordersWithInvalidStall.length
        },
        severity: totalInvalid > 0 ? 'critical' : 'info'
      }
    })
  }

  private async validateBusinessRules(): Promise<void> {
    console.log('\n2️⃣ Validating Business Rules...')
    
    const products = await getAllProducts()
    const orders = await getAllOrders()
    const stalls = await getAllStalls()

    // Test 2.1: Product pricing rules
    await this.validate('Business Rules', 'Product Pricing Rules', () => {
      const productsWithInvalidPrice = products.filter(p => p.price_cents <= 0)
      const productsWithInvalidInventory = products.filter(p => p.inventory_qty < 0)
      const productsWithInvalidPrepTime = products.filter(p => p.prep_time_minutes < 0)
      
      const totalInvalid = productsWithInvalidPrice.length + productsWithInvalidInventory.length + productsWithInvalidPrepTime.length
      
      return {
        success: totalInvalid === 0,
        message: totalInvalid === 0
          ? 'All products follow pricing and inventory rules'
          : `${totalInvalid} products violate business rules`,
        details: {
          invalidPricing: productsWithInvalidPrice.length,
          invalidInventory: productsWithInvalidInventory.length,
          invalidPrepTime: productsWithInvalidPrepTime.length,
          priceRange: {
            min: Math.min(...products.map(p => p.price_cents)) / 100,
            max: Math.max(...products.map(p => p.price_cents)) / 100
          }
        },
        severity: totalInvalid > 0 ? 'warning' : 'info'
      }
    })

    // Test 2.2: Order amount validation
    await this.validate('Business Rules', 'Order Amount Validation', () => {
      const ordersWithInvalidAmount = orders.filter(o => o.total_amount_cents <= 0)
      const ordersWithMissingItems = orders.filter(o => !o.items_json || o.items_json.trim() === '')
      
      // Validate order items structure
      const ordersWithInvalidItems = orders.filter(o => {
        if (!o.items_json) return true
        try {
          const items = JSON.parse(o.items_json)
          return !Array.isArray(items) || items.length === 0 || 
                 items.some((item: any) => !item.product_id || !item.quantity || item.quantity <= 0)
        } catch {
          return true
        }
      })
      
      const totalInvalid = ordersWithInvalidAmount.length + ordersWithMissingItems.length + ordersWithInvalidItems.length
      
      return {
        success: totalInvalid === 0,
        message: totalInvalid === 0
          ? 'All orders follow amount and item validation rules'
          : `${totalInvalid} orders violate business rules`,
        details: {
          invalidAmounts: ordersWithInvalidAmount.length,
          missingItems: ordersWithMissingItems.length,
          invalidItemStructure: ordersWithInvalidItems.length,
          totalOrders: orders.length
        },
        severity: totalInvalid > 0 ? 'critical' : 'info'
      }
    })

    // Test 2.3: Stall capacity rules
    await this.validate('Business Rules', 'Stall Capacity Rules', () => {
      const stallsWithInvalidCapacity = stalls.filter(s => s.capacity_per_day <= 0)
      const stallsWithMissingHours = stalls.filter(s => !s.open_hours_json)
      
      // Validate open hours structure
      const stallsWithInvalidHours = stalls.filter(s => {
        if (!s.open_hours_json) return false
        try {
          const hours = JSON.parse(s.open_hours_json)
          return typeof hours !== 'object' || hours === null
        } catch {
          return true
        }
      })
      
      const totalInvalid = stallsWithInvalidCapacity.length + stallsWithMissingHours.length + stallsWithInvalidHours.length
      
      return {
        success: totalInvalid === 0,
        message: totalInvalid === 0
          ? 'All stalls follow capacity and hours rules'
          : `${totalInvalid} stalls violate business rules`,
        details: {
          invalidCapacity: stallsWithInvalidCapacity.length,
          missingHours: stallsWithMissingHours.length,
          invalidHoursStructure: stallsWithInvalidHours.length,
          capacityRange: {
            min: Math.min(...stalls.map(s => s.capacity_per_day)),
            max: Math.max(...stalls.map(s => s.capacity_per_day))
          }
        },
        severity: totalInvalid > 0 ? 'warning' : 'info'
      }
    })
  }

  private async validateCustomerDataIntegrity(): Promise<void> {
    console.log('\n3️⃣ Validating Customer Data Integrity...')
    
    const customer = await getUserByEmail(this.testCustomerEmail)
    if (!customer) {
      this.results.push({
        category: 'Customer Data Integrity',
        test: 'Test Customer Exists',
        success: false,
        message: 'Test customer not found',
        severity: 'critical'
      })
      return
    }

    // Test 3.1: Customer profile completeness
    await this.validate('Customer Data Integrity', 'Customer Profile Completeness', () => {
      const hasRequiredFields = !!(customer.id && customer.email && customer.name)
      const hasCustomerRole = customer.roles_json.includes('customer')
      const hasPreferences = !!customer.customer_preferences
      const hasStats = !!customer.customer_stats
      
      return {
        success: hasRequiredFields && hasCustomerRole,
        message: hasRequiredFields && hasCustomerRole
          ? 'Customer profile is complete and valid'
          : 'Customer profile is missing required fields or role',
        details: {
          hasRequiredFields,
          hasCustomerRole,
          hasPreferences,
          hasStats,
          status: customer.status,
          rolesCount: JSON.parse(customer.roles_json || '[]').length
        },
        severity: (!hasRequiredFields || !hasCustomerRole) ? 'critical' : 'info'
      }
    })

    // Test 3.2: Customer preferences validation
    await this.validate('Customer Data Integrity', 'Customer Preferences Validation', () => {
      if (!customer.customer_preferences) {
        return {
          success: true,
          message: 'No customer preferences to validate',
          details: { hasPreferences: false },
          severity: 'info'
        }
      }
      
      const prefs = customer.customer_preferences
      const hasValidStructure = !!(
        Array.isArray(prefs.dietary_restrictions) &&
        Array.isArray(prefs.favorite_stalls) &&
        prefs.notification_preferences &&
        typeof prefs.notification_preferences.email === 'boolean'
      )
      
      return {
        success: hasValidStructure,
        message: hasValidStructure
          ? 'Customer preferences have valid structure'
          : 'Customer preferences have invalid structure',
        details: {
          dietaryRestrictions: prefs.dietary_restrictions?.length || 0,
          favoriteStalls: prefs.favorite_stalls?.length || 0,
          hasNotificationPrefs: !!prefs.notification_preferences,
          hasDefaultAddress: !!prefs.default_delivery_address
        },
        severity: !hasValidStructure ? 'warning' : 'info'
      }
    })

    // Test 3.3: Customer statistics validation
    await this.validate('Customer Data Integrity', 'Customer Statistics Validation', () => {
      if (!customer.customer_stats) {
        return {
          success: true,
          message: 'No customer statistics to validate',
          details: { hasStats: false },
          severity: 'info'
        }
      }
      
      const stats = customer.customer_stats
      const hasValidStructure = !!(
        typeof stats.total_orders === 'number' &&
        typeof stats.total_spent_cents === 'number' &&
        Array.isArray(stats.favorite_products) &&
        stats.total_orders >= 0 &&
        stats.total_spent_cents >= 0
      )
      
      return {
        success: hasValidStructure,
        message: hasValidStructure
          ? 'Customer statistics have valid structure and values'
          : 'Customer statistics have invalid structure or values',
        details: {
          totalOrders: stats.total_orders,
          totalSpent: stats.total_spent_cents / 100,
          favoriteProducts: stats.favorite_products?.length || 0,
          lastOrderDate: stats.last_order_date,
          averageOrderValue: stats.total_orders > 0 ? (stats.total_spent_cents / stats.total_orders / 100) : 0
        },
        severity: !hasValidStructure ? 'warning' : 'info'
      }
    })

    // Test 3.4: Customer cart validation
    await this.validate('Customer Data Integrity', 'Customer Cart Validation', async () => {
      const cart = await CustomerService.getCustomerCart(customer.id)
      
      const hasValidStructure = !!(cart.id && cart.customer_id === customer.id && Array.isArray(cart.items))
      const hasValidExpiry = new Date(cart.expires_at) > new Date()
      
      // Validate cart items
      const invalidItems = cart.items.filter(item => 
        !item.product_id || !item.stall_id || item.quantity <= 0 || item.unit_price_cents <= 0
      )
      
      return {
        success: hasValidStructure && invalidItems.length === 0,
        message: hasValidStructure && invalidItems.length === 0
          ? 'Customer cart is valid'
          : 'Customer cart has validation issues',
        details: {
          cartId: cart.id,
          itemCount: cart.items.length,
          hasValidExpiry,
          invalidItems: invalidItems.length,
          totalValue: cart.items.reduce((sum, item) => sum + (item.quantity * item.unit_price_cents), 0) / 100
        },
        severity: (!hasValidStructure || invalidItems.length > 0) ? 'warning' : 'info'
      }
    })
  }

  private async validateOrderDataIntegrity(): Promise<void> {
    console.log('\n4️⃣ Validating Order Data Integrity...')
    
    const customer = await getUserByEmail(this.testCustomerEmail)
    if (!customer) return
    
    const orders = await getAllOrders()
    const customerOrders = orders.filter(o => o.customer_id === customer.id)

    // Test 4.1: Order structure validation
    await this.validate('Order Data Integrity', 'Order Structure Validation', () => {
      const ordersWithMissingFields = customerOrders.filter(o => 
        !o.id || !o.customer_id || !o.business_id || !o.stall_id || !o.status || !o.created_at
      )
      
      const ordersWithInvalidStatus = customerOrders.filter(o => 
        !['pending', 'confirmed', 'in_preparation', 'ready', 'completed', 'cancelled'].includes(o.status)
      )
      
      const ordersWithInvalidDates = customerOrders.filter(o => {
        const createdAt = new Date(o.created_at)
        const updatedAt = new Date(o.updated_at)
        const scheduledFor = o.scheduled_for ? new Date(o.scheduled_for) : null
        
        return isNaN(createdAt.getTime()) || 
               isNaN(updatedAt.getTime()) || 
               updatedAt < createdAt ||
               (scheduledFor && isNaN(scheduledFor.getTime()))
      })
      
      const totalInvalid = ordersWithMissingFields.length + ordersWithInvalidStatus.length + ordersWithInvalidDates.length
      
      return {
        success: totalInvalid === 0,
        message: totalInvalid === 0
          ? 'All customer orders have valid structure'
          : `${totalInvalid} customer orders have structural issues`,
        details: {
          totalOrders: customerOrders.length,
          missingFields: ordersWithMissingFields.length,
          invalidStatus: ordersWithInvalidStatus.length,
          invalidDates: ordersWithInvalidDates.length,
          statusDistribution: customerOrders.reduce((acc, o) => {
            acc[o.status] = (acc[o.status] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        },
        severity: totalInvalid > 0 ? 'critical' : 'info'
      }
    })

    // Test 4.2: Order items validation
    await this.validate('Order Data Integrity', 'Order Items Validation', () => {
      const ordersWithInvalidItems = customerOrders.filter(o => {
        if (!o.items_json) return true
        
        try {
          const items = JSON.parse(o.items_json)
          if (!Array.isArray(items) || items.length === 0) return true
          
          return items.some((item: any) => 
            !item.product_id || 
            !item.quantity || 
            item.quantity <= 0 || 
            !item.unit_price_cents || 
            item.unit_price_cents <= 0
          )
        } catch {
          return true
        }
      })
      
      // Validate order totals match item totals
      const ordersWithIncorrectTotals = customerOrders.filter(o => {
        if (!o.items_json) return false
        
        try {
          const items = JSON.parse(o.items_json)
          const calculatedTotal = items.reduce((sum: number, item: any) => 
            sum + (item.quantity * item.unit_price_cents), 0
          )
          
          return Math.abs(calculatedTotal - o.total_amount_cents) > 1 // Allow 1 cent rounding difference
        } catch {
          return false
        }
      })
      
      const totalInvalid = ordersWithInvalidItems.length + ordersWithIncorrectTotals.length
      
      return {
        success: totalInvalid === 0,
        message: totalInvalid === 0
          ? 'All order items are valid and totals are correct'
          : `${totalInvalid} orders have item validation issues`,
        details: {
          invalidItems: ordersWithInvalidItems.length,
          incorrectTotals: ordersWithIncorrectTotals.length,
          totalOrderValue: customerOrders.reduce((sum, o) => sum + o.total_amount_cents, 0) / 100,
          averageOrderValue: customerOrders.length > 0 
            ? (customerOrders.reduce((sum, o) => sum + o.total_amount_cents, 0) / customerOrders.length / 100)
            : 0
        },
        severity: totalInvalid > 0 ? 'critical' : 'info'
      }
    })
  }

  private async validateCrossViewConsistency(): Promise<void> {
    console.log('\n5️⃣ Validating Cross-View Consistency...')
    
    const customer = await getUserByEmail(this.testCustomerEmail)
    if (!customer) return

    // Test 5.1: Customer insights consistency
    await this.validate('Cross-View Consistency', 'Customer Insights Consistency', async () => {
      const insights = await CustomerService.getCustomerInsights(customer.id)
      const dbCustomer = await CustomerService.getCustomerById(customer.id)
      
      if (!dbCustomer) {
        throw new Error('Customer not found in database')
      }
      
      const insightsMatch = insights.customer.id === dbCustomer.id
      const statsMatch = insights.orderHistory.totalOrders === (dbCustomer.customer_stats?.total_orders || 0)
      const preferencesMatch = JSON.stringify(insights.preferences) === JSON.stringify(dbCustomer.customer_preferences)
      
      return {
        success: insightsMatch && statsMatch,
        message: insightsMatch && statsMatch
          ? 'Customer insights are consistent with database'
          : 'Customer insights have inconsistencies with database',
        details: {
          insightsMatch,
          statsMatch,
          preferencesMatch,
          insightsTotalOrders: insights.orderHistory.totalOrders,
          dbTotalOrders: dbCustomer.customer_stats?.total_orders || 0,
          insightsTotalSpent: insights.orderHistory.totalSpent / 100,
          dbTotalSpent: (dbCustomer.customer_stats?.total_spent_cents || 0) / 100
        },
        severity: (!insightsMatch || !statsMatch) ? 'warning' : 'info'
      }
    })

    // Test 5.2: Order count consistency
    await this.validate('Cross-View Consistency', 'Order Count Consistency', async () => {
      const orders = await getAllOrders()
      const customerOrders = orders.filter(o => o.customer_id === customer.id)
      const customerStats = customer.customer_stats
      
      const dbOrderCount = customerOrders.length
      const statsOrderCount = customerStats?.total_orders || 0
      
      // Allow some discrepancy for pending orders that might not be counted in stats
      const countDifference = Math.abs(dbOrderCount - statsOrderCount)
      const isConsistent = countDifference <= 1 // Allow 1 order difference
      
      return {
        success: isConsistent,
        message: isConsistent
          ? 'Order counts are consistent across views'
          : `Order count inconsistency: DB has ${dbOrderCount}, stats show ${statsOrderCount}`,
        details: {
          dbOrderCount,
          statsOrderCount,
          countDifference,
          completedOrders: customerOrders.filter(o => o.status === 'completed').length,
          pendingOrders: customerOrders.filter(o => o.status === 'pending').length
        },
        severity: !isConsistent ? 'warning' : 'info'
      }
    })
  }

  private async validateSecurityConstraints(): Promise<void> {
    console.log('\n6️⃣ Validating Security Constraints...')
    
    const customer = await getUserByEmail(this.testCustomerEmail)
    if (!customer) return

    // Test 6.1: Customer role validation
    await this.validate('Security Constraints', 'Customer Role Validation', () => {
      const roles = JSON.parse(customer.roles_json || '[]')
      const hasCustomerRole = roles.includes('customer')
      const hasOnlyCustomerRole = roles.length === 1 && hasCustomerRole
      
      return {
        success: hasCustomerRole,
        message: hasCustomerRole
          ? 'Customer has correct role assignment'
          : 'Customer missing customer role',
        details: {
          roles,
          hasCustomerRole,
          hasOnlyCustomerRole,
          roleCount: roles.length
        },
        severity: !hasCustomerRole ? 'critical' : 'info'
      }
    })

    // Test 6.2: Data access boundaries
    await this.validate('Security Constraints', 'Data Access Boundaries', async () => {
      const cart = await CustomerService.getCustomerCart(customer.id)
      const insights = await CustomerService.getCustomerInsights(customer.id)
      
      // Verify customer can only access their own data
      const cartBelongsToCustomer = cart.customer_id === customer.id
      const insightsBelongToCustomer = insights.customer.id === customer.id
      
      return {
        success: cartBelongsToCustomer && insightsBelongToCustomer,
        message: cartBelongsToCustomer && insightsBelongToCustomer
          ? 'Customer data access is properly bounded'
          : 'Customer data access boundary violation detected',
        details: {
          cartBelongsToCustomer,
          insightsBelongToCustomer,
          customerId: customer.id,
          cartCustomerId: cart.customer_id,
          insightsCustomerId: insights.customer.id
        },
        severity: (!cartBelongsToCustomer || !insightsBelongToCustomer) ? 'critical' : 'info'
      }
    })

    // Test 6.3: Password and authentication security
    await this.validate('Security Constraints', 'Authentication Security', () => {
      const hasHashedPassword = !!customer.hashed_password
      const isActiveStatus = customer.status === 'active'
      const passwordChangeNotRequired = !customer.password_change_required
      
      return {
        success: hasHashedPassword && isActiveStatus,
        message: hasHashedPassword && isActiveStatus
          ? 'Customer authentication is secure'
          : 'Customer authentication has security issues',
        details: {
          hasHashedPassword,
          isActiveStatus,
          passwordChangeNotRequired,
          status: customer.status,
          mfaEnabled: customer.mfa_enabled,
          lastLogin: customer.last_login
        },
        severity: (!hasHashedPassword || !isActiveStatus) ? 'critical' : 'info'
      }
    })
  }

  private async validate(
    category: string, 
    test: string, 
    validationFn: () => Promise<any> | any
  ): Promise<void> {
    try {
      const result = await validationFn()
      
      this.results.push({
        category,
        test,
        success: result.success,
        message: result.message,
        details: result.details,
        severity: result.severity
      })
      
      const icon = result.success ? '✅' : (result.severity === 'critical' ? '❌' : '⚠️')
      console.log(`   ${icon} ${test}`)
      
    } catch (error) {
      this.results.push({
        category,
        test,
        success: false,
        message: error instanceof Error ? error.message : String(error),
        severity: 'critical'
      })
      
      console.log(`   ❌ ${test}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private printResults(): void {
    console.log('\n🎉 Data Consistency Validation Complete!')
    
    const successfulTests = this.results.filter(r => r.success).length
    const totalTests = this.results.length
    const criticalIssues = this.results.filter(r => !r.success && r.severity === 'critical').length
    const warnings = this.results.filter(r => !r.success && r.severity === 'warning').length
    
    console.log('\n📊 Validation Results Summary:')
    console.log(`   • Total Tests: ${totalTests}`)
    console.log(`   • Successful: ${successfulTests}`)
    console.log(`   • Critical Issues: ${criticalIssues}`)
    console.log(`   • Warnings: ${warnings}`)
    console.log(`   • Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`)
    
    if (criticalIssues === 0 && warnings === 0) {
      console.log('\n🎉 ALL VALIDATIONS PASSED! Data consistency is excellent!')
    } else if (criticalIssues === 0) {
      console.log('\n⚠️ All critical validations passed, but there are some warnings to review.')
    } else {
      console.log('\n❌ Critical issues found that need immediate attention.')
    }
    
    // Group results by category
    const resultsByCategory = this.results.reduce((acc, result) => {
      if (!acc[result.category]) {
        acc[result.category] = []
      }
      acc[result.category].push(result)
      return acc
    }, {} as Record<string, ValidationResult[]>)
    
    console.log('\n📋 Detailed Validation Results:')
    Object.entries(resultsByCategory).forEach(([category, results]) => {
      console.log(`\n${category}:`)
      results.forEach(result => {
        const icon = result.success ? '✅' : (result.severity === 'critical' ? '❌' : '⚠️')
        console.log(`   ${icon} ${result.test}: ${result.message}`)
        
        if (result.details && Object.keys(result.details).length > 0) {
          console.log(`      Details: ${JSON.stringify(result.details, null, 2)}`)
        }
      })
    })
    
    if (criticalIssues > 0) {
      console.log('\n🚨 Critical Issues Requiring Immediate Attention:')
      this.results
        .filter(r => !r.success && r.severity === 'critical')
        .forEach(r => {
          console.log(`   • ${r.category} - ${r.test}: ${r.message}`)
        })
    }
  }
}

// Run the validation
async function runDataConsistencyValidation(): Promise<void> {
  const validator = new DataConsistencyValidator()
  await validator.runAllValidations()
}

if (require.main === module) {
  runDataConsistencyValidation()
}

export { runDataConsistencyValidation, DataConsistencyValidator }