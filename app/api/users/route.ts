import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { queryRows, SHEET_COLUMNS } from "@/lib/google/sheets"

/**
 * GET /api/users
 * List users (with optional filters)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get("businessId")
    const status = searchParams.get("status")

    // Build filter
    let filterFn = (row: any) => true

    if (businessId) {
      // TODO: Filter by business_id when we add that field to users
      const prevFilter = filterFn
      filterFn = (row: any) => prevFilter(row)
    }

    if (status) {
      const prevFilter = filterFn
      filterFn = (row: any) => prevFilter(row) && row.status === status
    }

    const users = await queryRows("users", SHEET_COLUMNS.users, filterFn)

    // Remove sensitive fields
    const sanitizedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: JSON.parse(user.roles_json || "[]"),
      mfaEnabled: user.mfa_enabled === "true" || user.mfa_enabled === true,
      status: user.status,
      lastLogin: user.last_login,
      createdAt: user.created_at,
    }))

    return NextResponse.json({ users: sanitizedUsers })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
