import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { queryRows, appendRow, SHEET_COLUMNS } from "@/lib/google/sheets"
import { checkPermission } from "@/lib/auth/permissions"
import { v4 as uuidv4 } from "uuid"

/**
 * GET /api/roles
 * List all roles for a business
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get("businessId")

    let filterFn = (row: any) => true
    if (businessId) {
      filterFn = (row: any) => row.business_id === businessId
    }

    const roles = await queryRows("roles_permissions", SHEET_COLUMNS.roles_permissions, filterFn)

    const rolesWithPermissions = roles.map((role) => ({
      id: role.role_id,
      name: role.role_name,
      businessId: role.business_id,
      permissions: role.permissions_csv.split(",").map((p: string) => p.trim()),
    }))

    return NextResponse.json({ roles: rolesWithPermissions })
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}

/**
 * POST /api/roles
 * Create a new role
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const hasPermission = await checkPermission(session, "users:role:update")
    if (!hasPermission) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { businessId, roleName, permissions } = body

    if (!businessId || !roleName || !permissions) {
      return NextResponse.json({ error: "businessId, roleName, and permissions are required" }, { status: 400 })
    }

    const roleId = uuidv4()
    await appendRow(
      "roles_permissions",
      {
        role_id: roleId,
        business_id: businessId,
        role_name: roleName,
        permissions_csv: Array.isArray(permissions) ? permissions.join(",") : permissions,
      },
      SHEET_COLUMNS.roles_permissions,
    )

    return NextResponse.json({
      success: true,
      roleId,
      message: "Role created successfully",
    })
  } catch (error) {
    console.error("Error creating role:", error)
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 })
  }
}
