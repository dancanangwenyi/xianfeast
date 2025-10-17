import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session"
import { getSheetsClient } from "@/lib/google/auth"
import { v4 as uuidv4 } from "uuid"
import { createInvitation } from "@/lib/auth/invitation"

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

// GET /api/admin/businesses - Get all businesses
export async function GET(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    if (!SPREADSHEET_ID) {
      return NextResponse.json({ error: "Spreadsheet ID not configured" }, { status: 500 })
    }

    const sheets = getSheetsClient()

    // Get businesses data
    const businessesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "businesses!A:ZZ",
    })

    const businesses = businessesResponse.data.values?.slice(1).map(row => ({
      id: row[0],
      name: row[1],
      ownerUserId: row[2],
      status: row[3],
      createdAt: row[4],
      // Add more fields as needed
    })) || []

    return NextResponse.json({ businesses })
  } catch (error) {
    console.error("Error fetching businesses:", error)
    return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 })
  }
}

// POST /api/admin/businesses - Create new business
export async function POST(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { name, ownerEmail, ownerName, currency, timezone, description } = body

    if (!name || !ownerEmail || !ownerName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    if (!SPREADSHEET_ID) {
      return NextResponse.json({ error: "Spreadsheet ID not configured" }, { status: 500 })
    }

    const sheets = getSheetsClient()

    // Generate business ID
    const businessId = uuidv4()

    // Get current businesses count to determine row number
    const businessesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "businesses!A:A",
    })
    const businessRowNumber = (businessesResponse.data.values?.length || 1) + 1 // +1 for header, +1 for new row

    // Create business record
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "businesses!A:ZZ",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          businessId,
          name,
          "", // owner_user_id (will be set when user is created)
          currency || "KES",
          timezone || "Africa/Nairobi",
          new Date().toISOString(), // created_at
          "pending", // status
          description || "", // settings_json
        ]]
      }
    })

    // Create business owner user record
    const ownerUserId = uuidv4()
    const inviteToken = uuidv4()
    const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

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

    // Update business with owner user ID
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `businesses!C${businessRowNumber}`, // Update owner_user_id
      valueInputOption: "RAW",
      requestBody: {
        values: [[ownerUserId]]
      }
    })

    // Get the business_owner role ID from the roles sheet
    const rolesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "roles!A:C", // id, business_id, name
    })
    const businessOwnerRole = rolesResponse.data.values?.find(row => row[2] === "business_owner")
    const businessOwnerRoleId = businessOwnerRole ? businessOwnerRole[0] : null

    if (businessOwnerRoleId) {
      // Create user-role relationship
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "user_roles!A:ZZ",
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            uuidv4(), // id
            ownerUserId, // user_id
            businessOwnerRoleId, // role_id
            businessId, // business_id
            new Date().toISOString(), // assigned_at
          ]]
        }
      })
    }

    // Send invitation email to owner
    try {
      const invitationResult = await createInvitation({
        userId: ownerUserId,
        email: ownerEmail,
        name: ownerName,
        role: "business_owner",
        businessId: businessId,
        invitedBy: "super_admin", // Could be the current user's ID
      })

      if (!invitationResult.success) {
        console.error("Failed to send invitation email:", invitationResult.error)
        // Don't fail the entire operation, but log the error
      }
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError)
      // Don't fail the entire operation, but log the error
    }

    return NextResponse.json({ 
      success: true, 
      businessId,
      ownerUserId,
      message: "Business created successfully. Invitation sent to owner." 
    })
  } catch (error) {
    console.error("Error creating business:", error)
    return NextResponse.json({ error: "Failed to create business" }, { status: 500 })
  }
}

// PATCH /api/admin/businesses/[id] - Update business
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    const businessId = params.id
    const body = await request.json()
    const { status, name, description } = body

    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    if (!SPREADSHEET_ID) {
      return NextResponse.json({ error: "Spreadsheet ID not configured" }, { status: 500 })
    }

    const sheets = getSheetsClient()

    // Get current business data
    const businessesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "businesses!A:ZZ",
    })

    const businesses = businessesResponse.data.values || []
    const businessIndex = businesses.findIndex(row => row[0] === businessId)

    if (businessIndex === -1) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    // Update business data
    const updatedBusiness = [...businesses[businessIndex]]
    if (status !== undefined) updatedBusiness[3] = status
    if (name !== undefined) updatedBusiness[1] = name
    if (description !== undefined) updatedBusiness[7] = description

    // Update the row in the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `businesses!A${businessIndex + 1}:ZZ${businessIndex + 1}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [updatedBusiness]
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Business updated successfully" 
    })
  } catch (error) {
    console.error("Error updating business:", error)
    return NextResponse.json({ error: "Failed to update business" }, { status: 500 })
  }
}
