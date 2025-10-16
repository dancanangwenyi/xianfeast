import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session"
import { getSheetsClient } from "@/lib/google/auth"
import { v4 as uuidv4 } from "uuid"

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
          "pending", // status
          new Date().toISOString(), // created_at
          currency || "KES",
          timezone || "Africa/Nairobi",
          description || "",
        ]]
      }
    })

    // TODO: Send invitation email to owner
    // This would typically involve:
    // 1. Creating a magic link
    // 2. Sending email with invitation
    // 3. Creating user record when they accept

    return NextResponse.json({ 
      success: true, 
      businessId,
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
