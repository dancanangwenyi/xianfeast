/**
 * Comprehensive Error Handling Tests
 * Tests form validation, API error handling, and offline functionality
 */

import { FormValidator, customerSignupValidator, orderCheckoutValidator } from '../../validation/form-validator'
import { ApiErrorHandler } from '../api-error-handler'
import { ApiResponseHandler, InputValidator } from '../api-response-handler'

describe('Form Validation', () => {
  describe('FormValidator', () => {
    test('should validate required fields', () => {
      const validator = new FormValidator({
        name: { required: true },
        email: { required: true, email: true }
      })

      const result = validator.validateForm({
        name: '',
        email: ''
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.fieldErrors.name).toContain('required')
      expect(result.fieldErrors.email).toContain('required')
    })

    test('should validate email format', () => {
      const validator = new FormValidator({
        email: { email: true }
      })

      const invalidEmail = validator.validateField('email', 'invalid-email')
      expect(invalidEmail).toBeTruthy()
      expect(invalidEmail?.message).toContain('valid email')

      const validEmail = validator.validateField('email', 'test@example.com')
      expect(validEmail).toBeNull()
    })

    test('should validate string length', () => {
      const validator = new FormValidator({
        name: { minLength: 2, maxLength: 50 }
      })

      const tooShort = validator.validateField('name', 'a')
      expect(tooShort?.message).toContain('at least 2')

      const tooLong = validator.validateField('name', 'a'.repeat(51))
      expect(tooLong?.message).toContain('no more than 50')

      const validLength = validator.validateField('name', 'John Doe')
      expect(validLength).toBeNull()
    })

    test('should sanitize input', () => {
      const validator = new FormValidator()
      
      const sanitized = validator.sanitizeInput('<script>alert("xss")</script>test')
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('javascript:')
    })
  })

  describe('Pre-configured Validators', () => {
    test('customerSignupValidator should validate signup form', () => {
      const result = customerSignupValidator.validateForm({
        name: 'John Doe',
        email: 'john@example.com'
      })

      expect(result.isValid).toBe(true)
    })

    test('orderCheckoutValidator should validate checkout form', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const result = orderCheckoutValidator.validateForm({
        scheduledDate: tomorrow.toISOString().split('T')[0],
        scheduledTime: '12:00',
        specialInstructions: 'No onions please'
      })

      expect(result.isValid).toBe(true)
    })
  })
})

describe('API Error Handling', () => {
  describe('ApiErrorHandler', () => {
    test('should parse network errors', () => {
      const networkError = new TypeError('Failed to fetch')
      const parsed = ApiErrorHandler.parseApiError(networkError)

      expect(parsed.code).toBe('NETWORK_ERROR')
      expect(parsed.retryable).toBe(true)
      expect(parsed.suggestions).toContain('Check your internet connection')
    })

    test('should parse HTTP errors', () => {
      const httpError = {
        status: 404,
        message: 'Not found'
      }
      const parsed = ApiErrorHandler.parseApiError(httpError)

      expect(parsed.code).toBe('NOT_FOUND')
      expect(parsed.status).toBe(404)
      expect(parsed.retryable).toBe(false)
    })

    test('should parse validation errors', () => {
      const validationError = {
        status: 422,
        data: {
          error: 'Validation failed',
          details: { email: 'Invalid email format' }
        }
      }
      const parsed = ApiErrorHandler.parseApiError(validationError)

      expect(parsed.code).toBe('VALIDATION_ERROR')
      expect(parsed.details).toEqual({ email: 'Invalid email format' })
    })

    test('should format errors for user display', () => {
      const error = {
        code: 'NETWORK_ERROR',
        message: 'Connection failed',
        suggestions: ['Check connection'],
        retryable: true
      }
      const formatted = ApiErrorHandler.formatErrorForUser(error)

      expect(formatted.title).toBe('Connection Problem')
      expect(formatted.canRetry).toBe(true)
    })
  })

  describe('ApiResponseHandler', () => {
    test('should create success responses', () => {
      const response = ApiResponseHandler.success({ id: 1, name: 'Test' })
      
      expect(response.status).toBe(200)
    })

    test('should create validation error responses', () => {
      const response = ApiResponseHandler.validationError(
        { email: 'Invalid email' },
        'Validation failed'
      )
      
      expect(response.status).toBe(422)
    })

    test('should create unauthorized responses', () => {
      const response = ApiResponseHandler.unauthorized()
      
      expect(response.status).toBe(401)
    })
  })

  describe('InputValidator', () => {
    test('should validate required fields', () => {
      const validator = new InputValidator()
      validator.required('name', '')

      expect(validator.isValid()).toBe(false)
      expect(validator.getErrors().name).toContain('required')
    })

    test('should validate email format', () => {
      const validator = new InputValidator()
      validator.email('email', 'invalid-email')

      expect(validator.isValid()).toBe(false)
      expect(validator.getErrors().email).toContain('Invalid email')
    })

    test('should validate arrays', () => {
      const validator = new InputValidator()
      validator.array('items', [], 1, 10)

      expect(validator.isValid()).toBe(false)
      expect(validator.getErrors().items).toContain('at least 1')
    })

    test('should validate custom rules', () => {
      const validator = new InputValidator()
      validator.custom('age', 15, (value) => value >= 18, 'Must be 18 or older')

      expect(validator.isValid()).toBe(false)
      expect(validator.getErrors().age).toBe('Must be 18 or older')
    })
  })
})

describe('Error Recovery', () => {
  test('should provide recovery suggestions for different error types', () => {
    const networkError = ApiErrorHandler.parseApiError(new TypeError('Failed to fetch'))
    expect(networkError.suggestions).toContain('Check your internet connection')

    const unauthorizedError = ApiErrorHandler.parseApiError({ status: 401 })
    expect(unauthorizedError.suggestions?.some(s => s.includes('Log in'))).toBe(true)

    const validationError = ApiErrorHandler.parseApiError({ status: 422 })
    expect(validationError.suggestions?.some(s => s.includes('form'))).toBe(true)

    const rateLimitError = ApiErrorHandler.parseApiError({ status: 429 })
    expect(rateLimitError.suggestions?.some(s => s.includes('Wait'))).toBe(true)
  })
})

