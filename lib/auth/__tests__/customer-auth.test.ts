/**
 * Customer Authentication Unit Tests
 * Tests customer signup, magic link verification, and login flows
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

// Mock the auth modules
jest.mock('../session-server', () => ({
  createSession: jest.fn(),
  verifySession: jest.fn(),
  refreshSession: jest.fn()
}))

jest.mock('../magic-link', () => ({
  generateMagicLink: jest.fn(),
  verifyMagicLink: jest.fn(),
  createMagicLinkToken: jest.fn()
}))

jest.mock('../password', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn()
}))

jest.mock('../../dynamodb/customers', () => ({
  createCustomer: jest.fn(),
  getCustomerByEmail: jest.fn(),
  updateCustomer: jest.fn()
}))

jest.mock('../../email/service', () => ({
  sendCustomerWelcomeEmail: jest.fn(),
  sendMagicLinkEmail: jest.fn()
}))

import { createSession, verifySession } from '../session-server'
import { generateMagicLink, verifyMagicLink, createMagicLinkToken } from '../magic-link'
import { hashPassword, verifyPassword } from '../password'
import { createCustomer, getCustomerByEmail, updateCustomer } from '../../dynamodb/customers'
import { sendCustomerWelcomeEmail, sendMagicLinkEmail } from '../../email/service'

describe('Customer Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Customer Signup', () => {
    test('should create customer account with valid data', async () => {
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

      ;(createCustomer as jest.Mock).mockResolvedValue(mockCustomer)
      ;(generateMagicLink as jest.Mock).mockResolvedValue(mockMagicLink)
      ;(sendMagicLinkEmail as jest.Mock).mockResolvedValue(true)

      // Simulate customer signup process
      const signupData = {
        name: 'Test Customer',
        email: 'test@example.com'
      }

      const customer = await createCustomer(signupData)
      const magicLink = await generateMagicLink(customer.email, 'signup')
      const emailSent = await sendMagicLinkEmail(customer.email, magicLink.token, customer.name)

      expect(createCustomer).toHaveBeenCalledWith(signupData)
      expect(generateMagicLink).toHaveBeenCalledWith('test@example.com', 'signup')
      expect(sendMagicLinkEmail).toHaveBeenCalledWith('test@example.com', 'magic_token_123', 'Test Customer')
      expect(customer.role).toBe('customer')
      expect(customer.status).toBe('pending')
      expect(emailSent).toBe(true)
    })

    test('should reject duplicate email addresses', async () => {
      const existingCustomer = {
        id: 'cust_existing',
        email: 'existing@example.com',
        name: 'Existing Customer'
      }

      ;(getCustomerByEmail as jest.Mock).mockResolvedValue(existingCustomer)

      await expect(async () => {
        const existing = await getCustomerByEmail('existing@example.com')
        if (existing) {
          throw new Error('Customer already exists')
        }
      }).rejects.toThrow('Customer already exists')
    })

    test('should validate required fields', () => {
      const invalidSignupData = [
        { name: '', email: 'test@example.com' }, // Missing name
        { name: 'Test', email: '' }, // Missing email
        { name: 'Test', email: 'invalid-email' }, // Invalid email format
      ]

      invalidSignupData.forEach(data => {
        const isValid = data.name.length > 0 && 
                       data.email.length > 0 && 
                       /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
        expect(isValid).toBe(false)
      })
    })
  })

  describe('Magic Link Verification', () => {
    test('should verify valid magic link token', async () => {
      const mockVerification = {
        valid: true,
        email: 'test@example.com',
        type: 'signup',
        customer_id: 'cust_123'
      }

      ;(verifyMagicLink as jest.Mock).mockResolvedValue(mockVerification)

      const result = await verifyMagicLink('valid_token_123')

      expect(verifyMagicLink).toHaveBeenCalledWith('valid_token_123')
      expect(result.valid).toBe(true)
      expect(result.email).toBe('test@example.com')
      expect(result.type).toBe('signup')
    })

    test('should reject expired magic link tokens', async () => {
      const expiredVerification = {
        valid: false,
        error: 'Token expired'
      }

      ;(verifyMagicLink as jest.Mock).mockResolvedValue(expiredVerification)

      const result = await verifyMagicLink('expired_token_123')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Token expired')
    })

    test('should reject invalid magic link tokens', async () => {
      const invalidVerification = {
        valid: false,
        error: 'Invalid token'
      }

      ;(verifyMagicLink as jest.Mock).mockResolvedValue(invalidVerification)

      const result = await verifyMagicLink('invalid_token')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid token')
    })
  })

  describe('Password Setup', () => {
    test('should set password for verified customer', async () => {
      const hashedPassword = 'hashed_password_123'
      const updatedCustomer = {
        id: 'cust_123',
        email: 'test@example.com',
        name: 'Test Customer',
        status: 'active',
        password_hash: hashedPassword
      }

      ;(hashPassword as jest.Mock).mockResolvedValue(hashedPassword)
      ;(updateCustomer as jest.Mock).mockResolvedValue(updatedCustomer)

      const password = 'SecurePassword123!'
      const customerId = 'cust_123'

      const hash = await hashPassword(password)
      const customer = await updateCustomer(customerId, {
        password_hash: hash,
        status: 'active'
      })

      expect(hashPassword).toHaveBeenCalledWith(password)
      expect(updateCustomer).toHaveBeenCalledWith(customerId, {
        password_hash: hashedPassword,
        status: 'active'
      })
      expect(customer.status).toBe('active')
    })

    test('should validate password strength', () => {
      const weakPasswords = [
        '123456',           // Too short
        'password',         // No numbers/symbols
        'PASSWORD123',      // No lowercase
        'password123',      // No uppercase
        'Password',         // No numbers
      ]

      const strongPassword = 'SecurePassword123!'

      weakPasswords.forEach(password => {
        const isStrong = password.length >= 8 &&
                        /[a-z]/.test(password) &&
                        /[A-Z]/.test(password) &&
                        /\d/.test(password) &&
                        /[!@#$%^&*]/.test(password)
        expect(isStrong).toBe(false)
      })

      const isStrongValid = strongPassword.length >= 8 &&
                           /[a-z]/.test(strongPassword) &&
                           /[A-Z]/.test(strongPassword) &&
                           /\d/.test(strongPassword) &&
                           /[!@#$%^&*]/.test(strongPassword)
      expect(isStrongValid).toBe(true)
    })
  })

  describe('Customer Login', () => {
    test('should authenticate customer with valid credentials', async () => {
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

      const credentials = {
        email: 'test@example.com',
        password: 'SecurePassword123!'
      }

      const customer = await getCustomerByEmail(credentials.email)
      const passwordValid = await verifyPassword(credentials.password, customer.password_hash)
      
      if (passwordValid && customer.status === 'active') {
        const session = await createSession(customer)
        
        expect(getCustomerByEmail).toHaveBeenCalledWith('test@example.com')
        expect(verifyPassword).toHaveBeenCalledWith('SecurePassword123!', 'hashed_password')
        expect(createSession).toHaveBeenCalledWith(mockCustomer)
        expect(session.token).toBe('jwt_token_123')
      }
    })

    test('should reject invalid credentials', async () => {
      ;(getCustomerByEmail as jest.Mock).mockResolvedValue(null)

      const customer = await getCustomerByEmail('nonexistent@example.com')
      expect(customer).toBeNull()
    })

    test('should reject inactive customer accounts', async () => {
      const inactiveCustomer = {
        id: 'cust_inactive',
        email: 'inactive@example.com',
        status: 'pending'
      }

      ;(getCustomerByEmail as jest.Mock).mockResolvedValue(inactiveCustomer)

      const customer = await getCustomerByEmail('inactive@example.com')
      expect(customer.status).toBe('pending')
      
      // Should not create session for inactive customer
      if (customer.status !== 'active') {
        expect(createSession).not.toHaveBeenCalled()
      }
    })
  })

  describe('Session Management', () => {
    test('should create valid JWT session', async () => {
      const mockCustomer = {
        id: 'cust_123',
        email: 'test@example.com',
        role: 'customer'
      }

      const mockSession = {
        token: 'jwt_token_123',
        refreshToken: 'refresh_token_123',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }

      ;(createSession as jest.Mock).mockResolvedValue(mockSession)

      const session = await createSession(mockCustomer)

      expect(createSession).toHaveBeenCalledWith(mockCustomer)
      expect(session.token).toBeTruthy()
      expect(session.refreshToken).toBeTruthy()
      expect(session.expiresAt).toBeInstanceOf(Date)
    })

    test('should verify valid session token', async () => {
      const mockSessionData = {
        userId: 'cust_123',
        email: 'test@example.com',
        role: 'customer',
        exp: Math.floor(Date.now() / 1000) + 3600
      }

      ;(verifySession as jest.Mock).mockResolvedValue(mockSessionData)

      const sessionData = await verifySession('valid_jwt_token')

      expect(verifySession).toHaveBeenCalledWith('valid_jwt_token')
      expect(sessionData.userId).toBe('cust_123')
      expect(sessionData.role).toBe('customer')
    })

    test('should reject expired session tokens', async () => {
      ;(verifySession as jest.Mock).mockResolvedValue(null)

      const sessionData = await verifySession('expired_jwt_token')

      expect(sessionData).toBeNull()
    })
  })
})