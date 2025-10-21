/**
 * API Response Handler for Customer Routes
 * Provides consistent error responses and validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { ApiError, ApiErrorHandler } from './api-error-handler'

export interface ApiResponseOptions {
  context?: string
  logError?: boolean
  includeStack?: boolean
}

export class ApiResponseHandler {
  /**
   * Create success response
   */
  static success<T>(data: T, status: number = 200): NextResponse {
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    }, { status })
  }

  /**
   * Create error response
   */
  static error(
    error: any,
    options: ApiResponseOptions = {}
  ): NextResponse {
    const { context, logError = true, includeStack = false } = options
    
    // Parse the error
    const apiError = ApiErrorHandler.parseApiError(error, context)
    
    // Log error if enabled
    if (logError) {
      console.error(`API Error [${context || 'Unknown'}]:`, {
        message: apiError.message,
        code: apiError.code,
        status: apiError.status,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    }

    // Create response body
    const responseBody: any = {
      success: false,
      error: apiError.message,
      code: apiError.code,
      timestamp: new Date().toISOString()
    }

    // Include additional details if available
    if (apiError.details) {
      responseBody.details = apiError.details
    }

    // Include suggestions for client-side error handling
    if (apiError.suggestions) {
      responseBody.suggestions = apiError.suggestions
    }

    // Include stack trace in development
    if (includeStack && process.env.NODE_ENV === 'development' && error.stack) {
      responseBody.stack = error.stack
    }

    return NextResponse.json(responseBody, { 
      status: apiError.status || 500 
    })
  }

  /**
   * Create validation error response
   */
  static validationError(
    errors: Record<string, string> | string[],
    message: string = 'Validation failed'
  ): NextResponse {
    return NextResponse.json({
      success: false,
      error: message,
      code: 'VALIDATION_ERROR',
      details: Array.isArray(errors) ? { errors } : errors,
      timestamp: new Date().toISOString()
    }, { status: 422 })
  }

  /**
   * Create unauthorized response
   */
  static unauthorized(message: string = 'Authentication required'): NextResponse {
    return NextResponse.json({
      success: false,
      error: message,
      code: 'UNAUTHORIZED',
      suggestions: [
        'Log in to your account',
        'Check your session is still valid',
        'Contact support if login issues persist'
      ],
      timestamp: new Date().toISOString()
    }, { status: 401 })
  }

  /**
   * Create forbidden response
   */
  static forbidden(message: string = 'Access denied'): NextResponse {
    return NextResponse.json({
      success: false,
      error: message,
      code: 'FORBIDDEN',
      suggestions: [
        'Contact your administrator for access',
        'Verify you have the correct permissions',
        'Log out and log back in'
      ],
      timestamp: new Date().toISOString()
    }, { status: 403 })
  }

  /**
   * Create not found response
   */
  static notFound(resource: string = 'Resource'): NextResponse {
    return NextResponse.json({
      success: false,
      error: `${resource} not found`,
      code: 'NOT_FOUND',
      suggestions: [
        'Check the URL is correct',
        'Verify the resource exists',
        'Contact support if you believe this is an error'
      ],
      timestamp: new Date().toISOString()
    }, { status: 404 })
  }

  /**
   * Create rate limit response
   */
  static rateLimited(retryAfter?: number): NextResponse {
    const headers: Record<string, string> = {}
    if (retryAfter) {
      headers['Retry-After'] = retryAfter.toString()
    }

    return NextResponse.json({
      success: false,
      error: 'Too many requests',
      code: 'RATE_LIMITED',
      retryAfter,
      suggestions: [
        'Wait a few minutes before trying again',
        'Avoid rapid repeated requests',
        'Contact support if rate limiting persists'
      ],
      timestamp: new Date().toISOString()
    }, { 
      status: 429,
      headers
    })
  }
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandling(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: ApiResponseOptions = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context)
    } catch (error) {
      return ApiResponseHandler.error(error, options)
    }
  }
}

/**
 * Input validation helper
 */
export class InputValidator {
  private errors: Record<string, string> = {}

  /**
   * Validate required field
   */
  required(field: string, value: any, message?: string): this {
    if (value === null || value === undefined || String(value).trim() === '') {
      this.errors[field] = message || `${this.formatFieldName(field)} is required`
    }
    return this
  }

  /**
   * Validate email format
   */
  email(field: string, value: string, message?: string): this {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      this.errors[field] = message || 'Invalid email format'
    }
    return this
  }

  /**
   * Validate string length
   */
  length(field: string, value: string, min?: number, max?: number, message?: string): this {
    if (value) {
      const length = value.length
      if (min && length < min) {
        this.errors[field] = message || `${this.formatFieldName(field)} must be at least ${min} characters`
      } else if (max && length > max) {
        this.errors[field] = message || `${this.formatFieldName(field)} must be no more than ${max} characters`
      }
    }
    return this
  }

  /**
   * Validate numeric range
   */
  range(field: string, value: number, min?: number, max?: number, message?: string): this {
    if (typeof value === 'number') {
      if (min !== undefined && value < min) {
        this.errors[field] = message || `${this.formatFieldName(field)} must be at least ${min}`
      } else if (max !== undefined && value > max) {
        this.errors[field] = message || `${this.formatFieldName(field)} must be no more than ${max}`
      }
    }
    return this
  }

  /**
   * Validate array
   */
  array(field: string, value: any, minLength?: number, maxLength?: number, message?: string): this {
    if (value && Array.isArray(value)) {
      if (minLength && value.length < minLength) {
        this.errors[field] = message || `${this.formatFieldName(field)} must have at least ${minLength} items`
      } else if (maxLength && value.length > maxLength) {
        this.errors[field] = message || `${this.formatFieldName(field)} must have no more than ${maxLength} items`
      }
    } else if (value !== undefined && value !== null) {
      this.errors[field] = message || `${this.formatFieldName(field)} must be an array`
    }
    return this
  }

  /**
   * Custom validation
   */
  custom(field: string, value: any, validator: (value: any) => boolean, message: string): this {
    if (!validator(value)) {
      this.errors[field] = message
    }
    return this
  }

  /**
   * Check if validation passed
   */
  isValid(): boolean {
    return Object.keys(this.errors).length === 0
  }

  /**
   * Get validation errors
   */
  getErrors(): Record<string, string> {
    return this.errors
  }

  /**
   * Throw validation error if invalid
   */
  validate(): void {
    if (!this.isValid()) {
      throw {
        status: 422,
        message: 'Validation failed',
        details: this.errors
      }
    }
  }

  /**
   * Format field name for error messages
   */
  private formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ')
  }
}

/**
 * Sanitize input data
 */
export function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    return data
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInput)
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return data
}