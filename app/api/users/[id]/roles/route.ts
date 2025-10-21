import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { updateUser, getUserById } from "@/lib/dynamodb/users"
import { checkPermission } from "@/lib/auth/permissions"

/**
 * PATCH /api/users/[id]/roles
 * Update user roles
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check permission
    const hasPermission = await checkPermission(session, "users:role:update")
    if (!hasPermission) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { roles } = body

    if (!roles || !Array.isArray(roles)) {
      return NextResponse.json({ error: "roles must be an array" }, { status: 400 })
    }

    // Verify user exists
    const user = await getUserById(id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update roles
    const updatedUser = await updateUser(id, { roles_json: JSON.stringify(roles) })
    
    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to update user roles" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "User roles updated successfully",
    })
  } catch (error) {
    console.error("Error updating user roles:", error)
    return NextResponse.json({ error: "Failed to update user roles" }, { status: 500 })
  }
}
