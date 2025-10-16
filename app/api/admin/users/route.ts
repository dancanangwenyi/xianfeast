import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session"
import { getSheetsClient } from "@/lib/google/auth"

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

// GET /api/admin/users - Get all users
export async function GET(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    if (!SPREADSHEET_ID) {
      return NextResponse.json({ error: "Spreadsheet ID not configured" }, { status: 500 })
    }

    const sheets = getSheetsClient()

    // Get users data
    const usersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A:ZZ",
    })

    const users = usersResponse.data.values?.slice(1).map(row => ({
      id: row[0],
      email: row[1],
      name: row[2],
      roles: JSON.parse(row[4] || "[]"),
      mfaEnabled: row[5] === "true",
      status: row[7],
      lastLogin: row[6],
      createdAt: row[11],
    })) || []

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

// POST /api/admin/users - Invite new user
export async function POST(request: NextRequest) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { name, email, role, businessId } = body

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    if (!SPREADSHEET_ID) {
      return NextResponse.json({ error: "Spreadsheet ID not configured" }, { status: 500 })
    }

    const sheets = getSheetsClient()

    // Check if user already exists
    const usersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!B:B", // email column
    })

    const existingEmails = usersResponse.data.values?.flat() || []
    if (existingEmails.includes(email)) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Generate user ID and invite token
    const userId = uuidv4()
    const inviteToken = uuidv4()
    const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

    // Create user record
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A:ZZ",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          userId,
          email,
          name,
          "", // hashed_password (empty for invited users)
          JSON.stringify([role]), // roles_json
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

    // TODO: Send invitation email
    // This would typically involve:
    // 1. Creating a magic link with the invite token
    // 2. Sending email with invitation
    // 3. User clicks link and sets password

    return NextResponse.json({ 
      success: true, 
      userId,
      inviteToken,
      message: "User invitation sent successfully" 
    })
  } catch (error) {
    console.error("Error inviting user:", error)
    return NextResponse.json({ error: "Failed to invite user" }, { status: 500 })
  }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireSuperAdmin(request)
  if (authError) return authError

  try {
    const userId = params.id
    const body = await request.json()
    const { status, roles, mfaEnabled } = body

    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    if (!SPREADSHEET_ID) {
      return NextResponse.json({ error: "Spreadsheet ID not configured" }, { status: 500 })
    }

    const sheets = getSheetsClient()

    // Get current user data
    const usersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A:ZZ",
    })

    const users = usersResponse.data.values || []
    const userIndex = users.findIndex(row => row[0] === userId)

    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user data
    const updatedUser = [...users[userIndex]]
    if (status !== undefined) updatedUser[7] = status
    if (roles !== undefined) updatedUser[4] = JSON.stringify(roles)
    if (mfaEnabled !== undefined) updatedUser[5] = mfaEnabled.toString()

    // Update the row in the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `users!A${userIndex + 1}:ZZ${userIndex + 1}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [updatedUser]
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: "User updated successfully" 
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
