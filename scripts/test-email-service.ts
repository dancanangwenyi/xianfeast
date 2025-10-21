#!/usr/bin/env tsx

/**
 * Test script for the email service with branded templates
 */

import { sendCustomerSignupEmail } from '@/lib/email'
import { emailService } from '../lib/email/service'
import { emailTemplateEngine, renderEmailTemplate } from '../lib/email/templates'
import { 
  sendOrderConfirmationToCustomer,
  sendOrderStatusUpdateToCustomer,
  sendOrderNotificationToBusinessOwner,
  sendAllOrderEmails,
  formatCurrency,
  formatDateForEmail,
  formatTimeForEmail
} from '../lib/email/utils'

async function testEmailTemplates() {
  console.log('\n🧪 Testing Email Templates...')
  
  try {
    // Test template listing
    const templates = emailTemplateEngine.listTemplates()
    console.log(`✅ Available templates: ${templates.join(', ')}`)

    // Test customer signup template
    const signupTemplate = renderEmailTemplate('customer_signup', {
      customerName: 'Willie Macharia',
      magicLink: 'http://localhost:3000/customer/auth/magic?token=test-token',
      customerEmail: 'dangwenyi@emtechhouse.co.ke'
    })

    if (signupTemplate) {
      console.log('✅ Customer signup template rendered successfully')
      console.log(`   Subject: ${signupTemplate.subject}`)
    } else {
      console.log('❌ Failed to render customer signup template')
    }

    // Test order confirmation template
    const confirmationTemplate = renderEmailTemplate('order_confirmation', {
      customerName: 'Willie Macharia',
      orderNumber: 'ORD-12345',
      stallName: 'Mama Njeri\'s Kitchen',
      scheduledDate: 'Monday, January 22, 2024',
      scheduledTime: '12:30 PM',
      items: [
        { quantity: 2, productName: 'Beef Stew with Rice', price: '$12.50' },
        { quantity: 1, productName: 'Fresh Juice', price: '$3.00' }
      ],
      totalAmount: '$15.50',
      orderTrackingUrl: 'http://localhost:3000/customer/orders/ORD-12345'
    })

    if (confirmationTemplate) {
      console.log('✅ Order confirmation template rendered successfully')
      console.log(`   Subject: ${confirmationTemplate.subject}`)
    } else {
      console.log('❌ Failed to render order confirmation template')
    }

    // Test template validation
    const validation = emailTemplateEngine.validateTemplateVariables('customer_signup', {
      customerName: 'Willie Macharia',
      magicLink: 'http://localhost:3000/test'
      // Missing customerEmail
    })

    console.log(`✅ Template validation test:`)
    console.log(`   Valid: ${validation.isValid}`)
    console.log(`   Missing variables: ${validation.missingVariables.join(', ')}`)

  } catch (error) {
    console.error('❌ Email template test failed:', error)
  }
}

async function testEmailService() {
  console.log('\n📧 Testing Email Service...')
  
  try {
    // Import the direct functions to avoid circular dependencies
    const { 
      sendCustomerSignupEmail,
      sendCustomerOrderConfirmationEmail,
      sendCustomerOrderStatusUpdateEmail,
      sendBusinessOwnerOrderNotificationEmail
    } = await import('../lib/email/customer')

    // Test customer signup email
    console.log('Testing customer signup email...')
    await sendCustomerSignupEmail({
      to: 'dangwenyi@emtechhouse.co.ke',
      name: 'Willie Macharia',
      token: 'test-signup-token-123'
    })
    console.log('✅ Customer signup email sent successfully')

    // Test order confirmation email
    console.log('Testing order confirmation email...')
    await sendCustomerOrderConfirmationEmail({
      to: 'dangwenyi@emtechhouse.co.ke',
      customerName: 'Willie Macharia',
      orderNumber: 'ORD-TEST-001',
      stallName: 'Mama Njeri\'s Kitchen',
      scheduledDate: 'Monday, January 22, 2024',
      scheduledTime: '12:30 PM',
      items: [
        { quantity: 2, productName: 'Beef Stew with Rice', price: '$12.50' },
        { quantity: 1, productName: 'Fresh Juice', price: '$3.00' }
      ],
      totalAmount: '$15.50',
      orderTrackingUrl: 'http://localhost:3000/customer/orders/ORD-TEST-001'
    })
    console.log('✅ Order confirmation email sent successfully')

    // Test order status update email
    console.log('Testing order status update email...')
    await sendCustomerOrderStatusUpdateEmail({
      to: 'dangwenyi@emtechhouse.co.ke',
      customerName: 'Willie Macharia',
      orderNumber: 'ORD-TEST-001',
      stallName: 'Mama Njeri\'s Kitchen',
      oldStatus: 'pending',
      newStatus: 'confirmed',
      statusMessage: 'Your order has been confirmed and is being prepared!',
      estimatedReadyTime: '1:00 PM',
      orderTrackingUrl: 'http://localhost:3000/customer/orders/ORD-TEST-001'
    })
    console.log('✅ Order status update email sent successfully')

    // Test business owner notification email
    console.log('Testing business owner notification email...')
    await sendBusinessOwnerOrderNotificationEmail({
      to: 'dancangwe@gmail.com', // Business owner email
      businessOwnerName: 'John Doe',
      stallName: 'Mama Njeri\'s Kitchen',
      orderNumber: 'ORD-TEST-001',
      customerName: 'Willie Macharia',
      customerEmail: 'dangwenyi@emtechhouse.co.ke',
      scheduledDate: 'Monday, January 22, 2024',
      scheduledTime: '12:30 PM',
      items: [
        { quantity: 2, productName: 'Beef Stew with Rice', price: '$12.50' },
        { quantity: 1, productName: 'Fresh Juice', price: '$3.00' }
      ],
      totalAmount: '$15.50',
      orderManagementUrl: 'http://localhost:3000/business/dashboard/orders/ORD-TEST-001'
    })
    console.log('✅ Business owner notification email sent successfully')

  } catch (error) {
    console.error('❌ Email service test failed:', error)
  }
}

async function testUtilityFunctions() {
  console.log('\n🔧 Testing Utility Functions...')
  
  try {
    // Test currency formatting
    const currency1 = formatCurrency(1250, 'USD') // $12.50
    const currency2 = formatCurrency(300, 'USD')  // $3.00
    console.log(`✅ Currency formatting: ${currency1}, ${currency2}`)

    // Test date formatting
    const testDate = new Date().toISOString()
    const formattedDate = formatDateForEmail(testDate)
    const formattedTime = formatTimeForEmail(testDate)
    console.log(`✅ Date formatting: ${formattedDate} at ${formattedTime}`)

    // Test email service statistics
    const stats = emailService.getDeliveryStats()
    console.log(`✅ Email delivery stats:`)
    console.log(`   Total: ${stats.total}`)
    console.log(`   Sent: ${stats.sent}`)
    console.log(`   Failed: ${stats.failed}`)
    console.log(`   Success Rate: ${stats.successRate}%`)

  } catch (error) {
    console.error('❌ Utility functions test failed:', error)
  }
}

async function testErrorHandling() {
  console.log('\n⚠️  Testing Error Handling...')
  
  try {
    // Test invalid email address
    console.log('Testing invalid email address...')
    try {
      await sendCustomerSignupEmail({
        to: 'invalid-email',
        name: 'Test User',
        token: 'test-token'
      })
      console.log('❌ Should have failed with invalid email')
    } catch (error) {
      console.log('✅ Correctly handled invalid email error')
    }

    // Test missing template variables
    console.log('Testing missing template variables...')
    const invalidTemplate = renderEmailTemplate('customer_signup', {
      customerName: 'Test User'
      // Missing required variables
    })
    
    if (!invalidTemplate) {
      console.log('✅ Correctly handled missing template variables')
    } else {
      console.log('❌ Should have failed with missing variables')
    }

  } catch (error) {
    console.error('❌ Error handling test failed:', error)
  }
}

async function main() {
  console.log('🚀 Starting Email Service Tests...')
  console.log('=====================================')

  await testEmailTemplates()
  await testEmailService()
  await testUtilityFunctions()
  await testErrorHandling()

  console.log('\n✅ Email Service Tests Completed!')
  console.log('=====================================')
  
  // Show final statistics
  const finalStats = emailService.getDeliveryStats()
  console.log('\n📊 Final Email Delivery Statistics:')
  console.log(`   Total Emails: ${finalStats.total}`)
  console.log(`   Successfully Sent: ${finalStats.sent}`)
  console.log(`   Failed: ${finalStats.failed}`)
  console.log(`   Success Rate: ${finalStats.successRate}%`)

  if (finalStats.failed > 0) {
    console.log('\n❌ Failed Email Details:')
    const failedLogs = emailService.getAllDeliveryLogs().filter(log => log.status === 'failed')
    failedLogs.forEach(log => {
      console.log(`   - ${log.template_type} to ${log.to}: ${log.error_message}`)
    })
  }
}

// Run the tests
main().catch(console.error)