import { dynamoClient, TABLE_NAMES } from './client'
import { 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  QueryCommand, 
  ScanCommand 
} from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'

export interface User {
  id: string
  email: string
  name: string
  hashed_password?: string
  business_id?: string
  roles_json: string
  mfa_enabled: boolean
  last_login?: string
  status: 'pending' | 'active' | 'suspended' | 'deleted'
  invited_by?: string
  invite_token?: string
  invite_expiry?: string
  password_change_required?: boolean
  created_at: string
  updated_at: string
  // Customer-specific fields
  customer_preferences?: CustomerPreferences
  customer_stats?: CustomerStats
}

export interface CustomerPreferences {
  dietary_restrictions: string[]
  favorite_stalls: string[]
  default_delivery_address?: string
  notification_preferences: {
    email: boolean
    sms: boolean
    push: boolean
  }
}

export interface CustomerStats {
  total_orders: number
  total_spent_cents: number
  favorite_products: string[]
  last_order_date?: string
}

export interface Role {
  id: string
  business_id: string
  role_name: string
  permissions_csv: string
  created_at: string
}

export interface UserRole {
  role_id: string
  business_id: string
  user_id: string
  assigned_at: string
}

/**
 * Create a new user
 */
export async function createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
  const user: User = {
    id: uuidv4(),
    ...userData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const command = new PutCommand({
    TableName: TABLE_NAMES.USERS,
    Item: user,
  })

  await dynamoClient.send(command)
  return user
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const command = new GetCommand({
    TableName: TABLE_NAMES.USERS,
    Key: { id },
  })

  const result = await dynamoClient.send(command)
  return result.Item as User || null
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  // Use scan with filter instead of query to avoid index issues
  const command = new ScanCommand({
    TableName: TABLE_NAMES.USERS,
    FilterExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email,
    },
  })

  const result = await dynamoClient.send(command)
  return result.Items?.[0] as User || null
}

/**
 * Update user
 */
export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const updateExpressions: string[] = []
  const expressionAttributeValues: Record<string, any> = {}
  const expressionAttributeNames: Record<string, string> = {}

  // Build update expression dynamically
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      updateExpressions.push(`#${key} = :${key}`)
      expressionAttributeNames[`#${key}`] = key
      expressionAttributeValues[`:${key}`] = value
    }
  })

  if (updateExpressions.length === 0) {
    return null
  }

  updateExpressions.push('#updated_at = :updated_at')
  expressionAttributeNames['#updated_at'] = 'updated_at'
  expressionAttributeValues[':updated_at'] = new Date().toISOString()

  const command = new UpdateCommand({
    TableName: TABLE_NAMES.USERS,
    Key: { id },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  })

  const result = await dynamoClient.send(command)
  return result.Attributes as User || null
}

/**
 * Get all users
 */
export async function getAllUsers(filters?: { status?: string }): Promise<User[]> {
  const command = new ScanCommand({
    TableName: TABLE_NAMES.USERS,
    FilterExpression: filters?.status ? '#status = :status' : undefined,
    ExpressionAttributeNames: filters?.status ? { '#status': 'status' } : undefined,
    ExpressionAttributeValues: filters?.status ? { ':status': filters.status } : undefined,
  })

  const result = await dynamoClient.send(command)
  return result.Items as User[] || []
}

/**
 * Create a role
 */
export async function createRole(roleData: Omit<Role, 'id' | 'created_at'>): Promise<Role> {
  const role: Role = {
    id: uuidv4(),
    ...roleData,
    created_at: new Date().toISOString(),
  }

  const command = new PutCommand({
    TableName: TABLE_NAMES.ROLES,
    Item: role,
  })

  await dynamoClient.send(command)
  return role
}

/**
 * Get role by ID
 */
export async function getRoleById(id: string): Promise<Role | null> {
  const command = new GetCommand({
    TableName: TABLE_NAMES.ROLES,
    Key: { id },
  })

  const result = await dynamoClient.send(command)
  return result.Item as Role || null
}

/**
 * Get roles by business ID
 */
export async function getRolesByBusinessId(businessId: string): Promise<Role[]> {
  const command = new ScanCommand({
    TableName: TABLE_NAMES.ROLES,
    FilterExpression: 'business_id = :business_id',
    ExpressionAttributeValues: {
      ':business_id': businessId,
    },
  })

  const result = await dynamoClient.send(command)
  return result.Items as Role[] || []
}

/**
 * Get all roles
 */
export async function getAllRoles(): Promise<Role[]> {
  const command = new ScanCommand({
    TableName: TABLE_NAMES.ROLES,
  })

  const result = await dynamoClient.send(command)
  return result.Items as Role[] || []
}

/**
 * Create user-role relationship
 */
export async function createUserRole(userRoleData: UserRole): Promise<void> {
  const command = new PutCommand({
    TableName: TABLE_NAMES.USER_ROLES,
    Item: {
      ...userRoleData,
      assigned_at: new Date().toISOString(),
    },
  })

  await dynamoClient.send(command)
}

/**
 * Get user roles by user ID
 */
export async function getUserRoles(userId: string): Promise<Role[]> {
  // First get user-role relationships
  const userRolesCommand = new QueryCommand({
    TableName: TABLE_NAMES.USER_ROLES,
    IndexName: 'user-id-index',
    KeyConditionExpression: 'user_id = :user_id',
    ExpressionAttributeValues: {
      ':user_id': userId,
    },
  })

  const userRolesResult = await dynamoClient.send(userRolesCommand)
  const userRoles = userRolesResult.Items as UserRole[] || []

  if (userRoles.length === 0) {
    return []
  }

  // Get role details for each role ID
  const roles: Role[] = []
  for (const userRole of userRoles) {
    const role = await getRoleById(userRole.role_id)
    if (role) {
      roles.push(role)
    }
  }

  return roles
}

/**
 * Get user roles with business associations
 */
export async function getUserRolesWithBusiness(userId: string): Promise<(UserRole & { role: Role })[]> {
  // First get user-role relationships
  const userRolesCommand = new QueryCommand({
    TableName: TABLE_NAMES.USER_ROLES,
    IndexName: 'user-id-index',
    KeyConditionExpression: 'user_id = :user_id',
    ExpressionAttributeValues: {
      ':user_id': userId,
    },
  })

  const userRolesResult = await dynamoClient.send(userRolesCommand)
  const userRoles = userRolesResult.Items as UserRole[] || []

  if (userRoles.length === 0) {
    return []
  }

  // Get role details for each user role
  const rolesWithBusiness: (UserRole & { role: Role })[] = []
  for (const userRole of userRoles) {
    const role = await getRoleById(userRole.role_id)
    if (role) {
      rolesWithBusiness.push({ ...userRole, role })
    }
  }

  return rolesWithBusiness
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
  await updateUser(userId, { last_login: new Date().toISOString() })
}

/**
 * Create customer user with default preferences
 */
export async function createCustomerUser(userData: {
  email: string
  name: string
  hashed_password?: string
}): Promise<User> {
  const defaultPreferences: CustomerPreferences = {
    dietary_restrictions: [],
    favorite_stalls: [],
    notification_preferences: {
      email: true,
      sms: false,
      push: true
    }
  }

  const defaultStats: CustomerStats = {
    total_orders: 0,
    total_spent_cents: 0,
    favorite_products: []
  }

  const customerUser: Omit<User, 'id' | 'created_at' | 'updated_at'> = {
    ...userData,
    roles_json: JSON.stringify(['customer']),
    mfa_enabled: false,
    status: 'pending',
    customer_preferences: defaultPreferences,
    customer_stats: defaultStats
  }

  return await createUser(customerUser)
}

/**
 * Update customer preferences
 */
export async function updateCustomerPreferences(
  userId: string, 
  preferences: Partial<CustomerPreferences>
): Promise<User | null> {
  const user = await getUserById(userId)
  if (!user) {
    return null
  }

  const updatedPreferences = {
    ...user.customer_preferences,
    ...preferences
  }

  return await updateUser(userId, { customer_preferences: updatedPreferences })
}

/**
 * Update customer statistics
 */
export async function updateCustomerStats(
  userId: string, 
  stats: Partial<CustomerStats>
): Promise<User | null> {
  const user = await getUserById(userId)
  if (!user) {
    return null
  }

  const updatedStats = {
    ...user.customer_stats,
    ...stats
  }

  return await updateUser(userId, { customer_stats: updatedStats })
}

/**
 * Get customers only (users with customer role)
 */
export async function getCustomers(): Promise<User[]> {
  const command = new ScanCommand({
    TableName: TABLE_NAMES.USERS,
    FilterExpression: 'contains(roles_json, :customer_role)',
    ExpressionAttributeValues: {
      ':customer_role': 'customer'
    }
  })

  const result = await dynamoClient.send(command)
  return result.Items as User[] || []
}

/**
 * Create customer role if it doesn't exist
 */
export async function ensureCustomerRole(): Promise<Role> {
  // Check if customer role exists
  const existingRoles = await getAllRoles()
  const customerRole = existingRoles.find(role => role.role_name === 'customer')
  
  if (customerRole) {
    return customerRole
  }

  // Create customer role with basic permissions
  const customerRoleData: Omit<Role, 'id' | 'created_at'> = {
    business_id: 'global', // Global role for customers
    role_name: 'customer',
    permissions_csv: 'orders:create,orders:view,products:view,stalls:view'
  }

  return await createRole(customerRoleData)
}

/**
 * Assign customer role to user
 */
export async function assignCustomerRole(userId: string): Promise<void> {
  const customerRole = await ensureCustomerRole()
  
  const userRoleData: UserRole = {
    role_id: customerRole.id,
    business_id: 'global',
    user_id: userId,
    assigned_at: new Date().toISOString()
  }

  await createUserRole(userRoleData)
}