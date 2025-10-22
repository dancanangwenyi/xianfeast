/**
 * Comprehensive API Error Handling System
 * Provides user-friendly error messages and recovery suggestions
 */

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: any
  recoverable?: boolean
  retryable?: boolean
  suggestions?: string[]
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

export class ApiErrorHandler {
  private static readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  }

  /**
   * Parse API response error into user-friendly format
   */
  static parseApiError(error: any, context?: string): ApiError {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        message: 'Unable to connect to the server. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        status: 0,
        recoverable: true,
        retryable: true,
        suggestions: [
          'Check your internet connection',
          'Try refreshing the page',
          'Contact support if the problem persists'
        ]
      }
    }

    // Timeout errors
    if (error.name === 'AbortError' || (error.message && error.message.includes('timeout'))) {
      return {
        message: 'The request took too long to complete. Please try again.',
        code: 'TIMEOUT_ERROR',
        status: 408,
        recoverable: true,
        retryable: true,
        suggestions: [
          'Try again in a few moments',
          'Check your internet connection',
          'Contact support if timeouts persist'
        ]
      }
    }

    // Parse HTTP response errors
    if (error.status) {
      return this.parseHttpError(error, context)
    }

    // Generic JavaScript errors
    return {
      message: 'An unexpected error occurred. Please try again.',
      code: 'UNKNOWN_ERROR',
      recoverable: true,
      retryable: true,
      suggestions: [
        'Try refreshing the page',
        'Clear your browser cache',
        'Contact support if the problem persists'
      ]
    }
  }

  /**
   * Parse HTTP status code errors
   */
  private static parseHttpError(error: any, context?: string): ApiError {
    const status = error.status || error.response?.status
    const data = error.data || error.response?.data || {}
    const message = data.error || data.message || error.message

    switch (status) {
      case 400:
        return {
          message: message || 'Invalid request. Please check your input and try again.',
          code: 'BAD_REQUEST',
          status: 400,
          details: data.details,
          recoverable: true,
          retryable: false,
          suggestions: [
            'Check that all required fields are filled',
            'Verify your input format is correct',
            'Contact support if you need assistance'
          ]
        }

      case 401:
        return {
          message: 'Your session has expired. Please log in again.',
          code: 'UNAUTHORIZED',
          status: 401,
          recoverable: true,
          retryable: false,
          suggestions: [
            'Log in again',
            'Clear your browser cookies',
            'Contact support if login issues persist'
          ]
        }

      case 403:
        return {
          message: 'You don\'t have permission to perform this action.',
          code: 'FORBIDDEN',
          status: 403,
          recoverable: false,
          retryable: false,
          suggestions: [
            'Contact your administrator for access',
            'Verify you have the correct permissions',
            'Log out and log back in'
          ]
        }

      case 404:
        return {
          message: this.getNotFoundMessage(context),
          code: 'NOT_FOUND',
          status: 404,
          recoverable: true,
          retryable: false,
          suggestions: [
            'Check the URL is correct',
            'Go back and try again',
            'Contact support if the item should exist'
          ]
        }

      case 409:
        return {
          message: message || 'This action conflicts with existing data.',
          code: 'CONFLICT',
          status: 409,
          recoverable: true,
          retryable: false,
          suggestions: [
            'Refresh the page to see current data',
            'Try a different approach',
            'Contact support for assistance'
          ]
        }

      case 422:
        return {
          message: message || 'The data provided is invalid.',
          code: 'VALIDATION_ERROR',
          status: 422,
          details: data.details,
          recoverable: true,
          retryable: false,
          suggestions: [
            'Check all form fields for errors',
            'Ensure required information is provided',
            'Verify data format is correct'
          ]
        }

      case 429:
        return {
          message: 'Too many requests. Please wait a moment and try again.',
          code: 'RATE_LIMITED',
          status: 429,
          recoverable: true,
          retryable: true,
          suggestions: [
            'Wait a few minutes before trying again',
            'Avoid rapid repeated requests',
            'Contact support if rate limiting persists'
          ]
        }

      case 500:
        return {
          message: 'A server error occurred. Our team has been notified.',
          code: 'SERVER_ERROR',
          status: 500,
          recoverable: true,
          retryable: true,
          suggestions: [
            'Try again in a few minutes',
            'Contact support if the error persists',
            'Check our status page for known issues'
          ]
        }

      case 502:
      case 503:
      case 504:
        return {
          message: 'The service is temporarily unavailable. Please try again shortly.',
          code: 'SERVICE_UNAVAILABLE',
          status,
          recoverable: true,
          retryable: true,
          suggestions: [
            'Try again in a few minutes',
            'Check our status page',
            'Contact support if the issue persists'
          ]
        }

      default:
        return {
          message: message || `An error occurred (${status}). Please try again.`,
          code: 'HTTP_ERROR',
          status,
          recoverable: true,
          retryable: status >= 500,
          suggestions: [
            'Try again',
            'Refresh the page',
            'Contact support if the problem persists'
          ]
        }
    }
  }

  /**
   * Get context-specific not found message
   */
  private static getNotFoundMessage(context?: string): string {
    switch (context) {
      case 'stall':
        return 'The stall you\'re looking for could not be found.'
      case 'product':
        return 'The product you\'re looking for is no longer available.'
      case 'order':
        return 'The order you\'re looking for could not be found.'
      case 'user':
        return 'The user account could not be found.'
      default:
        return 'The requested item could not be found.'
    }
  }

  /**
   * Retry API call with exponential backoff
   */
  static async retryApiCall<T>(
    apiCall: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...this.DEFAULT_RETRY_CONFIG, ...config }
    let lastError: any

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await apiCall()
      } catch (error) {
        lastError = error
        
        // Don't retry on the last attempt
        if (attempt === retryConfig.maxRetries) {
          break
        }

        // Check if error is retryable
        const apiError = this.parseApiError(error)
        if (!apiError.retryable) {
          break
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt),
          retryConfig.maxDelay
        )

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000

        await new Promise(resolve => setTimeout(resolve, jitteredDelay))
      }
    }

    throw lastError
  }

  /**
   * Create enhanced fetch with error handling and retries
   */
  static createEnhancedFetch(defaultConfig: Partial<RetryConfig> = {}) {
    return async function enhancedFetch(
      url: string,
      options: RequestInit = {},
      context?: string
    ): Promise<Response> {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      try {
        const response = await ApiErrorHandler.retryApiCall(async () => {
          const fetchResponse = await fetch(url, {
            ...options,
            signal: controller.signal
          })

          if (!fetchResponse.ok) {
            const errorData = await fetchResponse.json().catch(() => ({}))
            throw {
              status: fetchResponse.status,
              data: errorData,
              message: errorData.error || fetchResponse.statusText
            }
          }

          return fetchResponse
        }, defaultConfig)

        clearTimeout(timeoutId)
        return response
      } catch (error) {
        clearTimeout(timeoutId)
        throw ApiErrorHandler.parseApiError(error, context)
      }
    }
  }

  /**
   * Format error for user display
   */
  static formatErrorForUser(error: ApiError): {
    title: string
    message: string
    suggestions: string[]
    canRetry: boolean
  } {
    return {
      title: this.getErrorTitle(error.code),
      message: error.message,
      suggestions: error.suggestions || [],
      canRetry: error.retryable || false
    }
  }

  /**
   * Get user-friendly error title
   */
  private static getErrorTitle(code?: string): string {
    switch (code) {
      case 'NETWORK_ERROR':
        return 'Connection Problem'
      case 'TIMEOUT_ERROR':
        return 'Request Timeout'
      case 'UNAUTHORIZED':
        return 'Session Expired'
      case 'FORBIDDEN':
        return 'Access Denied'
      case 'NOT_FOUND':
        return 'Not Found'
      case 'VALIDATION_ERROR':
        return 'Invalid Data'
      case 'RATE_LIMITED':
        return 'Too Many Requests'
      case 'SERVER_ERROR':
        return 'Server Error'
      case 'SERVICE_UNAVAILABLE':
        return 'Service Unavailable'
      default:
        return 'Error'
    }
  }
}

/**
 * Enhanced fetch instance for customer API calls
 */
export const customerApi = ApiErrorHandler.createEnhancedFetch({
  maxRetries: 2,
  baseDelay: 1000,
  maxDelay: 5000
})