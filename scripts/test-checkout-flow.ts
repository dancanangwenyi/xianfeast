#!/usr/bin/env tsx

/**
 * Test script for the customer checkout flow
 * This script tests the order creation API and validation
 */

import { createCustomerOrder, getCustomerOrderById } from '../lib/dynamodb/orders'
import { validateCompleteOrder } from '../lib/dynamodb/order-validation'

async function testCheckoutFlow() {
  console.log('🧪 Testing Customer Checkout Flow...\n')

  try {
    // Test order validation
    console.log('1. Testing order validation...')
    
    const testItems = [
      {
        product_id: 'test-product-1',
        stall_id: 'test-stall-1',
        quantity: 2,
        unit_price_cents: 1299 // $12.99
      }
    ]

    const scheduledFor = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now

    console.log('   - Validating order items and scheduling...')
    const validation = await validateCompleteOrder(testItems, 'test-stall-1', scheduledFor)
    
    console.log('   - Validation result:', {
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings
    })

    // Test order creation (with mock data)
    console.log('\n2. Testing order creation...')
    
    const mockOrderData = {
      business_id: 'test-business-1',
      stall_id: 'test-stall-1',
      customer_user_id: 'test-customer-1',
      status: 'pending' as const,
      scheduled_for: scheduledFor,
      total_cents: 2598, // $25.98
      currency: 'USD',
      notes: 'Test order from checkout flow',
      delivery_option: 'pickup' as const,
      payment_method: 'cash' as const,
      payment_status: 'pending' as const,
      notification_sent: false,
      subtotal_cents: 2598,
      delivery_fee_cents: 0,
      tax_cents: 0
    }

    console.log('   - Creating test order...')
    const order = await createCustomerOrder(mockOrderData)
    console.log('   ✅ Order created successfully:', {
      id: order.id,
      status: order.status,
      total_cents: order.total_cents,
      scheduled_for: order.scheduled_for
    })

    // Test order retrieval
    console.log('\n3. Testing order retrieval...')
    const retrievedOrder = await getCustomerOrderById(order.id)
    
    if (retrievedOrder) {
      console.log('   ✅ Order retrieved successfully:', {
        id: retrievedOrder.id,
        customer_user_id: retrievedOrder.customer_user_id,
        delivery_option: retrievedOrder.delivery_option,
        payment_method: retrievedOrder.payment_method
      })
    } else {
      console.log('   ❌ Failed to retrieve order')
    }

    console.log('\n✅ Checkout flow test completed successfully!')

  } catch (error) {
    console.error('❌ Checkout flow test failed:', error)
    
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      })
    }
  }
}

// Test order validation scenarios
async function testOrderValidationScenarios() {
  console.log('\n🔍 Testing Order Validation Scenarios...\n')

  const scenarios = [
    {
      name: 'Valid order',
      items: [{ product_id: 'valid-product', stall_id: 'valid-stall', quantity: 1, unit_price_cents: 1000 }],
      stallId: 'valid-stall',
      scheduledFor: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
    },
    {
      name: 'Order scheduled in the past',
      items: [{ product_id: 'valid-product', stall_id: 'valid-stall', quantity: 1, unit_price_cents: 1000 }],
      stallId: 'valid-stall',
      scheduledFor: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
    },
    {
      name: 'Order scheduled too far in advance',
      items: [{ product_id: 'valid-product', stall_id: 'valid-stall', quantity: 1, unit_price_cents: 1000 }],
      stallId: 'valid-stall',
      scheduledFor: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString() // 35 days from now
    },
    {
      name: 'Large quantity order',
      items: [{ product_id: 'valid-product', stall_id: 'valid-stall', quantity: 15, unit_price_cents: 1000 }],
      stallId: 'valid-stall',
      scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
    }
  ]

  for (const scenario of scenarios) {
    console.log(`Testing: ${scenario.name}`)
    
    try {
      const validation = await validateCompleteOrder(scenario.items, scenario.stallId, scenario.scheduledFor)
      
      console.log(`   Result: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`)
      
      if (validation.errors.length > 0) {
        console.log(`   Errors: ${validation.errors.join(', ')}`)
      }
      
      if (validation.warnings.length > 0) {
        console.log(`   Warnings: ${validation.warnings.join(', ')}`)
      }
      
    } catch (error) {
      console.log(`   ❌ Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    console.log('')
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Checkout Flow Tests\n')
  console.log('=' .repeat(50))
  
  await testCheckoutFlow()
  await testOrderValidationScenarios()
  
  console.log('=' .repeat(50))
  console.log('🏁 All tests completed!')
}

// Execute if run directly
if (require.main === module) {
  runTests().catch(console.error)
}

export { testCheckoutFlow, testOrderValidationScenarios }