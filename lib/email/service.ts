/**
 * Comprehensive email service with template rendering, delivery tracking, and error handling
 */

import { sendEmail, EmailOptions } from './send'

// Import types only to avoid circular dependencies
import type { 
  CustomerSignupEmailOptions,
  CustomerOrderConfirmationOptions,
  CustomerOrderStatusUpdateOptions,
  BusinessOwnerOrderNotificationOptions,
  CustomerOrderCancellationOptions
} from './customer'

export interface EmailDeliveryLog {
  id: string
  to: string
  subject: string
  template_type: string
  status: 'pending' | 'sent' | 'failed' | 'bounced'
  sent_at?: string
  failed_at?: string
  error_message?: string
  retry_count: number
  created_at: string
}

export interface EmailTemplateData {
  [key: string]: any
}

export interface EmailServiceOptions {
  enableDeliveryTracking?: boolean
  maxRetries?: number
  retryDelay?: number
}

class EmailService {
  private deliveryLogs: Map<string, EmailDeliveryLog> = new Map()
  private options: EmailServiceOptions

  constructor(options: EmailServiceOptions = {}) {
    this.options = {
      enableDeliveryTracking: true,
      maxRetries: 3,
      retryDelay: 5000,
      ...options
    }
  }

  /**
   * Generate a unique email ID for tracking
   */
  private generateEmailId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Log email delivery attempt
   */
  private logDelivery(log: EmailDeliveryLog): void {
    if (this.options.enableDeliveryTracking) {
      this.deliveryLogs.set(log.id, log)
      console.log(`[EMAIL SERVICE] Logged delivery: ${log.id} - ${log.status}`)
    }
  }

  /**
   * Update delivery log status
   */
  private updateDeliveryStatus(
    emailId: string, 
    status: EmailDeliveryLog['status'], 
    errorMessage?: string
  ): void {
    const log = this.deliveryLogs.get(emailId)
    if (log) {
      log.status = status
      if (status === 'sent') {
        log.sent_at = new Date().toISOString()
      } else if (status === 'failed') {
        log.failed_at = new Date().toISOString()
        log.error_message = errorMessage
        log.retry_count += 1
      }
      this.deliveryLogs.set(emailId, log)
    }
  }

  /**
   * Send email with delivery tracking and error handling
   */
  private async sendEmailWithTracking(
    emailOptions: EmailOptions,
    templateType: string,
    retryCount: number = 0
  ): Promise<string> {
    const emailId = this.generateEmailId()
    
    // Create delivery log
    const deliveryLog: EmailDeliveryLog = {
      id: emailId,
      to: emailOptions.to,
      subject: emailOptions.subject,
      template_type: templateType,
      status: 'pending',
      retry_count: retryCount,
      created_at: new Date().toISOString()
    }
    
    this.logDelivery(deliveryLog)

    try {
      await sendEmail(emailOptions)
      this.updateDeliveryStatus(emailId, 'sent')
      console.log(`✅ [EMAIL SERVICE] Successfully sent ${templateType} email to ${emailOptions.to}`)
      return emailId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.updateDeliveryStatus(emailId, 'failed', errorMessage)
      
      console.error(`❌ [EMAIL SERVICE] Failed to send ${templateType} email to ${emailOptions.to}:`, errorMessage)
      
      // Retry logic
      if (retryCount < (this.options.maxRetries || 3)) {
        console.log(`🔄 [EMAIL SERVICE] Retrying email ${emailId} (attempt ${retryCount + 1}/${this.options.maxRetries})`)
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay || 5000))
        
        return this.sendEmailWithTracking(emailOptions, templateType, retryCount + 1)
      } else {
        console.error(`💥 [EMAIL SERVICE] Max retries exceeded for email ${emailId}`)
        throw new Error(`Failed to send email after ${this.options.maxRetries} attempts: ${errorMessage}`)
      }
    }
  }

  /**
   * Send customer signup email
   */
  async sendCustomerSignup(options: CustomerSignupEmailOptions): Promise<string> {
    try {
      const { sendCustomerSignupEmail: sendCustomerSignupEmailDirect } = await import('./customer')
      await sendCustomerSignupEmailDirect(options)
      return this.generateEmailId() // For backward compatibility
    } catch (error) {
      console.error('[EMAIL SERVICE] Customer signup email failed:', error)
      throw error
    }
  }

  /**
   * Send customer order confirmation email
   */
  async sendCustomerOrderConfirmation(options: CustomerOrderConfirmationOptions): Promise<string> {
    try {
      const { sendCustomerOrderConfirmationEmail: sendCustomerOrderConfirmationEmailDirect } = await import('./customer')
      await sendCustomerOrderConfirmationEmailDirect(options)
      return this.generateEmailId() // For backward compatibility
    } catch (error) {
      console.error('[EMAIL SERVICE] Customer order confirmation email failed:', error)
      throw error
    }
  }

  /**
   * Send customer order status update email
   */
  async sendCustomerOrderStatusUpdate(options: CustomerOrderStatusUpdateOptions): Promise<string> {
    try {
      const { sendCustomerOrderStatusUpdateEmail: sendCustomerOrderStatusUpdateEmailDirect } = await import('./customer')
      await sendCustomerOrderStatusUpdateEmailDirect(options)
      return this.generateEmailId() // For backward compatibility
    } catch (error) {
      console.error('[EMAIL SERVICE] Customer order status update email failed:', error)
      throw error
    }
  }

  /**
   * Send business owner order notification email
   */
  async sendBusinessOwnerOrderNotification(options: BusinessOwnerOrderNotificationOptions): Promise<string> {
    try {
      const { sendBusinessOwnerOrderNotificationEmail: sendBusinessOwnerOrderNotificationEmailDirect } = await import('./customer')
      await sendBusinessOwnerOrderNotificationEmailDirect(options)
      return this.generateEmailId() // For backward compatibility
    } catch (error) {
      console.error('[EMAIL SERVICE] Business owner order notification email failed:', error)
      throw error
    }
  }

  /**
   * Send customer order cancellation email
   */
  async sendCustomerOrderCancellation(options: CustomerOrderCancellationOptions): Promise<string> {
    try {
      const { sendCustomerOrderCancellationEmail: sendCustomerOrderCancellationEmailDirect } = await import('./customer')
      await sendCustomerOrderCancellationEmailDirect(options)
      return this.generateEmailId() // For backward compatibility
    } catch (error) {
      console.error('[EMAIL SERVICE] Customer order cancellation email failed:', error)
      throw error
    }
  }

  /**
   * Send generic templated email with error handling
   */
  async sendTemplatedEmail(
    to: string,
    templateType: string,
    subject: string,
    htmlContent: string,
    textContent?: string
  ): Promise<string> {
    const emailOptions: EmailOptions = {
      to,
      subject,
      html: htmlContent,
      text: textContent
    }

    return this.sendEmailWithTracking(emailOptions, templateType)
  }

  /**
   * Get delivery status for an email
   */
  getDeliveryStatus(emailId: string): EmailDeliveryLog | null {
    return this.deliveryLogs.get(emailId) || null
  }

  /**
   * Get all delivery logs (for debugging/monitoring)
   */
  getAllDeliveryLogs(): EmailDeliveryLog[] {
    return Array.from(this.deliveryLogs.values())
  }

  /**
   * Get delivery logs by recipient
   */
  getDeliveryLogsByRecipient(email: string): EmailDeliveryLog[] {
    return Array.from(this.deliveryLogs.values()).filter(log => log.to === email)
  }

  /**
   * Get delivery logs by template type
   */
  getDeliveryLogsByTemplate(templateType: string): EmailDeliveryLog[] {
    return Array.from(this.deliveryLogs.values()).filter(log => log.template_type === templateType)
  }

  /**
   * Get failed deliveries for retry
   */
  getFailedDeliveries(): EmailDeliveryLog[] {
    return Array.from(this.deliveryLogs.values()).filter(
      log => log.status === 'failed' && log.retry_count < (this.options.maxRetries || 3)
    )
  }

  /**
   * Clear delivery logs (for cleanup)
   */
  clearDeliveryLogs(): void {
    this.deliveryLogs.clear()
    console.log('[EMAIL SERVICE] Delivery logs cleared')
  }

  /**
   * Get delivery statistics
   */
  getDeliveryStats(): {
    total: number
    sent: number
    failed: number
    pending: number
    successRate: number
  } {
    const logs = Array.from(this.deliveryLogs.values())
    const total = logs.length
    const sent = logs.filter(log => log.status === 'sent').length
    const failed = logs.filter(log => log.status === 'failed').length
    const pending = logs.filter(log => log.status === 'pending').length
    const successRate = total > 0 ? (sent / total) * 100 : 0

    return {
      total,
      sent,
      failed,
      pending,
      successRate: Math.round(successRate * 100) / 100
    }
  }
}

// Create singleton instance
export const emailService = new EmailService({
  enableDeliveryTracking: true,
  maxRetries: 3,
  retryDelay: 5000
})

// Export types and service
export {
  EmailService,
  CustomerSignupEmailOptions,
  CustomerOrderConfirmationOptions,
  CustomerOrderStatusUpdateOptions,
  BusinessOwnerOrderNotificationOptions,
  CustomerOrderCancellationOptions
}

// Convenience functions for backward compatibility
export async function sendCustomerSignupEmailTracked(options: CustomerSignupEmailOptions): Promise<string> {
  return emailService.sendCustomerSignup(options)
}

export async function sendCustomerOrderConfirmationEmailTracked(options: CustomerOrderConfirmationOptions): Promise<string> {
  return emailService.sendCustomerOrderConfirmation(options)
}

export async function sendCustomerOrderStatusUpdateEmailTracked(options: CustomerOrderStatusUpdateOptions): Promise<string> {
  return emailService.sendCustomerOrderStatusUpdate(options)
}

export async function sendBusinessOwnerOrderNotificationEmailTracked(options: BusinessOwnerOrderNotificationOptions): Promise<string> {
  return emailService.sendBusinessOwnerOrderNotification(options)
}