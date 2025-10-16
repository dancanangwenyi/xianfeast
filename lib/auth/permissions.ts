import { queryRows, SHEET_COLUMNS } from "@/lib/google/sheets"
import type { Permission, SessionPayload } from "./session"

/**
 * Check if a user has a specific permission
 */
export async function checkPermission(session: SessionPayload, permission: Permission): Promise<boolean> {
  // Super admin has all permissions
  if (session.roles.includes("super_admin")) {
    return true
  }

  // Get role permissions from sheet
  const rolePermissions = await queryRows("roles_permissions", SHEET_COLUMNS.roles_permissions, (row) =>
    session.roles.includes(row.role_name),
  )

  // Check if any role has the permission
  for (const role of rolePermissions) {
    const permissions = role.permissions_csv.split(",").map((p: string) => p.trim())
    if (permissions.includes(permission)) {
      return true
    }
  }

  return false
}

/**
 * Check if a user has a specific permission by userId
 */
export async function hasPermission(userId: string, permission: Permission): Promise<boolean> {
  // Get user session data from users sheet
  const users = await queryRows("users", SHEET_COLUMNS.users, (row) => row.id === userId)

  if (users.length === 0) {
    return false
  }

  const user = users[0]
  const roles = user.roles_json ? JSON.parse(user.roles_json) : []

  const session: SessionPayload = {
    userId: user.id,
    email: user.email,
    roles,
    businessId: user.business_id,
  }

  return checkPermission(session, permission)
}

/**
 * Check if user has permission for a specific stall
 */
export async function checkStallPermission(
  session: SessionPayload,
  stallId: string,
  permission: Permission,
): Promise<boolean> {
  // Super admin has all permissions
  if (session.roles.includes("super_admin")) {
    return true
  }

  // TODO: Implement stall-scoped permissions
  // For now, just check general permission
  return checkPermission(session, permission)
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(session: SessionPayload): Promise<Permission[]> {
  if (session.roles.includes("super_admin")) {
    return [
      "business:read",
      "business:update",
      "business:disable",
      "stall:create",
      "stall:update",
      "stall:delete",
      "product:create",
      "product:update",
      "product:delete",
      "product:approve",
      "orders:create",
      "orders:view",
      "orders:fulfil",
      "orders:export",
      "users:invite",
      "users:role:update",
    ]
  }

  const rolePermissions = await queryRows("roles_permissions", SHEET_COLUMNS.roles_permissions, (row) =>
    session.roles.includes(row.role_name),
  )

  const permissions = new Set<Permission>()
  for (const role of rolePermissions) {
    const perms = role.permissions_csv.split(",").map((p: string) => p.trim() as Permission)
    perms.forEach((p) => permissions.add(p))
  }

  return Array.from(permissions)
}

/**
 * Predefined roles with their permissions
 */
export const PREDEFINED_ROLES = {
  business_owner: [
    "business:read",
    "business:update",
    "stall:create",
    "stall:update",
    "stall:delete",
    "product:create",
    "product:update",
    "product:delete",
    "product:approve",
    "orders:view",
    "orders:fulfil",
    "orders:export",
    "users:invite",
    "users:role:update",
  ],
  stall_manager: [
    "stall:read",
    "stall:update",
    "product:create",
    "product:update",
    "product:approve",
    "orders:view",
    "orders:fulfil",
    "users:invite",
  ],
  menu_editor: ["product:create", "product:update", "orders:view"],
  order_viewer: ["orders:view"],
  customer: ["orders:create", "orders:view"],
}
