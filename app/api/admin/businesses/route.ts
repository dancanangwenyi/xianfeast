import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAllBusinesses, createBusiness } from "@/lib/dynamodb/business"
import { createUser } from "@/lib/dynamodb/users"
import { createMagicLink } from "@/lib/dynamodb/magic-links"
import { sendMagicLinkEmail } from "@/lib/email/send"
import { hashPassword } from "@/lib/auth/password"
import { randomBytes } from "crypto"

/**
 * GET /api/admin/businesses
 * Get all businesses (super admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!session.roles.includes("super_admin")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const businesses = await getAllBusinesses()

    return NextResponse.json({ businesses })
  } catch (error) {
    console.error("Error fetching businesses:", error)
    return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 })
  }
}

/**
 * POST /api/admin/businesses
 * Create a new business and invite owner (super admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!session.roles.includes("super_admin")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { name, ownerEmail, ownerName, currency = "KES", timezone = "Africa/Nairobi", description = "" } = body

    if (!name || !ownerEmail || !ownerName) {
      return NextResponse.json({ error: "name, ownerEmail, and ownerName are required" }, { status: 400 })
    }

    // Create the business owner user first
    const ownerUser = await createUser({
      email: ownerEmail,
      name: ownerName,
      roles_json: JSON.stringify(["business_owner"]),
      mfa_enabled: false,
      status: "pending",
      invited_by: session.userId,
    })

    // Create the business
    const business = await createBusiness({
      name,
      description,
      address: "",
      phone: "",
      email: ownerEmail,
      owner_user_id: ownerUser.id,
      status: "pending",
      settings_json: JSON.stringify({
        currency,
        timezone,
      }),
    })

    // Generate magic link for owner invitation
    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await createMagicLink({
      token,
      user_id: ownerUser.id,
      business_id: business.id,
      type: "business_invitation",
      expires_at: expiresAt.toISOString(),
      used: false,
    })

    // Send invitation email
    await sendMagicLinkEmail({
      to: ownerEmail,
      name: ownerName,
      token,
      type: "business_invitation",
      businessName: name,
    })

    return NextResponse.json({
      success: true,
      businessId: business.id,
      ownerId: ownerUser.id,
      message: "Business created and invitation sent successfully",
    })
  } catch (error) {
    console.error("Error creating business:", error)
    return NextResponse.json({ error: "Failed to create business" }, { status: 500 })
  }
}