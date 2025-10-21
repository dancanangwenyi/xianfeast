/**
 * Email template rendering system with dynamic content injection
 */

export interface EmailTemplate {
  name: string
  subject: string
  html: string
  text?: string
  variables: string[]
}

export interface TemplateVariables {
  [key: string]: any
}

export class EmailTemplateEngine {
  private templates: Map<string, EmailTemplate> = new Map()

  constructor() {
    this.initializeDefaultTemplates()
  }

  /**
   * Initialize default email templates
   */
  private initializeDefaultTemplates(): void {
    // Customer signup template
    this.registerTemplate({
      name: 'customer_signup',
      subject: 'Welcome to XianFeast - Complete Your Account Setup',
      variables: ['customerName', 'magicLink', 'customerEmail'],
      html: this.getCustomerSignupTemplate(),
      text: this.getCustomerSignupTextTemplate()
    })

    // Order confirmation template
    this.registerTemplate({
      name: 'order_confirmation',
      subject: 'Order Confirmed #{{orderNumber}} - XianFeast',
      variables: ['customerName', 'orderNumber', 'stallName', 'scheduledDate', 'scheduledTime', 'items', 'totalAmount', 'orderTrackingUrl'],
      html: this.getOrderConfirmationTemplate(),
      text: this.getOrderConfirmationTextTemplate()
    })

    // Order status update template
    this.registerTemplate({
      name: 'order_status_update',
      subject: 'Order Update #{{orderNumber}} - {{newStatus}} - XianFeast',
      variables: ['customerName', 'orderNumber', 'stallName', 'oldStatus', 'newStatus', 'statusMessage', 'estimatedReadyTime', 'orderTrackingUrl'],
      html: this.getOrderStatusUpdateTemplate(),
      text: this.getOrderStatusUpdateTextTemplate()
    })

    // Business owner notification template
    this.registerTemplate({
      name: 'business_order_notification',
      subject: 'New Order #{{orderNumber}} - {{stallName}} - XianFeast',
      variables: ['businessOwnerName', 'stallName', 'orderNumber', 'customerName', 'customerEmail', 'scheduledDate', 'scheduledTime', 'items', 'totalAmount', 'orderManagementUrl'],
      html: this.getBusinessOrderNotificationTemplate(),
      text: this.getBusinessOrderNotificationTextTemplate()
    })
  }

  /**
   * Register a new email template
   */
  registerTemplate(template: EmailTemplate): void {
    this.templates.set(template.name, template)
    console.log(`[TEMPLATE ENGINE] Registered template: ${template.name}`)
  }

  /**
   * Get template by name
   */
  getTemplate(name: string): EmailTemplate | null {
    return this.templates.get(name) || null
  }

  /**
   * Render template with variables
   */
  renderTemplate(templateName: string, variables: TemplateVariables): {
    subject: string
    html: string
    text?: string
  } | null {
    const template = this.getTemplate(templateName)
    if (!template) {
      console.error(`[TEMPLATE ENGINE] Template not found: ${templateName}`)
      return null
    }

    try {
      const renderedSubject = this.interpolateString(template.subject, variables)
      const renderedHtml = this.interpolateString(template.html, variables)
      const renderedText = template.text ? this.interpolateString(template.text, variables) : undefined

      return {
        subject: renderedSubject,
        html: renderedHtml,
        text: renderedText
      }
    } catch (error) {
      console.error(`[TEMPLATE ENGINE] Error rendering template ${templateName}:`, error)
      return null
    }
  }

  /**
   * Interpolate string with variables using {{variable}} syntax
   */
  private interpolateString(template: string, variables: TemplateVariables): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (key in variables) {
        const value = variables[key]
        
        // Handle arrays (like items list)
        if (Array.isArray(value)) {
          return this.renderArrayVariable(key, value)
        }
        
        // Handle objects
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value)
        }
        
        // Handle primitives
        return String(value)
      }
      
      console.warn(`[TEMPLATE ENGINE] Variable not found: ${key}`)
      return match // Return original if variable not found
    })
  }

  /**
   * Render array variables (like order items)
   */
  private renderArrayVariable(key: string, items: any[]): string {
    if (key === 'items' && Array.isArray(items)) {
      return items.map(item => 
        `<li>${item.quantity}x ${item.productName} - ${item.price}</li>`
      ).join('')
    }
    
    // Default array rendering
    return items.map(item => `<li>${String(item)}</li>`).join('')
  }

  /**
   * Validate template variables
   */
  validateTemplateVariables(templateName: string, variables: TemplateVariables): {
    isValid: boolean
    missingVariables: string[]
    extraVariables: string[]
  } {
    const template = this.getTemplate(templateName)
    if (!template) {
      return {
        isValid: false,
        missingVariables: [],
        extraVariables: []
      }
    }

    const providedKeys = Object.keys(variables)
    const requiredKeys = template.variables
    
    const missingVariables = requiredKeys.filter(key => !providedKeys.includes(key))
    const extraVariables = providedKeys.filter(key => !requiredKeys.includes(key))

    return {
      isValid: missingVariables.length === 0,
      missingVariables,
      extraVariables
    }
  }

  /**
   * List all available templates
   */
  listTemplates(): string[] {
    return Array.from(this.templates.keys())
  }

  // Template definitions
  private getCustomerSignupTemplate(): string {
    return `
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
                <h2>Hello {{customerName}}!</h2>
                
                <p>Welcome to XianFeast! We're thrilled to have you join our community of food lovers who appreciate exceptional dining experiences.</p>
                
                <p>To complete your account setup and start exploring amazing meals from local stalls, please click the button below:</p>
                
                <div style="text-align: center;">
                    <a href="{{magicLink}}" class="button">Complete Account Setup</a>
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
                <p>This email was sent to {{customerEmail}}</p>
                <p>XianFeast - Bringing you the finest dining experiences</p>
                <p>If you can't click the button above, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #667eea;">{{magicLink}}</p>
            </div>
        </div>
    </body>
    </html>
    `
  }

  private getCustomerSignupTextTemplate(): string {
    return `
    Welcome to XianFeast!
    
    Hello {{customerName}},
    
    Welcome to XianFeast! We're thrilled to have you join our community of food lovers.
    
    To complete your account setup and start exploring amazing meals from local stalls, please visit:
    {{magicLink}}
    
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
  }

  private getOrderConfirmationTemplate(): string {
    return `
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
                <h2>Thank you, {{customerName}}!</h2>
                
                <p>Your order has been confirmed and sent to the stall. Here are the details:</p>
                
                <div class="order-summary">
                    <h3>Order #{{orderNumber}}</h3>
                    <p><strong>Stall:</strong> {{stallName}}</p>
                    <p><strong>Scheduled for:</strong> {{scheduledDate}} at {{scheduledTime}}</p>
                    
                    <h4>Items Ordered:</h4>
                    <ul>
                        {{items}}
                    </ul>
                    
                    <div class="total">
                        <strong>Total: {{totalAmount}}</strong>
                    </div>
                </div>
                
                <p>You'll receive updates as your order progresses. Track your order anytime in your dashboard.</p>
                
                <div style="text-align: center;">
                    <a href="{{orderTrackingUrl}}" class="button">Track My Order</a>
                </div>
                
                <p>Thank you for choosing XianFeast! We hope you enjoy your meal.</p>
                
                <p>Best regards,<br>
                <strong>The XianFeast Team</strong></p>
            </div>
            
            <div class="footer">
                <p>XianFeast - The Immortal Dining Experience</p>
            </div>
        </div>
    </body>
    </html>
    `
  }

  private getOrderConfirmationTextTemplate(): string {
    return `
    Order Confirmed!
    
    Thank you, {{customerName}}!
    
    Your order has been confirmed and sent to the stall. Here are the details:
    
    Order #{{orderNumber}}
    Stall: {{stallName}}
    Scheduled for: {{scheduledDate}} at {{scheduledTime}}
    
    Items Ordered:
    {{items}}
    
    Total: {{totalAmount}}
    
    You'll receive updates as your order progresses. Track your order at:
    {{orderTrackingUrl}}
    
    Thank you for choosing XianFeast!
    The XianFeast Team
    `
  }

  private getOrderStatusUpdateTemplate(): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Order Status Update - XianFeast</title>
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
            .content { padding: 40px 30px; }
            .content h2 { color: #1f2937; font-size: 24px; margin-bottom: 20px; }
            .content p { color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
            .status-update { 
                background: #f9fafb; 
                border-left: 4px solid #667eea; 
                padding: 25px; 
                border-radius: 0 8px 8px 0; 
                margin: 25px 0; 
            }
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
            .status-old { color: #6b7280; text-decoration: line-through; font-size: 14px; }
            .status-arrow { color: #667eea; font-weight: bold; }
            .status-new { color: #667eea; font-weight: 700; font-size: 16px; }
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
            }
            .footer { padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🍜</div>
                <h1>Order Status Update</h1>
            </div>
            
            <div class="content">
                <h2>Hello {{customerName}}!</h2>
                
                <p>Your order status has been updated.</p>
                
                <div class="status-update">
                    <h3>Order #{{orderNumber}}</h3>
                    <p><strong>Stall:</strong> {{stallName}}</p>
                    
                    <div class="status-change">
                        <span class="status-old">{{oldStatus}}</span>
                        <span class="status-arrow">→</span>
                        <span class="status-new">{{newStatus}}</span>
                    </div>
                    
                    <p><strong>Update:</strong> {{statusMessage}}</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="{{orderTrackingUrl}}" class="button">Track My Order</a>
                </div>
                
                <p>Thank you for choosing XianFeast!</p>
                
                <p>Best regards,<br>
                <strong>The XianFeast Team</strong></p>
            </div>
            
            <div class="footer">
                <p>XianFeast - The Immortal Dining Experience</p>
            </div>
        </div>
    </body>
    </html>
    `
  }

  private getOrderStatusUpdateTextTemplate(): string {
    return `
    Order Status Update
    
    Hello {{customerName}}!
    
    Your order status has been updated.
    
    Order #{{orderNumber}}
    Stall: {{stallName}}
    Status: {{oldStatus}} → {{newStatus}}
    
    Update: {{statusMessage}}
    
    Track your order at: {{orderTrackingUrl}}
    
    Thank you for choosing XianFeast!
    The XianFeast Team
    `
  }

  private getBusinessOrderNotificationTemplate(): string {
    return `
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
            .customer-info { 
                background: #f0f9ff; 
                border: 1px solid #bae6fd; 
                padding: 20px; 
                border-radius: 8px; 
                margin: 20px 0; 
            }
            .customer-info h4 { color: #0369a1; margin-bottom: 10px; }
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
            }
            .footer { padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
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
                <h2>Hello {{businessOwnerName}}!</h2>
                
                <p>You have received a new order for {{stallName}}. Please review and confirm as soon as possible.</p>
                
                <div class="order-details">
                    <h3>Order #{{orderNumber}}</h3>
                    <p><strong>Stall:</strong> {{stallName}}</p>
                    <p><strong>Scheduled for:</strong> {{scheduledDate}} at {{scheduledTime}}</p>
                    
                    <div class="customer-info">
                        <h4>Customer Information</h4>
                        <p><strong>Name:</strong> {{customerName}}</p>
                        <p><strong>Email:</strong> {{customerEmail}}</p>
                    </div>
                    
                    <h4>Items Ordered:</h4>
                    <ul>
                        {{items}}
                    </ul>
                    
                    <p><strong>Total Order Value: {{totalAmount}}</strong></p>
                </div>
                
                <div style="text-align: center;">
                    <a href="{{orderManagementUrl}}" class="button">Manage This Order</a>
                </div>
                
                <p>Please log into your business dashboard to review the order details and confirm or modify as needed.</p>
                
                <p>Best regards,<br>
                <strong>The XianFeast Team</strong></p>
            </div>
            
            <div class="footer">
                <p>XianFeast Business Portal - Manage your orders efficiently</p>
            </div>
        </div>
    </body>
    </html>
    `
  }

  private getBusinessOrderNotificationTextTemplate(): string {
    return `
    New Order Received!
    
    Hello {{businessOwnerName}}!
    
    You have received a new order for {{stallName}}.
    
    Order #{{orderNumber}}
    Stall: {{stallName}}
    Scheduled for: {{scheduledDate}} at {{scheduledTime}}
    
    Customer: {{customerName}} ({{customerEmail}})
    
    Items Ordered:
    {{items}}
    
    Total Order Value: {{totalAmount}}
    
    Please review and confirm this order at:
    {{orderManagementUrl}}
    
    Best regards,
    The XianFeast Team
    `
  }
}

// Create singleton instance
export const emailTemplateEngine = new EmailTemplateEngine()

// Export convenience functions
export function renderEmailTemplate(templateName: string, variables: TemplateVariables) {
  return emailTemplateEngine.renderTemplate(templateName, variables)
}

export function validateEmailTemplate(templateName: string, variables: TemplateVariables) {
  return emailTemplateEngine.validateTemplateVariables(templateName, variables)
}

export function listEmailTemplates(): string[] {
  return emailTemplateEngine.listTemplates()
}