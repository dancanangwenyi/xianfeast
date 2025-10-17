import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session"
import { validateAndHealData } from "@/lib/data/validator"

// Middleware to check super admin role
async function requireSuperAdmin(request: NextRequest) {
  try {
    const session = await verifySession(request)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session.roles.includes("super_admin")) {
      return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 })
    }

    return null // No error, continue
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

/**
 * POST /api/admin/validate-data
 * Validate and heal all data across Google Sheets
 */
export async function POST(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    console.log("🔍 Starting comprehensive data validation...")
    
    const result = await validateAndHealData()

    return NextResponse.json({
      success: true,
      message: "Data validation completed",
      ...result,
    })
  } catch (error) {
    console.error("Error validating data:", error)
    return NextResponse.json({ error: "Failed to validate data" }, { status: 500 })
  }
}

/**
 * GET /api/admin/validate-data
 * Get validation status without running validation
 */
export async function GET(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    // Return a simple status check
    return NextResponse.json({
      success: true,
      message: "Data validation endpoint ready",
      lastRun: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error checking validation status:", error)
    return NextResponse.json({ error: "Failed to check validation status" }, { status: 500 })
  }
}
