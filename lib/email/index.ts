/**
 * Main email module exports
 */

// Core email sending functionality
export { sendEmail, sendMagicLinkEmail, sendOTPEmail } from './send'
export type { EmailOptions, MagicLinkEmailOptions } from './send'

// Customer-specific email functions
export {
  sendCustomerSignupEmail,
  sendCustomerOrderConfirmationEmail,
  sendCustomerOrderStatusUpdateEmail,
  sendBusinessOwnerOrderNotificationEmail
} from './customer'
export type {
  CustomerSignupEmailOptions,
  CustomerOrderConfirmationOptions,
  CustomerOrderStatusUpdateOptions,
  BusinessOwnerOrderNotificationOptions
} from './customer'

// Email service with tracking and error handling
export {
  emailService,
  EmailService,
  sendCustomerSignupEmail as sendCustomerSignupEmailTracked,
  sendCustomerOrderConfirmationEmail as sendCustomerOrderConfirmationEmailTracked,
  sendCustomerOrderStatusUpdateEmail as sendCustomerOrderStatusUpdateEmailTracked,
  sendBusinessOwnerOrderNotificationEmail as sendBusinessOwnerOrderNotificationEmailTracked
} from './service'
export type {
  EmailDeliveryLog,
  EmailTemplateData,
  EmailServiceOptions
} from './service'

// Template rendering system
export {
  emailTemplateEngine,
  EmailTemplateEngine,
  renderEmailTemplate,
  validateEmailTemplate,
  listEmailTemplates
} from './templates'
export type {
  EmailTemplate,
  TemplateVariables
} from './templates'

// Utility functions for order-related emails
export {
  fetchOrderEmailData,
  formatOrderItemsForEmail,
  formatCurrency,
  formatDateForEmail,
  formatTimeForEmail,
  generateOrderTrackingUrl,
  generateOrderManagementUrl,
  sendOrderConfirmationToCustomer,
  sendOrderStatusUpdateToCustomer,
  sendOrderNotificationToBusinessOwner,
  sendAllOrderEmails,
  getEmailDeliveryStats,
  getEmailDeliveryLogs
} from './utils'
export type {
  OrderEmailData
} from './utils'