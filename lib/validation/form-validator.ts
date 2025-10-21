/**
 * Comprehensive Form Validation System for Customer Ordering
 * Provides real-time validation with helpful error messages
 */

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
  email?: boolean
  phone?: boolean
  date?: boolean
  time?: boolean
  futureDate?: boolean
  pastDate?: boolean
  min?: number
  max?: number
}

export interface ValidationError {
  field: string
  message: string
  type: 'required' | 'format' | 'length' | 'range' | 'custom'
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  fieldErrors: Record<string, string>
}

export class FormValidator {
  private rules: Record<string, ValidationRule> = {}
  private customMessages: Record<string, string> = {}

  constructor(rules: Record<string, ValidationRule> = {}, customMessages: Record<string, string> = {}) {
    this.rules = rules
    this.customMessages = customMessages
  }

  /**
   * Add validation rule for a field
   */
  addRule(field: string, rule: ValidationRule): void {
    this.rules[field] = rule
  }

  /**
   * Add custom error message for a field
   */
  addMessage(field: string, message: string): void {
    this.customMessages[field] = message
  }

  /**
   * Validate a single field
   */
  validateField(field: string, value: any): ValidationError | null {
    const rule = this.rules[field]
    if (!rule) return null

    // Required validation
    if (rule.required && this.isEmpty(value)) {
      return {
        field,
        message: this.customMessages[field] || `${this.formatFieldName(field)} is required`,
        type: 'required'
      }
    }

    // Skip other validations if field is empty and not required
    if (this.isEmpty(value) && !rule.required) {
      return null
    }

    const stringValue = String(value).trim()

    // Email validation
    if (rule.email && !this.isValidEmail(stringValue)) {
      return {
        field,
        message: this.customMessages[field] || 'Please enter a valid email address',
        type: 'format'
      }
    }

    // Phone validation
    if (rule.phone && !this.isValidPhone(stringValue)) {
      return {
        field,
        message: this.customMessages[field] || 'Please enter a valid phone number',
        type: 'format'
      }
    }

    // Date validation
    if (rule.date && !this.isValidDate(stringValue)) {
      return {
        field,
        message: this.customMessages[field] || 'Please enter a valid date',
        type: 'format'
      }
    }

    // Time validation
    if (rule.time && !this.isValidTime(stringValue)) {
      return {
        field,
        message: this.customMessages[field] || 'Please enter a valid time',
        type: 'format'
      }
    }

    // Future date validation
    if (rule.futureDate && !this.isFutureDate(stringValue)) {
      return {
        field,
        message: this.customMessages[field] || 'Date must be in the future',
        type: 'range'
      }
    }

    // Past date validation
    if (rule.pastDate && !this.isPastDate(stringValue)) {
      return {
        field,
        message: this.customMessages[field] || 'Date must be in the past',
        type: 'range'
      }
    }

    // Length validation
    if (rule.minLength && stringValue.length < rule.minLength) {
      return {
        field,
        message: this.customMessages[field] || `${this.formatFieldName(field)} must be at least ${rule.minLength} characters`,
        type: 'length'
      }
    }

    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return {
        field,
        message: this.customMessages[field] || `${this.formatFieldName(field)} must be no more than ${rule.maxLength} characters`,
        type: 'length'
      }
    }

    // Numeric range validation
    if (typeof value === 'number' || !isNaN(Number(value))) {
      const numValue = Number(value)
      
      if (rule.min !== undefined && numValue < rule.min) {
        return {
          field,
          message: this.customMessages[field] || `${this.formatFieldName(field)} must be at least ${rule.min}`,
          type: 'range'
        }
      }

      if (rule.max !== undefined && numValue > rule.max) {
        return {
          field,
          message: this.customMessages[field] || `${this.formatFieldName(field)} must be no more than ${rule.max}`,
          type: 'range'
        }
      }
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return {
        field,
        message: this.customMessages[field] || `${this.formatFieldName(field)} format is invalid`,
        type: 'format'
      }
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value)
      if (customError) {
        return {
          field,
          message: customError,
          type: 'custom'
        }
      }
    }

    return null
  }

  /**
   * Validate entire form
   */
  validateForm(data: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = []
    const fieldErrors: Record<string, string> = {}

    // Validate all fields with rules
    for (const field in this.rules) {
      const error = this.validateField(field, data[field])
      if (error) {
        errors.push(error)
        fieldErrors[field] = error.message
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    }
  }

  /**
   * Sanitize input value
   */
  sanitizeInput(value: string): string {
    if (typeof value !== 'string') return String(value)
    
    return value
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
  }

  /**
   * Helper methods
   */
  private isEmpty(value: any): boolean {
    return value === null || value === undefined || String(value).trim() === ''
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  }

  private isValidDate(date: string): boolean {
    const parsedDate = new Date(date)
    return !isNaN(parsedDate.getTime())
  }

  private isValidTime(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
  }

  private isFutureDate(date: string): boolean {
    const parsedDate = new Date(date)
    return parsedDate > new Date()
  }

  private isPastDate(date: string): boolean {
    const parsedDate = new Date(date)
    return parsedDate < new Date()
  }

  private formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ')
  }
}

/**
 * Pre-configured validators for common customer forms
 */
export const customerSignupValidator = new FormValidator({
  name: { required: true, minLength: 2, maxLength: 100 },
  email: { required: true, email: true }
}, {
  name: 'Full name is required and must be at least 2 characters',
  email: 'Please enter a valid email address'
})

export const customerLoginValidator = new FormValidator({
  email: { required: true, email: true },
  password: { required: true, minLength: 6 }
}, {
  email: 'Please enter your email address',
  password: 'Password must be at least 6 characters'
})

export const orderCheckoutValidator = new FormValidator({
  deliveryAddress: { 
    required: false, // Will be set to true conditionally
    minLength: 10,
    maxLength: 200
  },
  scheduledDate: { required: true, date: true, futureDate: true },
  scheduledTime: { required: true, time: true },
  specialInstructions: { maxLength: 500 }
}, {
  deliveryAddress: 'Delivery address must be at least 10 characters',
  scheduledDate: 'Please select a future date for your order',
  scheduledTime: 'Please select a time for your order',
  specialInstructions: 'Special instructions must be less than 500 characters'
})

export const profileUpdateValidator = new FormValidator({
  name: { required: true, minLength: 2, maxLength: 100 },
  phone: { phone: true },
  dietaryRestrictions: { maxLength: 200 }
}, {
  name: 'Full name is required',
  phone: 'Please enter a valid phone number',
  dietaryRestrictions: 'Dietary restrictions must be less than 200 characters'
})