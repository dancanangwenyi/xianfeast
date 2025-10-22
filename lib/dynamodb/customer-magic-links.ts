import { dynamoClient, TABLE_NAMES } from './client'
import { 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  QueryCommand, 
  DeleteCommand,
  ScanCommand 
} from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import * as crypto from 'crypto'

export interface CustomerMagicLink {
  id: string
  email: string
  token: string
  type: 'signup' | 'password_reset'
  expires_at: string
  used: boolean
  created_at: string
  user_id?: string
}

/**
 * Generate secure token for magic link
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create customer magic link
 */
export async function createCustomerMagicLink(linkData: {
  email: string
  type: 'signup' | 'password_reset'
  user_id?: string
  expirationHours?: number
}): Promise<CustomerMagicLink> {
  const expirationHours = linkData.expirationHours || 24
  const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString()
  
  const magicLink: CustomerMagicLink = {
    id: uuidv4(),
    email: linkData.email.toLowerCase(),
    token: generateSecureToken(),
    type: linkData.type,
    expires_at: expiresAt,
    used: false,
    created_at: new Date().toISOString(),
    user_id: linkData.user_id
  }

  const command = new PutCommand({
    TableName: TABLE_NAMES.CUSTOMER_MAGIC_LINKS,
    Item: magicLink,
  })

  await dynamoClient.send(command)
  return magicLink
}

/**
 * Get customer magic link by token
 */
export async function getCustomerMagicLinkByToken(token: string): Promise<CustomerMagicLink | null> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.CUSTOMER_MAGIC_LINKS,
    IndexName: 'token-index',
    KeyConditionExpression: '#token = :token',
    ExpressionAttributeNames: {
      '#token': 'token',
    },
    ExpressionAttributeValues: {
      ':token': token,
    },
  })

  const result = await dynamoClient.send(command)
  return result.Items?.[0] as CustomerMagicLink || null
}

/**
 * Get customer magic link by email and type
 */
export async function getCustomerMagicLinkByEmail(
  email: string, 
  type?: 'signup' | 'password_reset'
): Promise<CustomerMagicLink | null> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.CUSTOMER_MAGIC_LINKS,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    FilterExpression: type ? '#type = :type AND used = :used AND expires_at > :now' : 'used = :used AND expires_at > :now',
    ExpressionAttributeNames: type ? { '#type': 'type' } : undefined,
    ExpressionAttributeValues: {
      ':email': email.toLowerCase(),
      ':used': false,
      ':now': new Date().toISOString(),
      ...(type && { ':type': type })
    },
    ScanIndexForward: false, // Get most recent first
    Limit: 1
  })

  const result = await dynamoClient.send(command)
  return result.Items?.[0] as CustomerMagicLink || null
}

/**
 * Verify and validate customer magic link
 */
export async function verifyCustomerMagicLink(token: string): Promise<{
  valid: boolean
  magicLink?: CustomerMagicLink
  error?: string
}> {
  const magicLink = await getCustomerMagicLinkByToken(token)
  
  if (!magicLink) {
    return { valid: false, error: 'Invalid magic link token' }
  }

  if (magicLink.used) {
    return { valid: false, error: 'Magic link has already been used' }
  }

  if (new Date(magicLink.expires_at) <= new Date()) {
    return { valid: false, error: 'Magic link has expired' }
  }

  return { valid: true, magicLink }
}

/**
 * Mark customer magic link as used
 */
export async function markCustomerMagicLinkAsUsed(token: string): Promise<void> {
  const magicLink = await getCustomerMagicLinkByToken(token)
  if (!magicLink) {
    throw new Error('Magic link not found')
  }

  const command = new UpdateCommand({
    TableName: TABLE_NAMES.CUSTOMER_MAGIC_LINKS,
    Key: { id: magicLink.id },
    UpdateExpression: 'SET used = :used',
    ExpressionAttributeValues: {
      ':used': true,
    },
  })

  await dynamoClient.send(command)
}

/**
 * Invalidate all magic links for an email
 */
export async function invalidateCustomerMagicLinksForEmail(email: string): Promise<void> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.CUSTOMER_MAGIC_LINKS,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    FilterExpression: 'used = :used',
    ExpressionAttributeValues: {
      ':email': email.toLowerCase(),
      ':used': false
    }
  })

  const result = await dynamoClient.send(command)
  const activeLinks = result.Items as CustomerMagicLink[] || []

  // Mark all active links as used
  for (const link of activeLinks) {
    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAMES.CUSTOMER_MAGIC_LINKS,
      Key: { id: link.id },
      UpdateExpression: 'SET used = :used',
      ExpressionAttributeValues: {
        ':used': true,
      },
    })
    await dynamoClient.send(updateCommand)
  }
}

/**
 * Delete expired customer magic links
 */
export async function deleteExpiredCustomerMagicLinks(): Promise<void> {
  const now = new Date().toISOString()
  
  const command = new ScanCommand({
    TableName: TABLE_NAMES.CUSTOMER_MAGIC_LINKS,
    FilterExpression: 'expires_at < :now',
    ExpressionAttributeValues: {
      ':now': now,
    },
  })

  const result = await dynamoClient.send(command)
  const expiredLinks = result.Items as CustomerMagicLink[] || []

  for (const link of expiredLinks) {
    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAMES.CUSTOMER_MAGIC_LINKS,
      Key: { id: link.id },
    })
    await dynamoClient.send(deleteCommand)
  }
}

/**
 * Generate magic link URL for customer
 */
export function generateCustomerMagicLinkUrl(token: string, type: 'signup' | 'password_reset'): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  if (type === 'signup') {
    return `${baseUrl}/customer/auth/magic?token=${token}`
  } else {
    return `${baseUrl}/customer/auth/reset?token=${token}`
  }
}

/**
 * Create signup magic link for customer
 */
export async function createCustomerSignupMagicLink(email: string): Promise<{
  magicLink: CustomerMagicLink
  url: string
}> {
  // Invalidate any existing magic links for this email
  await invalidateCustomerMagicLinksForEmail(email)
  
  const magicLink = await createCustomerMagicLink({
    email,
    type: 'signup',
    expirationHours: 24
  })

  const url = generateCustomerMagicLinkUrl(magicLink.token, 'signup')
  
  return { magicLink, url }
}

/**
 * Create password reset magic link for customer
 */
export async function createCustomerPasswordResetMagicLink(
  email: string, 
  userId: string
): Promise<{
  magicLink: CustomerMagicLink
  url: string
}> {
  // Invalidate any existing magic links for this email
  await invalidateCustomerMagicLinksForEmail(email)
  
  const magicLink = await createCustomerMagicLink({
    email,
    type: 'password_reset',
    user_id: userId,
    expirationHours: 2 // Shorter expiration for password reset
  })

  const url = generateCustomerMagicLinkUrl(magicLink.token, 'password_reset')
  
  return { magicLink, url }
}

/**
 * Get customer magic link statistics
 */
export async function getCustomerMagicLinkStats(): Promise<{
  total: number
  active: number
  expired: number
  used: number
}> {
  const command = new ScanCommand({
    TableName: TABLE_NAMES.CUSTOMER_MAGIC_LINKS,
  })

  const result = await dynamoClient.send(command)
  const links = result.Items as CustomerMagicLink[] || []
  
  const now = new Date()
  
  return {
    total: links.length,
    active: links.filter(link => !link.used && new Date(link.expires_at) > now).length,
    expired: links.filter(link => !link.used && new Date(link.expires_at) <= now).length,
    used: links.filter(link => link.used).length
  }
}