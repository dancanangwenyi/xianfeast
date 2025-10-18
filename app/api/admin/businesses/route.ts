import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session"
import { createBusiness, getAllBusinesses, updateBusiness } from "@/lib/dynamodb/business"
import { getUserByEmail, createUserRoleRelationship } from "@/lib/dynamodb/auth"
import { createMagicLink } from "@/lib/dynamodb/business"
import { sendMagicLinkEmail } from "@/lib/email/send"
import { v4 as uuidv4 } from "uuid"
import { hashPassword } from "@/lib/auth/password"
import { putItem, TABLE_NAMES } from "@/lib/dynamodb/service"

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
    const businesses = await getAllBusinesses()
    
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
    const { name, ownerEmail, ownerName, currency, timezone, description, address, phone } = body

    if (!name || !ownerEmail || !ownerName) {
      return NextResponse.json({ error: "Missing required fields: name, ownerEmail, ownerName" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(ownerEmail)
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Create business owner user
    const ownerUserId = uuidv4()
    const tempPassword = `temp_${Math.random().toString(36).substr(2, 8)}`
    const hashedPassword = await hashPassword(tempPassword)

    const user = {
      id: ownerUserId,
      email: ownerEmail,
      name: ownerName,
      hashed_password: hashedPassword,
      roles_json: JSON.stringify(['business_owner']),
      mfa_enabled: false,
      last_login: '',
      status: 'invited',
      invited_by: 'super_admin',
      invite_token: '',
      invite_expiry: '',
      created_at: new Date().toISOString(),
      password_change_required: true
    }

    await putItem(TABLE_NAMES.USERS, user)

    // Create business
    const business = await createBusiness({
      name,
      description: description || '',
      address: address || '',
      phone: phone || '',
      email: ownerEmail,
      owner_user_id: ownerUserId,
      status: 'pending',
      settings_json: JSON.stringify({
        currency: currency || 'KES',
        timezone: timezone || 'Africa/Nairobi',
        created_by: 'super_admin'
      })
    })

    // Create business_owner role for this business
    const roleId = uuidv4()
    const role = {
      id: roleId,
      business_id: business.id,
      name: 'business_owner',
      permissions_csv: 'business.read,business.update,stall.create,stall.read,stall.update,stall.delete,product.create,product.read,product.update,product.delete,user.invite,user.read,user.update,order.read,analytics.read',
      created_at: new Date().toISOString()
    }

    await putItem(TABLE_NAMES.ROLES, role)

    // Create user-role relationship
    await createUserRoleRelationship(ownerUserId, roleId, business.id)

    // Create magic link for business invitation
    const magicToken = uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

    await createMagicLink({
      token: magicToken,
      user_id: ownerUserId,
      business_id: business.id,
      type: 'business_invitation',
      expires_at: expiresAt,
      used: false
    })

    // Send invitation email
    try {
      const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/magic?token=${magicToken}`
      
      await sendMagicLinkEmail(ownerEmail, magicLink)
      
      console.log(`📧 Business invitation sent to ${ownerEmail}`)
      console.log(`   Business: ${name}`)
      console.log(`   Magic Link: ${magicLink}`)
    } catch (emailError) {
      console.error('❌ Failed to send business invitation email:', emailError)
      // Don't fail the entire operation, but log the error
    }

    return NextResponse.json({ 
      success: true, 
      business: {
        id: business.id,
        name: business.name,
        status: business.status,
        owner_email: ownerEmail,
        owner_name: ownerName,
        created_at: business.created_at
      },
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
    const { status, name, description, address, phone } = body

    const updatedBusiness = await updateBusiness(businessId, {
      status,
      name,
      description,
      address,
      phone,
    })

    if (!updatedBusiness) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      business: updatedBusiness,
      message: "Business updated successfully" 
    })
  } catch (error) {
    console.error("Error updating business:", error)
    return NextResponse.json({ error: "Failed to update business" }, { status: 500 })
  }
}
