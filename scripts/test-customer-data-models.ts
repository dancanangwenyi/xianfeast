#!/usr/bin/env npx tsx

/**
 * Test script for customer data models and DynamoDB operations
 */

import { CustomerService } from '../lib/dynamodb/customers'
import { hashPassword } from '../lib/auth/password'

async function testCustomerDataModels() {
  console.log('🧪 Testing Customer Data Models and DynamoDB Operations...\n')

  try {
    // Test 1: Create customer signup magic link
    console.log('1. Testing customer signup magic link creation...')
    const testEmail = 'test-customer@example.com'
    
    try {
      const { magicLink, url } = await CustomerService.createSignupMagicLink(testEmail)
      console.log('✅ Magic link created successfully')
      console.log(`   Token: ${magicLink.token.substring(0, 10)}...`)
      console.log(`   URL: ${url}`)
      console.log(`   Expires: ${magicLink.expires_at}`)
      
      // Test 2: Verify magic link
      console.log('\n2. Testing magic link verification...')
      const verification = await CustomerService.verifyMagicLink(magicLink.token)
      if (verification.valid) {
        console.log('✅ Magic link verification successful')
      } else {
        console.log('❌ Magic link verification failed:', verification.error)
      }

      // Test 3: Complete signup process
      console.log('\n3. Testing customer signup completion...')
      const hashedPassword = await hashPassword('testpassword123')
      const customer = await CustomerService.completeMagicLinkSignup(magicLink.token, {
        name: 'Test Customer',
        password: hashedPassword
      })
      console.log('✅ Customer signup completed successfully')
      console.log(`   Customer ID: ${customer.id}`)
      console.log(`   Email: ${customer.email}`)
      console.log(`   Name: ${customer.name}`)
      console.log(`   Roles: ${customer.roles_json}`)

      // Test 4: Get customer cart
      console.log('\n4. Testing customer cart operations...')
      const cart = await CustomerService.getCustomerCart(customer.id)
      console.log('✅ Customer cart retrieved successfully')
      console.log(`   Cart ID: ${cart.id}`)
      console.log(`   Items: ${cart.items.length}`)
      console.log(`   Expires: ${cart.expires_at}`)

      // Test 5: Add item to cart
      console.log('\n5. Testing add item to cart...')
      const cartResult = await CustomerService.addToCart(customer.id, {
        product_id: 'test-product-1',
        stall_id: 'test-stall-1',
        quantity: 2,
        unit_price_cents: 1500,
        scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        special_instructions: 'Extra spicy please'
      })
      console.log('✅ Item added to cart successfully')
      console.log(`   Items in cart: ${cartResult.itemCount}`)
      console.log(`   Total: $${(cartResult.total / 100).toFixed(2)}`)

      // Test 6: Update customer preferences
      console.log('\n6. Testing customer preferences update...')
      const updatedCustomer = await CustomerService.updateCustomerProfile(customer.id, {
        preferences: {
          dietary_restrictions: ['vegetarian', 'gluten-free'],
          favorite_stalls: ['test-stall-1'],
          notification_preferences: {
            email: true,
            sms: false,
            push: true
          }
        }
      })
      console.log('✅ Customer preferences updated successfully')
      console.log(`   Dietary restrictions: ${updatedCustomer?.customer_preferences?.dietary_restrictions.join(', ')}`)

      // Test 7: Update order statistics
      console.log('\n7. Testing customer order statistics update...')
      const statsUpdated = await CustomerService.updateCustomerOrderStats(customer.id, {
        orderTotal: 3000,
        productIds: ['test-product-1', 'test-product-2']
      })
      console.log('✅ Customer order statistics updated successfully')
      console.log(`   Total orders: ${statsUpdated?.customer_stats?.total_orders}`)
      console.log(`   Total spent: $${((statsUpdated?.customer_stats?.total_spent_cents || 0) / 100).toFixed(2)}`)

      // Test 8: Get customer insights
      console.log('\n8. Testing customer insights...')
      const insights = await CustomerService.getCustomerInsights(customer.id)
      console.log('✅ Customer insights retrieved successfully')
      console.log(`   Total orders: ${insights.orderHistory.totalOrders}`)
      console.log(`   Average order value: $${(insights.orderHistory.averageOrderValue / 100).toFixed(2)}`)
      console.log(`   Cart items: ${insights.cart.items.length}`)

      console.log('\n🎉 All customer data model tests passed!')

    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log('⚠️  Customer already exists, testing with existing customer...')
        
        // Test with existing customer
        const existingCustomer = await CustomerService.getCustomerByEmail(testEmail)
        if (existingCustomer) {
          console.log('✅ Retrieved existing customer successfully')
          
          // Test cart operations with existing customer
          const cart = await CustomerService.getCustomerCart(existingCustomer.id)
          console.log('✅ Retrieved existing customer cart')
          console.log(`   Cart items: ${cart.items.length}`)
        }
      } else {
        throw error
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Stack trace:', error.stack)
    }
    process.exit(1)
  }
}

// Run the test
testCustomerDataModels().catch(console.error)