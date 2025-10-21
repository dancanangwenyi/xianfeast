/**
 * Customer-specific email templates and sending functions
 */

import { sendEmail } from './send'

export interface CustomerSignupEmailOptions {
  to: string
  name: string
  token: string
}

/**
 * Send customer signup welcome email with magic link
 */
export async function sendCustomerSignupEmail(options: CustomerSignupEmailOptions): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const magicLink = `${baseUrl}/customer/auth/magic?token=${options.token}`
  
  const subject = "Welcome to XianFeast - Complete Your Account Setup"
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Welcome to XianFeast</title>
        <style>
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                padding: 40px 20px; 
                text-align: center; 
                color: white;
            }
            .logo { font-size: 32px; margin-bottom: 10px; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
            .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
            .content { padding: 40px 30px; }
            .content h2 { color: #1f2937; font-size: 24px; margin-bottom: 20px; }
            .content p { color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
            .button { 
                display: inline-block; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 16px 32px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }
            .features { background: #f9fafb; padding: 30px; border-radius: 8px; margin: 30px 0; }
            .features h3 { color: #1f2937; margin-bottom: 15px; }
            .features ul { color: #4b5563; padding-left: 20px; }
            .features li { margin-bottom: 8px; }
            .footer { padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
            .security-note { 
                background: #fef3c7; 
                border: 1px solid #f59e0b; 
                padding: 15px; 
                border-radius: 6px; 
                margin: 20px 0;
                font-size: 14px;
                color: #92400e;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🍜</div>
                <h1>Welcome to XianFeast</h1>
                <p>The Immortal Dining Experience</p>
            </div>
            
            <div class="content">
                <h2>Hello ${options.name}!</h2>
                
                <p>Welcome to XianFeast! We're thrilled to have you join our community of food lovers who appreciate exceptional dining experiences.</p>
                
                <p>To complete your account setup and start exploring amazing meals from local stalls, please click the button below:</p>
                
                <div style="text-align: center;">
                    <a href="${magicLink}" class="button">Complete Account Setup</a>
                </div>
                
                <div class="security-note">
                    <strong>🔒 Security Notice:</strong> This link will expire in 24 hours for your security. If you didn't create this account, please ignore this email.
                </div>
                
                <div class="features">
                    <h3>What you can do with XianFeast:</h3>
                    <ul>
                        <li>🍽️ Browse delicious meals from verified local stalls</li>
                        <li>📅 Schedule orders for today, tomorrow, or the whole week</li>
                        <li>📱 Track your orders in real-time</li>
                        <li>🌟 Discover new flavors and cuisines</li>
                        <li>💫 Enjoy a seamless ordering experience</li>
                    </ul>
                </div>
                
                <p>Once your account is set up, you'll have access to our full catalog of amazing food options. Our platform makes it easy to plan your meals and discover new favorites.</p>
                
                <p>If you have any questions or need assistance, our support team is here to help.</p>
                
                <p>Happy dining!<br>
                <strong>The XianFeast Team</strong></p>
            </div>
            
            <div class="footer">
                <p>This email was sent to ${options.to}</p>
                <p>XianFeast - Bringing you the finest dining experiences</p>
                <p>If you can't click the button above, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #667eea;">${magicLink}</p>
            </div>
        </div>
    </body>
    </html>
  `

  const text = `
    Welcome to XianFeast!
    
    Hello ${options.name},
    
    Welcome to XianFeast! We're thrilled to have you join our community of food lovers.
    
    To complete your account setup and start exploring amazing meals from local stalls, please visit:
    ${magicLink}
    
    This link will expire in 24 hours for your security.
    
    What you can do with XianFeast:
    - Browse delicious meals from verified local stalls
    - Schedule orders for today, tomorrow, or the whole week
    - Track your orders in real-time
    - Discover new flavors and cuisines
    - Enjoy a seamless ordering experience
    
    Happy dining!
    The XianFeast Team
    
    If you didn't create this account, please ignore this email.
  `

  await sendEmail({
    to: options.to,
    subject,
    html,
    text,
  })
}

export interface CustomerOrderConfirmationOptions {
  to: string
  customerName: string
  orderNumber: string
  stallName: string
  scheduledDate: string
  scheduledTime: string
  items: Array<{
    quantity: number
    productName: string
    price: string
  }>
  totalAmount: string
  orderTrackingUrl: string
}

export interface CustomerOrderStatusUpdateOptions {
  to: string
  customerName: string
  orderNumber: string
  stallName: string
  oldStatus: string
  newStatus: string
  statusMessage: string
  estimatedReadyTime?: string
  orderTrackingUrl: string
}

export interface BusinessOwnerOrderNotificationOptions {
  to: string
  businessOwnerName: string
  stallName: string
  orderNumber: string
  customerName: string
  customerEmail: string
  scheduledDate: string
  scheduledTime: string
  items: Array<{
    quantity: number
    productName: string
    price: string
  }>
  totalAmount: string
  orderManagementUrl: string
}

export interface CustomerOrderCancellationOptions {
  to: string
  customerName: string
  orderNumber: string
  stallName: string
  refundAmount?: string | null
}

/**
 * Send order confirmation email to customer
 */
export async function sendCustomerOrderConfirmationEmail(options: CustomerOrderConfirmationOptions): Promise<void> {
  const subject = `Order Confirmed #${options.orderNumber} - XianFeast`
  
  const itemsList = options.items.map(item => 
    `<li>${item.quantity}x ${item.productName} - $${item.price}</li>`
  ).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Order Confirmation - XianFeast</title>
        <style>
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { 
                background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                padding: 40px 20px; 
                text-align: center; 
                color: white;
            }
            .logo { font-size: 32px; margin-bottom: 10px; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
            .content { padding: 40px 30px; }
            .content h2 { color: #1f2937; font-size: 24px; margin-bottom: 20px; }
            .content p { color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
            .order-summary { 
                background: #f9fafb; 
                border: 2px solid #e5e7eb; 
                padding: 25px; 
                border-radius: 8px; 
                margin: 25px 0; 
            }
            .order-summary h3 { color: #1f2937; margin-bottom: 15px; font-size: 20px; }
            .order-summary p { margin-bottom: 10px; }
            .order-summary ul { color: #4b5563; padding-left: 20px; margin: 15px 0; }
            .order-summary li { margin-bottom: 8px; }
            .total { font-size: 18px; font-weight: 700; color: #1f2937; border-top: 2px solid #e5e7eb; padding-top: 15px; margin-top: 15px; }
            .button { 
                display: inline-block; 
                background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                color: white; 
                padding: 16px 32px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            }
            .footer { padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🍜</div>
                <h1>Order Confirmed!</h1>
            </div>
            
            <div class="content">
                <h2>Thank you, ${options.customerName}!</h2>
                
                <p>Your order has been confirmed and sent to the stall. Here are the details:</p>
                
                <div class="order-summary">
                    <h3>Order #${options.orderNumber}</h3>
                    <p><strong>Stall:</strong> ${options.stallName}</p>
                    <p><strong>Scheduled for:</strong> ${options.scheduledDate} at ${options.scheduledTime}</p>
                    
                    <h4>Items Ordered:</h4>
                    <ul>
                        ${itemsList}
                    </ul>
                    
                    <div class="total">
                        <strong>Total: $${options.totalAmount}</strong>
                    </div>
                </div>
                
                <p>You'll receive updates as your order progresses. Track your order anytime in your dashboard.</p>
                
                <div style="text-align: center;">
                    <a href="${options.orderTrackingUrl}" class="button">Track My Order</a>
                </div>
                
                <p>Thank you for choosing XianFeast! We hope you enjoy your meal.</p>
                
                <p>Best regards,<br>
                <strong>The XianFeast Team</strong></p>
            </div>
            
            <div class="footer">
                <p>This email was sent to ${options.to}</p>
                <p>XianFeast - The Immortal Dining Experience</p>
            </div>
        </div>
    </body>
    </html>
  `

  await sendEmail({
    to: options.to,
    subject,
    html,
  })
}

/**
 * Send order status update email to customer
 */
export async function sendCustomerOrderStatusUpdateEmail(options: CustomerOrderStatusUpdateOptions): Promise<void> {
  const subject = `Order Update #${options.orderNumber} - ${options.newStatus.charAt(0).toUpperCase() + options.newStatus.slice(1)} - XianFeast`
  
  // Status-specific styling and messaging
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return {
          color: '#10b981',
          gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          icon: '✅',
          message: 'Your order has been confirmed and is being prepared!'
        }
      case 'preparing':
      case 'in_preparation':
        return {
          color: '#f59e0b',
          gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          icon: '👨‍🍳',
          message: 'Your delicious meal is now being prepared!'
        }
      case 'ready':
        return {
          color: '#8b5cf6',
          gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          icon: '🍽️',
          message: 'Your order is ready for pickup!'
        }
      case 'fulfilled':
      case 'completed':
        return {
          color: '#06b6d4',
          gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
          icon: '🎉',
          message: 'Your order has been completed. Enjoy your meal!'
        }
      case 'cancelled':
        return {
          color: '#ef4444',
          gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          icon: '❌',
          message: 'Your order has been cancelled.'
        }
      default:
        return {
          color: '#6b7280',
          gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          icon: '📋',
          message: 'Your order status has been updated.'
        }
    }
  }

  const statusInfo = getStatusInfo(options.newStatus)

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Order Status Update - XianFeast</title>
        <style>
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { 
                background: ${statusInfo.gradient}; 
                padding: 40px 20px; 
                text-align: center; 
                color: white;
            }
            .logo { font-size: 32px; margin-bottom: 10px; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
            .status-icon { font-size: 48px; margin: 20px 0; }
            .content { padding: 40px 30px; }
            .content h2 { color: #1f2937; font-size: 24px; margin-bottom: 20px; }
            .content p { color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
            .status-update { 
                background: #f9fafb; 
                border-left: 4px solid ${statusInfo.color}; 
                padding: 25px; 
                border-radius: 0 8px 8px 0; 
                margin: 25px 0; 
            }
            .status-update h3 { color: #1f2937; margin-bottom: 15px; font-size: 20px; }
            .status-update p { margin-bottom: 10px; }
            .status-change { 
                display: flex; 
                align-items: center; 
                gap: 15px; 
                margin: 20px 0; 
                padding: 15px; 
                background: white; 
                border-radius: 8px; 
                border: 1px solid #e5e7eb;
            }
            .status-old { 
                color: #6b7280; 
                text-decoration: line-through; 
                font-size: 14px; 
            }
            .status-arrow { color: ${statusInfo.color}; font-weight: bold; }
            .status-new { 
                color: ${statusInfo.color}; 
                font-weight: 700; 
                font-size: 16px; 
            }
            .button { 
                display: inline-block; 
                background: ${statusInfo.gradient}; 
                color: white; 
                padding: 16px 32px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                box-shadow: 0 4px 12px rgba(${statusInfo.color.replace('#', '')}, 0.3);
            }
            .estimated-time { 
                background: #fef3c7; 
                border: 1px solid #f59e0b; 
                padding: 15px; 
                border-radius: 6px; 
                margin: 20px 0;
                color: #92400e;
            }
            .footer { padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🍜</div>
                <div class="status-icon">${statusInfo.icon}</div>
                <h1>Order Status Update</h1>
            </div>
            
            <div class="content">
                <h2>Hello ${options.customerName}!</h2>
                
                <p>${statusInfo.message}</p>
                
                <div class="status-update">
                    <h3>Order #${options.orderNumber}</h3>
                    <p><strong>Stall:</strong> ${options.stallName}</p>
                    
                    <div class="status-change">
                        <span class="status-old">${options.oldStatus.charAt(0).toUpperCase() + options.oldStatus.slice(1)}</span>
                        <span class="status-arrow">→</span>
                        <span class="status-new">${options.newStatus.charAt(0).toUpperCase() + options.newStatus.slice(1)}</span>
                    </div>
                    
                    ${options.statusMessage ? `<p><strong>Update:</strong> ${options.statusMessage}</p>` : ''}
                </div>
                
                ${options.estimatedReadyTime ? `
                <div class="estimated-time">
                    <strong>⏰ Estimated Ready Time:</strong> ${options.estimatedReadyTime}
                </div>
                ` : ''}
                
                <p>You can track your order progress and view all details in your dashboard.</p>
                
                <div style="text-align: center;">
                    <a href="${options.orderTrackingUrl}" class="button">Track My Order</a>
                </div>
                
                <p>Thank you for choosing XianFeast!</p>
                
                <p>Best regards,<br>
                <strong>The XianFeast Team</strong></p>
            </div>
            
            <div class="footer">
                <p>This email was sent to ${options.to}</p>
                <p>XianFeast - The Immortal Dining Experience</p>
            </div>
        </div>
    </body>
    </html>
  `

  await sendEmail({
    to: options.to,
    subject,
    html,
  })
}

/**
 * Send new order notification email to business owner
 */
export async function sendBusinessOwnerOrderNotificationEmail(options: BusinessOwnerOrderNotificationOptions): Promise<void> {
  const subject = `New Order #${options.orderNumber} - ${options.stallName} - XianFeast`
  
  const itemsList = options.items.map(item => 
    `<li>${item.quantity}x ${item.productName} - ${item.price}</li>`
  ).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New Order Notification - XianFeast</title>
        <style>
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { 
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
                padding: 40px 20px; 
                text-align: center; 
                color: white;
            }
            .logo { font-size: 32px; margin-bottom: 10px; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
            .urgent-badge { 
                background: #fbbf24; 
                color: #92400e; 
                padding: 8px 16px; 
                border-radius: 20px; 
                font-size: 14px; 
                font-weight: 600; 
                margin-top: 15px;
                display: inline-block;
            }
            .content { padding: 40px 30px; }
            .content h2 { color: #1f2937; font-size: 24px; margin-bottom: 20px; }
            .content p { color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
            .order-details { 
                background: #fef2f2; 
                border: 2px solid #fecaca; 
                padding: 25px; 
                border-radius: 8px; 
                margin: 25px 0; 
            }
            .order-details h3 { color: #dc2626; margin-bottom: 15px; font-size: 20px; }
            .order-details p { margin-bottom: 10px; }
            .order-details ul { color: #4b5563; padding-left: 20px; margin: 15px 0; }
            .order-details li { margin-bottom: 8px; }
            .customer-info { 
                background: #f0f9ff; 
                border: 1px solid #bae6fd; 
                padding: 20px; 
                border-radius: 8px; 
                margin: 20px 0; 
            }
            .customer-info h4 { color: #0369a1; margin-bottom: 10px; }
            .total { font-size: 18px; font-weight: 700; color: #dc2626; border-top: 2px solid #fecaca; padding-top: 15px; margin-top: 15px; }
            .button { 
                display: inline-block; 
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
                color: white; 
                padding: 16px 32px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
            }
            .action-buttons { 
                display: flex; 
                gap: 15px; 
                margin: 30px 0; 
                flex-wrap: wrap;
            }
            .button-secondary { 
                background: linear-gradient(135deg, #059669 0%, #047857 100%); 
                box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
            }
            .footer { padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
            .priority-notice { 
                background: #fef3c7; 
                border: 1px solid #f59e0b; 
                padding: 15px; 
                border-radius: 6px; 
                margin: 20px 0;
                color: #92400e;
                text-align: center;
                font-weight: 600;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🍜</div>
                <h1>New Order Received!</h1>
                <div class="urgent-badge">⚡ Action Required</div>
            </div>
            
            <div class="content">
                <h2>Hello ${options.businessOwnerName}!</h2>
                
                <div class="priority-notice">
                    🔔 You have received a new order for ${options.stallName}. Please review and confirm as soon as possible.
                </div>
                
                <div class="order-details">
                    <h3>Order #${options.orderNumber}</h3>
                    <p><strong>Stall:</strong> ${options.stallName}</p>
                    <p><strong>Scheduled for:</strong> ${options.scheduledDate} at ${options.scheduledTime}</p>
                    
                    <div class="customer-info">
                        <h4>Customer Information</h4>
                        <p><strong>Name:</strong> ${options.customerName}</p>
                        <p><strong>Email:</strong> ${options.customerEmail}</p>
                    </div>
                    
                    <h4>Items Ordered:</h4>
                    <ul>
                        ${itemsList}
                    </ul>
                    
                    <div class="total">
                        <strong>Total Order Value: ${options.totalAmount}</strong>
                    </div>
                </div>
                
                <p>Please log into your business dashboard to review the order details and confirm or modify as needed. The customer is waiting for your confirmation.</p>
                
                <div class="action-buttons" style="text-align: center;">
                    <a href="${options.orderManagementUrl}" class="button">Manage This Order</a>
                    <a href="${options.orderManagementUrl.replace('/orders/', '/dashboard')}" class="button button-secondary">View Dashboard</a>
                </div>
                
                <p><strong>Next Steps:</strong></p>
                <ul>
                    <li>Review the order details and customer requirements</li>
                    <li>Confirm the order if you can fulfill it as scheduled</li>
                    <li>Update the customer if there are any changes needed</li>
                    <li>Begin preparation according to your timeline</li>
                </ul>
                
                <p>Thank you for being part of the XianFeast community!</p>
                
                <p>Best regards,<br>
                <strong>The XianFeast Team</strong></p>
            </div>
            
            <div class="footer">
                <p>This email was sent to ${options.to}</p>
                <p>XianFeast Business Portal - Manage your orders efficiently</p>
                <p>Need help? Contact our business support team.</p>
            </div>
        </div>
    </body>
    </html>
  `

  await sendEmail({
    to: options.to,
    subject,
    html,
  })
}
/*
*
 * Send order cancellation confirmation email to customer
 */
export async function sendCustomerOrderCancellationEmail(options: CustomerOrderCancellationOptions): Promise<void> {
  const subject = `Order Cancelled #${options.orderNumber} - XianFeast`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Order Cancelled - XianFeast</title>
        <style>
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { 
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
                padding: 40px 20px; 
                text-align: center; 
                color: white;
            }
            .logo { font-size: 32px; margin-bottom: 10px; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
            .status-icon { font-size: 48px; margin: 20px 0; }
            .content { padding: 40px 30px; }
            .content h2 { color: #1f2937; font-size: 24px; margin-bottom: 20px; }
            .content p { color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
            .cancellation-details { 
                background: #fef2f2; 
                border: 2px solid #fecaca; 
                padding: 25px; 
                border-radius: 8px; 
                margin: 25px 0; 
            }
            .cancellation-details h3 { color: #dc2626; margin-bottom: 15px; font-size: 20px; }
            .cancellation-details p { margin-bottom: 10px; }
            .refund-info { 
                background: #f0fdf4; 
                border: 2px solid #bbf7d0; 
                padding: 20px; 
                border-radius: 8px; 
                margin: 20px 0; 
            }
            .refund-info h4 { color: #059669; margin-bottom: 10px; }
            .refund-info p { color: #047857; margin-bottom: 5px; }
            .button { 
                display: inline-block; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 16px 32px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }
            .footer { padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
            .help-section { 
                background: #f9fafb; 
                padding: 25px; 
                border-radius: 8px; 
                margin: 25px 0; 
            }
            .help-section h4 { color: #1f2937; margin-bottom: 15px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🍜</div>
                <div class="status-icon">❌</div>
                <h1>Order Cancelled</h1>
            </div>
            
            <div class="content">
                <h2>Hello ${options.customerName},</h2>
                
                <p>Your order has been successfully cancelled as requested.</p>
                
                <div class="cancellation-details">
                    <h3>Cancelled Order #${options.orderNumber}</h3>
                    <p><strong>Stall:</strong> ${options.stallName}</p>
                    <p><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                </div>
                
                ${options.refundAmount ? `
                <div class="refund-info">
                    <h4>💰 Refund Information</h4>
                    <p><strong>Refund Amount:</strong> $${options.refundAmount}</p>
                    <p>Your refund will be processed within 3-5 business days and will appear on your original payment method.</p>
                </div>
                ` : `
                <div class="refund-info">
                    <h4>ℹ️ Payment Information</h4>
                    <p>Since no payment was processed for this order, no refund is necessary.</p>
                </div>
                `}
                
                <p>We're sorry to see this order cancelled, but we understand that plans can change. We hope to serve you again soon!</p>
                
                <div class="help-section">
                    <h4>What's Next?</h4>
                    <ul>
                        <li>Browse our other amazing stalls and discover new flavors</li>
                        <li>Save your favorite items for future orders</li>
                        <li>Check out our daily specials and seasonal offerings</li>
                    </ul>
                </div>
                
                <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/customer/stalls" class="button">Browse Stalls</a>
                </div>
                
                <p>If you have any questions about this cancellation or need assistance with a new order, please don't hesitate to contact our support team.</p>
                
                <p>Thank you for choosing XianFeast!</p>
                
                <p>Best regards,<br>
                <strong>The XianFeast Team</strong></p>
            </div>
            
            <div class="footer">
                <p>This email was sent to ${options.to}</p>
                <p>XianFeast - The Immortal Dining Experience</p>
                <p>Need help? Contact our support team anytime.</p>
            </div>
        </div>
    </body>
    </html>
  `

  const text = `
    Order Cancelled - XianFeast
    
    Hello ${options.customerName},
    
    Your order has been successfully cancelled as requested.
    
    Cancelled Order #${options.orderNumber}
    Stall: ${options.stallName}
    Cancellation Date: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
    
    ${options.refundAmount 
      ? `Refund Amount: $${options.refundAmount}\nYour refund will be processed within 3-5 business days.`
      : 'Since no payment was processed for this order, no refund is necessary.'
    }
    
    We're sorry to see this order cancelled, but we understand that plans can change. We hope to serve you again soon!
    
    Browse our stalls: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/customer/stalls
    
    If you have any questions, please contact our support team.
    
    Thank you for choosing XianFeast!
    The XianFeast Team
  `

  await sendEmail({
    to: options.to,
    subject,
    html,
    text,
  })
}