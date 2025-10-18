import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { config } from 'dotenv'

// Load environment variables
config()

// Create DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  endpoint: process.env.DYNAMODB_ENDPOINT,
})

const docClient = DynamoDBDocumentClient.from(client)

// Table names
const TABLE_NAMES = {
  USERS: process.env.DYNAMODB_TABLE_USERS || 'xianfeast_users',
  USER_ROLES: process.env.DYNAMODB_TABLE_USER_ROLES || 'xianfeast_user_roles',
  ROLES: process.env.DYNAMODB_TABLE_ROLES || 'xianfeast_roles',
} as const

export interface User {
  id: string
  email: string
  name: string
  hashed_password: string
  roles_json: string
  mfa_enabled: boolean
  last_login: string
  status: string
  invited_by: string
  invite_token: string
  invite_expiry: string
  created_at: string
  password_change_required?: boolean
}

export interface Role {
  id: string
  business_id: string
  name: string
  permissions_csv: string
  created_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role_id: string
  business_id: string
  assigned_at: string
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAMES.USERS,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    })
    
    const result = await docClient.send(command)
    return result.Items?.[0] as User || null
  } catch (error) {
    console.error('Error getting user by email:', error)
    return null
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAMES.USERS,
      Key: { id }
    })
    
    const result = await docClient.send(command)
    return result.Item as User || null
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return null
  }
}

/**
 * Get user roles
 */
export async function getUserRoles(userId: string): Promise<Role[]> {
  try {
    // First get user-role relationships
    const userRolesCommand = new QueryCommand({
      TableName: TABLE_NAMES.USER_ROLES,
      IndexName: 'user-id-index',
      KeyConditionExpression: 'user_id = :user_id',
      ExpressionAttributeValues: {
        ':user_id': userId
      }
    })
    
    const userRolesResult = await docClient.send(userRolesCommand)
    const userRoles = userRolesResult.Items as UserRole[] || []
    
    if (userRoles.length === 0) {
      return []
    }
    
    // Get role details for each role ID
    const roles: Role[] = []
    for (const userRole of userRoles) {
      const roleCommand = new GetCommand({
        TableName: TABLE_NAMES.ROLES,
        Key: { id: userRole.role_id }
      })
      
      const roleResult = await docClient.send(roleCommand)
      if (roleResult.Item) {
        roles.push(roleResult.Item as Role)
      }
    }
    
    return roles
  } catch (error) {
    console.error('Error getting user roles:', error)
    return []
  }
}

/**
 * Get user with roles
 */
export async function getUserWithRoles(email: string): Promise<(User & { roles: Role[] }) | null> {
  const user = await getUserByEmail(email)
  if (!user) {
    return null
  }
  
  const roles = await getUserRoles(user.id)
  return { ...user, roles }
}

/**
 * Update user last login
 */
export async function updateUserLastLogin(userId: string): Promise<void> {
  try {
    const { UpdateCommand } = await import('@aws-sdk/lib-dynamodb')
    
    const command = new UpdateCommand({
      TableName: TABLE_NAMES.USERS,
      Key: { id: userId },
      UpdateExpression: 'SET last_login = :last_login',
      ExpressionAttributeValues: {
        ':last_login': new Date().toISOString()
      }
    })
    
    await docClient.send(command)
  } catch (error) {
    console.error('Error updating user last login:', error)
  }
}

/**
 * Check if user has permission
 */
export function hasPermission(userRoles: Role[], permission: string): boolean {
  for (const role of userRoles) {
    const permissions = role.permissions_csv.split(',')
    if (permissions.includes(permission) || permissions.includes('admin.all')) {
      return true
    }
  }
  return false
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(userRoles: Role[]): boolean {
  return userRoles.some(role => role.name === 'super_admin')
}

/**
 * Create user-role relationship
 */
export async function createUserRoleRelationship(userId: string, roleId: string, businessId: string): Promise<void> {
  try {
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb')
    
    const userRole = {
      id: uuidv4(),
      user_id: userId,
      role_id: roleId,
      business_id: businessId,
      assigned_at: new Date().toISOString()
    }
    
    const command = new PutCommand({
      TableName: TABLE_NAMES.USER_ROLES,
      Item: userRole,
    })
    
    await docClient.send(command)
  } catch (error) {
    console.error('Error creating user-role relationship:', error)
    throw error
  }
}

export default {
  getUserByEmail,
  getUserById,
  getUserRoles,
  getUserWithRoles,
  updateUserLastLogin,
  hasPermission,
  isSuperAdmin,
  createUserRoleRelationship
}
