import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { updateRow, SHEET_COLUMNS } from "@/lib/google/sheets"

/**
 * POST /api/users/[id]/disable
 * Disable a user account
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Only super admin can disable users
    if (!session.roles.includes("super_admin")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { id } = await params

    await updateRow("users", id, { status: "disabled" }, SHEET_COLUMNS.users)

    return NextResponse.json({
      success: true,
      message: "User disabled successfully",
    })
  } catch (error) {
    console.error("Error disabling user:", error)
    return NextResponse.json({ error: "Failed to disable user" }, { status: 500 })
  }
}
