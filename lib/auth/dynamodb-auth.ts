/**
 * DynamoDB-based authentication service
 * Replaces Google Sheets authentication
 */

import { getUserByEmail, getUserWithRoles, updateUserLastLogin, hasPermission, isSuperAdmin } from '../dynamodb/users'
import { verifyPassword } from './password'
import { setSessionCookie } from './session'

export interface LoginResult {
  success: boolean
  user?: {
    id: string
    email: string
    name: string
    roles: string[]
  }
  requiresMFA?: boolean
  error?: string
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email: string, password: string): Promise<LoginResult> {
  try {
    // Get user with roles
    const userWithRoles = await getUserWithRoles(email)
    
    if (!userWithRoles) {
      return { success: false, error: 'Invalid credentials' }
    }

    // Check if user is active
    if (userWithRoles.status !== 'active') {
      return { success: false, error: 'Account is not active' }
    }

    // Verify password
    if (!userWithRoles.hashed_password) {
      return { success: false, error: 'Password not set' }
    }

    const passwordValid = await verifyPassword(password, userWithRoles.hashed_password)
    if (!passwordValid) {
      return { success: false, error: 'Invalid credentials' }
    }

    // Update last login
    await updateUserLastLogin(userWithRoles.id)

    // Check if MFA is required
    if (userWithRoles.mfa_enabled) {
      return {
        success: true,
        requiresMFA: true,
        user: {
          id: userWithRoles.id,
          email: userWithRoles.email,
          name: userWithRoles.name,
          roles: userWithRoles.roles.map(role => role.role_name),
        }
      }
    }

    // Create session
    const roles = userWithRoles.roles.map(role => role.role_name)
    await setSessionCookie({
      userId: userWithRoles.id,
      email: userWithRoles.email,
      roles,
    })

    return {
      success: true,
      user: {
        id: userWithRoles.id,
        email: userWithRoles.email,
        name: userWithRoles.name,
        roles,
      }
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Check if user has specific permission
 */
export async function checkUserPermission(email: string, permission: string): Promise<boolean> {
  try {
    const userWithRoles = await getUserWithRoles(email)
    if (!userWithRoles) {
      return false
    }

    return hasPermission(userWithRoles.roles, permission)
  } catch (error) {
    console.error('Permission check error:', error)
    return false
  }
}

/**
 * Check if user is super admin
 */
export async function checkSuperAdmin(email: string): Promise<boolean> {
  try {
    const userWithRoles = await getUserWithRoles(email)
    if (!userWithRoles) {
      return false
    }

    return isSuperAdmin(userWithRoles.roles)
  } catch (error) {
    console.error('Super admin check error:', error)
    return false
  }
}

/**
 * Get user profile with roles
 */
export async function getUserProfile(email: string) {
  try {
    const userWithRoles = await getUserWithRoles(email)
    if (!userWithRoles) {
      return null
    }

    return {
      id: userWithRoles.id,
      email: userWithRoles.email,
      name: userWithRoles.name,
      roles: userWithRoles.roles.map(role => ({
        id: role.id,
        name: role.role_name,
        businessId: role.business_id,
        permissions: role.permissions_csv.split(',').map(p => p.trim()),
      })),
      mfaEnabled: userWithRoles.mfa_enabled,
      status: userWithRoles.status,
      lastLogin: userWithRoles.last_login,
    }
  } catch (error) {
    console.error('Get user profile error:', error)
    return null
  }
}

export default {
  authenticateUser,
  checkUserPermission,
  checkSuperAdmin,
  getUserProfile,
}