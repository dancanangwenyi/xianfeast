import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session"
import { createInvitation } from "@/lib/auth/invitation"
import { appendRowToSheet } from "@/lib/dynamodb/api-service"
import { v4 as uuidv4 } from "uuid"

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID

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
 * POST /api/admin/onboard-business
 * Complete business onboarding flow with email invitation
 */
export async function POST(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { 
      businessName, 
      ownerName, 
      ownerEmail, 
      currency = "KES", 
      timezone = "Africa/Nairobi",
      description 
    } = body

    if (!businessName || !ownerName || !ownerEmail) {
      return NextResponse.json({ 
        error: "Business name, owner name, and owner email are required" 
      }, { status: 400 })
    }

    const sheets = getSheetsClient()

    // Generate IDs
    const businessId = uuidv4()
    const ownerUserId = uuidv4()

    // Get current businesses count to determine row number
    const businessesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "businesses!A:A",
    })
    const businessRowNumber = (businessesResponse.data.values?.length || 1) + 1

    // Create business record
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "businesses!A:ZZ",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          businessId,
          businessName,
          ownerUserId,
          currency,
          timezone,
          new Date().toISOString(),
          "pending", // status - will be active after owner completes setup
          description || "",
        ]]
      }
    })

    // Create business owner user record
    const inviteToken = uuidv4()
    const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A:ZZ",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          ownerUserId,
          ownerEmail,
          ownerName,
          "", // hashed_password (empty for invited users)
          JSON.stringify(["business_owner"]), // roles_json
          false, // mfa_enabled
          "", // last_login
          "invited", // status
          "", // invited_by (could be set to current user)
          inviteToken, // invite_token
          inviteExpiry, // invite_expiry
          new Date().toISOString(), // created_at
        ]]
      }
    })

    // Create user-role relationship
    const roleId = uuidv4()
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "user_roles!A:ZZ",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          uuidv4(), // id
          ownerUserId, // user_id
          roleId, // role_id
          businessId, // business_id
          new Date().toISOString(), // assigned_at
        ]]
      }
    })

    // Send invitation email
    const invitationResult = await createInvitation({
      userId: ownerUserId,
      email: ownerEmail,
      name: ownerName,
      role: "business_owner",
      businessId,
      invitedBy: "super_admin",
    })

    if (!invitationResult.success) {
      return NextResponse.json({ 
        error: `Business created but invitation failed: ${invitationResult.error}` 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      businessId,
      ownerUserId,
      magicLink: invitationResult.magicLink,
      message: `Business "${businessName}" created successfully. Invitation sent to ${ownerEmail}`,
    })
  } catch (error) {
    console.error("Error onboarding business:", error)
    return NextResponse.json({ error: "Failed to onboard business" }, { status: 500 })
  }
}
