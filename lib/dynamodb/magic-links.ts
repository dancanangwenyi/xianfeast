import { dynamoClient, TABLE_NAMES } from './client'
import { 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  QueryCommand, 
  DeleteCommand 
} from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'

export interface MagicLink {
  id: string
  token: string
  user_id: string
  business_id?: string
  type: 'business_invitation' | 'password_reset' | 'user_invitation'
  expires_at: string
  used: boolean
  created_at: string
}

export interface OTPCode {
  id: string
  user_id: string
  code: string
  expires_at: string
  used: boolean
  created_at: string
}

/**
 * Create magic link
 */
export async function createMagicLink(linkData: Omit<MagicLink, 'id' | 'created_at'>): Promise<MagicLink> {
  const link: MagicLink = {
    id: uuidv4(),
    ...linkData,
    created_at: new Date().toISOString(),
  }

  const command = new PutCommand({
    TableName: TABLE_NAMES.MAGIC_LINKS,
    Item: link,
  })

  await dynamoClient.send(command)
  return link
}

/**
 * Get magic link by token
 */
export async function getMagicLinkByToken(token: string): Promise<MagicLink | null> {
  const command = new QueryCommand({
    TableName: TABLE_NAMES.MAGIC_LINKS,
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
  return result.Items?.[0] as MagicLink || null
}

/**
 * Mark magic link as used
 */
export async function markMagicLinkAsUsed(token: string): Promise<void> {
  const magicLink = await getMagicLinkByToken(token)
  if (!magicLink) {
    throw new Error('Magic link not found')
  }

  const command = new UpdateCommand({
    TableName: TABLE_NAMES.MAGIC_LINKS,
    Key: { id: magicLink.id },
    UpdateExpression: 'SET used = :used',
    ExpressionAttributeValues: {
      ':used': true,
    },
  })

  await dynamoClient.send(command)
}

/**
 * Delete expired magic links
 */
export async function deleteExpiredMagicLinks(): Promise<void> {
  const now = new Date().toISOString()
  
  // This is a simplified version - in production you'd want to use a more efficient approach
  const command = new QueryCommand({
    TableName: TABLE_NAMES.MAGIC_LINKS,
    FilterExpression: 'expires_at < :now',
    ExpressionAttributeValues: {
      ':now': now,
    },
  })

  const result = await dynamoClient.send(command)
  const expiredLinks = result.Items as MagicLink[] || []

  for (const link of expiredLinks) {
    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAMES.MAGIC_LINKS,
      Key: { id: link.id },
    })
    await dynamoClient.send(deleteCommand)
  }
}

/**
 * Create OTP code
 */
export async function createOTPCode(otpData: Omit<OTPCode, 'id' | 'created_at'>): Promise<OTPCode> {
  const otp: OTPCode = {
    id: uuidv4(),
    ...otpData,
    created_at: new Date().toISOString(),
  }

  const command = new PutCommand({
    TableName: TABLE_NAMES.OTP_CODES,
    Item: otp,
  })

  await dynamoClient.send(command)
  return otp
}

/**
 * Get OTP code by ID
 */
export async function getOTPCodeById(id: string): Promise<OTPCode | null> {
  const command = new GetCommand({
    TableName: TABLE_NAMES.OTP_CODES,
    Key: { id },
  })

  const result = await dynamoClient.send(command)
  return result.Item as OTPCode || null
}

/**
 * Mark OTP code as used
 */
export async function markOTPCodeAsUsed(id: string): Promise<void> {
  const command = new UpdateCommand({
    TableName: TABLE_NAMES.OTP_CODES,
    Key: { id },
    UpdateExpression: 'SET used = :used',
    ExpressionAttributeValues: {
      ':used': true,
    },
  })

  await dynamoClient.send(command)
}

/**
 * Delete expired OTP codes
 */
export async function deleteExpiredOTPCodes(): Promise<void> {
  const now = new Date().toISOString()
  
  // This is a simplified version - in production you'd want to use a more efficient approach
  const command = new QueryCommand({
    TableName: TABLE_NAMES.OTP_CODES,
    FilterExpression: 'expires_at < :now',
    ExpressionAttributeValues: {
      ':now': now,
    },
  })

  const result = await dynamoClient.send(command)
  const expiredCodes = result.Items as OTPCode[] || []

  for (const code of expiredCodes) {
    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAMES.OTP_CODES,
      Key: { id: code.id },
    })
    await dynamoClient.send(deleteCommand)
  }
}