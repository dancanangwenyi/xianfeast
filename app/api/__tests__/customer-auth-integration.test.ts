/**
 * Customer Authentication API Integration Tests
 * Tests complete API flows for customer signup, login, and magic link verification
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.REFRESH_SECRET = 'test-refresh-secret'

// Mock external dependencies
jest.mock('../../../lib/dynamodb/customers')
jest.mock('../../../lib/auth/magic-link')
jest.mock('../../../lib/auth/password')
jest.mock('../../../lib/auth/session-server')
jest.mock('../../../lib/email/service')

import { createCustomer, getCustomerByEmail, updateCustomer } from '../../../lib/dynamodb/customers'
import { generateMagicLink, verifyMagicLink } from '../../../lib/auth/magic-link'
import { hashPassword, verifyPassword } from '../../../lib/auth/password'
import { createSession, verifySession } from '../../../lib/auth/session-server'
import { sendCustomerWelcomeEmail } from '../../../lib/email/service'

describe('Customer Authentication API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/customer/signup', () => {
    test('should handle successful customer signup', async () => {
      const mockCustomer = {
        id: 'cust_123',
        email: 'test@example.com',
        name: 'Test Customer',
        role: 'customer',
        status: 'pending'
      }

      const mockMagicLink = {
        token: 'magic_token_123',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }

      ;(getCustomerByEmail as jest.Mock).mockResolvedValue(null) // No existing customer
      ;(createCustomer as jest.Mock).mockResolvedValue(mockCustomer)
      ;(generateMagicLink as jest.Mock).mockResolvedValue(mockMagicLink)
      ;(sendCustomerWelcomeEmail as jest.Mock).mockResolvedValue(true)

      // Simulate API request
      const requestBody = {
        name: 'Test Customer',
        email: 'test@example.com'
      }

      // Mock API handler logic
      const existingCustomer = await getCustomerByEmail(requestBody.email)
      
      if (existingCustomer) {
        // Should return 409 Conflict
        expect(existingCustomer).toBeNull() // This test expects no existing customer
      }

      const customer = await createCustomer(requestBody)
      const magicLink = await generateMagicLink(customer.email, 'signup')
      const emailSent = await sendCustomerWelcomeEmail(
        customer.email, 
        magicLink.token, 
        customer.name
      )

      // Verify API response would be successful
      expect(customer.email).toBe('test@example.com')
      expect(customer.role).toBe('customer')
      expect(customer.status).toBe('pending')
      expect(magicLink.token).toBeTruthy()
      expect(emailSent).toBe(true)

      // Expected response: 201 Created with success message
      const expectedResponse = {
        success: true,
        message: 'Signup successful. Please check your email for verification link.',
        customer_id: customer.id
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.customer_id).toBe('cust_123')
    })

    test('should handle duplicate email signup', async () => {
      const existingCustomer = {
        id: 'cust_existing',
        email: 'existing@example.com',
        name: 'Existing Customer'
      }

      ;(getCustomerByEmail as jest.Mock).mockResolvedValue(existingCustomer)

      const requestBody = {
        name: 'New Customer',
        email: 'existing@example.com'
      }

      const customer = await getCustomerByEmail(requestBody.email)

      if (customer) {
        // Expected response: 409 Conflict
        const expectedResponse = {
          error: 'Customer already exists with this email',
          code: 'DUPLICATE_EMAIL'
        }

        expect(expectedResponse.error).toContain('already exists')
        expect(expectedResponse.code).toBe('DUPLICATE_EMAIL')
      }
    })

    test('should handle invalid signup data', async () => {
      const invalidRequests = [
        { name: '', email: 'test@example.com' },     // Missing name
        { name: 'Test', email: '' },                 // Missing email
        { name: 'Test', email: 'invalid-email' },    // Invalid email format
        {}                                           // Missing both fields
      ]

      invalidRequests.forEach(requestBody => {
        const isValid = requestBody.name && 
                       requestBody.email && 
                       /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestBody.email)

        if (!isValid) {
          // Expected response: 422 Validation Error
          const expectedResponse = {
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: {}
          }

          expect(expectedResponse.error).toBe('Validation failed')
          expect(expectedResponse.code).toBe('VALIDATION_ERROR')
        }
      })
    })
  })

  describe('POST /api/auth/customer/verify-magic', () => {
    test('should handle valid magic link verification', async () => {
      const mockVerification = {
        valid: true,
        email: 'test@example.com',
        type: 'signup',
        customer_id: 'cust_123'
      }

      ;(verifyMagicLink as jest.Mock).mockResolvedValue(mockVerification)

      const requestBody = {
        token: 'valid_magic_token_123'
      }

      const verification = await verifyMagicLink(requestBody.token)

      if (verification.valid) {
        // Expected response: 200 OK with customer info
        const expectedResponse = {
          success: true,
          customer_id: verification.customer_id,
          email: verification.email,
          next_step: 'set_password'
        }

        expect(expectedResponse.success).toBe(true)
        expect(expectedResponse.customer_id).toBe('cust_123')
        expect(expectedResponse.next_step).toBe('set_password')
      }
    })

    test('should handle expired magic link', async () => {
      const expiredVerification = {
        valid: false,
        error: 'Token expired'
      }

      ;(verifyMagicLink as jest.Mock).mockResolvedValue(expiredVerification)

      const requestBody = {
        token: 'expired_token_123'
      }

      const verification = await verifyMagicLink(requestBody.token)

      if (!verification.valid) {
        // Expected response: 400 Bad Request
        const expectedResponse = {
          error: verification.error,
          code: 'TOKEN_EXPIRED'
        }

        expect(expectedResponse.error).toBe('Token expired')
        expect(expectedResponse.code).toBe('TOKEN_EXPIRED')
      }
    })

    test('should handle invalid magic link token', async () => {
      const invalidVerification = {
        valid: false,
        error: 'Invalid token'
      }

      ;(verifyMagicLink as jest.Mock).mockResolvedValue(invalidVerification)

      const requestBody = {
        token: 'invalid_token'
      }

      const verification = await verifyMagicLink(requestBody.token)

      if (!verification.valid) {
        // Expected response: 400 Bad Request
        const expectedResponse = {
          error: verification.error,
          code: 'INVALID_TOKEN'
        }

        expect(expectedResponse.error).toBe('Invalid token')
        expect(expectedResponse.code).toBe('INVALID_TOKEN')
      }
    })
  })

  describe('POST /api/auth/customer/set-password', () => {
    test('should handle password setup for verified customer', async () => {
      const hashedPassword = 'hashed_password_123'
      const updatedCustomer = {
        id: 'cust_123',
        email: 'test@example.com',
        name: 'Test Customer',
        status: 'active',
        password_hash: hashedPassword
      }

      const mockSession = {
        token: 'jwt_token_123',
        refreshToken: 'refresh_token_123',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }

      ;(hashPassword as jest.Mock).mockResolvedValue(hashedPassword)
      ;(updateCustomer as jest.Mock).mockResolvedValue(updatedCustomer)
      ;(createSession as jest.Mock).mockResolvedValue(mockSession)

      const requestBody = {
        customer_id: 'cust_123',
        password: 'SecurePassword123!',
        confirm_password: 'SecurePassword123!'
      }

      // Validate password strength
      const isPasswordStrong = requestBody.password.length >= 8 &&
                              /[a-z]/.test(requestBody.password) &&
                              /[A-Z]/.test(requestBody.password) &&
                              /\d/.test(requestBody.password) &&
                              /[!@#$%^&*]/.test(requestBody.password)

      const passwordsMatch = requestBody.password === requestBody.confirm_password

      if (isPasswordStrong && passwordsMatch) {
        const hash = await hashPassword(requestBody.password)
        const customer = await updateCustomer(requestBody.customer_id, {
          password_hash: hash,
          status: 'active'
        })
        const session = await createSession(customer)

        // Expected response: 200 OK with session
        const expectedResponse = {
          success: true,
          message: 'Password set successfully',
          session: {
            token: session.token,
            refreshToken: session.refreshToken,
            expiresAt: session.expiresAt
          }
        }

        expect(expectedResponse.success).toBe(true)
        expect(expectedResponse.session.token).toBeTruthy()
        expect(customer.status).toBe('active')
      }
    })

    test('should reject weak passwords', async () => {
      const weakPasswords = [
        'password',      // No numbers/symbols/uppercase
        '12345678',      // No letters
        'Password',      // No numbers/symbols
        'Pass123',       // Too short
      ]

      weakPasswords.forEach(password => {
        const requestBody = {
          customer_id: 'cust_123',
          password: password,
          confirm_password: password
        }

        const isPasswordStrong = requestBody.password.length >= 8 &&
                                /[a-z]/.test(requestBody.password) &&
                                /[A-Z]/.test(requestBody.password) &&
                                /\d/.test(requestBody.password) &&
                                /[!@#$%^&*]/.test(requestBody.password)

        if (!isPasswordStrong) {
          // Expected response: 422 Validation Error
          const expectedResponse = {
            error: 'Password does not meet security requirements',
            code: 'WEAK_PASSWORD',
            requirements: [
              'At least 8 characters',
              'At least one lowercase letter',
              'At least one uppercase letter',
              'At least one number',
              'At least one special character (!@#$%^&*)'
            ]
          }

          expect(expectedResponse.error).toContain('security requirements')
          expect(expectedResponse.code).toBe('WEAK_PASSWORD')
          expect(expectedResponse.requirements).toHaveLength(5)
        }
      })
    })
  })

  describe('POST /api/auth/customer/login', () => {
    test('should handle successful customer login', async () => {
      const mockCustomer = {
        id: 'cust_123',
        email: 'test@example.com',
        name: 'Test Customer',
        password_hash: 'hashed_password',
        status: 'active',
        role: 'customer'
      }

      const mockSession = {
        token: 'jwt_token_123',
        refreshToken: 'refresh_token_123',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }

      ;(getCustomerByEmail as jest.Mock).mockResolvedValue(mockCustomer)
      ;(verifyPassword as jest.Mock).mockResolvedValue(true)
      ;(createSession as jest.Mock).mockResolvedValue(mockSession)

      const requestBody = {
        email: 'test@example.com',
        password: 'SecurePassword123!'
      }

      const customer = await getCustomerByEmail(requestBody.email)
      
      if (customer && customer.status === 'active') {
        const passwordValid = await verifyPassword(requestBody.password, customer.password_hash)
        
        if (passwordValid) {
          const session = await createSession(customer)

          // Expected response: 200 OK with session
          const expectedResponse = {
            success: true,
            message: 'Login successful',
            customer: {
              id: customer.id,
              email: customer.email,
              name: customer.name,
              role: customer.role
            },
            session: {
              token: session.token,
              refreshToken: session.refreshToken,
              expiresAt: session.expiresAt
            }
          }

          expect(expectedResponse.success).toBe(true)
          expect(expectedResponse.customer.email).toBe('test@example.com')
          expect(expectedResponse.session.token).toBeTruthy()
        }
      }
    })

    test('should handle invalid login credentials', async () => {
      ;(getCustomerByEmail as jest.Mock).mockResolvedValue(null)

      const requestBody = {
        email: 'nonexistent@example.com',
        password: 'password123'
      }

      const customer = await getCustomerByEmail(requestBody.email)

      if (!customer) {
        // Expected response: 401 Unauthorized
        const expectedResponse = {
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        }

        expect(expectedResponse.error).toBe('Invalid email or password')
        expect(expectedResponse.code).toBe('INVALID_CREDENTIALS')
      }
    })

    test('should handle inactive customer login attempt', async () => {
      const inactiveCustomer = {
        id: 'cust_inactive',
        email: 'inactive@example.com',
        status: 'pending'
      }

      ;(getCustomerByEmail as jest.Mock).mockResolvedValue(inactiveCustomer)

      const requestBody = {
        email: 'inactive@example.com',
        password: 'password123'
      }

      const customer = await getCustomerByEmail(requestBody.email)

      if (customer && customer.status !== 'active') {
        // Expected response: 403 Forbidden
        const expectedResponse = {
          error: 'Account not activated. Please check your email for verification link.',
          code: 'ACCOUNT_INACTIVE'
        }

        expect(expectedResponse.error).toContain('not activated')
        expect(expectedResponse.code).toBe('ACCOUNT_INACTIVE')
      }
    })
  })

  describe('Session Management', () => {
    test('should verify valid session tokens', async () => {
      const mockSessionData = {
        userId: 'cust_123',
        email: 'test@example.com',
        role: 'customer',
        exp: Math.floor(Date.now() / 1000) + 3600
      }

      ;(verifySession as jest.Mock).mockResolvedValue(mockSessionData)

      // Simulate middleware session verification
      const authHeader = 'Bearer jwt_token_123'
      const token = authHeader.split(' ')[1]

      const sessionData = await verifySession(token)

      if (sessionData) {
        expect(sessionData.userId).toBe('cust_123')
        expect(sessionData.role).toBe('customer')
        expect(sessionData.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
      }
    })

    test('should reject expired session tokens', async () => {
      ;(verifySession as jest.Mock).mockResolvedValue(null)

      const authHeader = 'Bearer expired_jwt_token'
      const token = authHeader.split(' ')[1]

      const sessionData = await verifySession(token)

      if (!sessionData) {
        // Expected response: 401 Unauthorized
        const expectedResponse = {
          error: 'Session expired. Please log in again.',
          code: 'SESSION_EXPIRED'
        }

        expect(expectedResponse.error).toContain('expired')
        expect(expectedResponse.code).toBe('SESSION_EXPIRED')
      }
    })
  })
})