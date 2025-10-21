import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getUserById } from '@/lib/dynamodb/users'
import { createStall, getStallsByBusinessId } from '@/lib/dynamodb/businesses'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 })
    }

    // For super admin, allow access to any business
    // For business owners, verify they own the business
    if (!session.roles.includes('super_admin')) {
      const user = await getUserById(session.userId)
      if (!user || user.business_id !== businessId) {
        return NextResponse.json({ error: 'Access denied to this business' }, { status: 403 })
      }
    }

    const stalls = await getStallsByBusinessId(businessId)

    return NextResponse.json({
      stalls: stalls.map(stall => ({
        id: stall.id,
        business_id: stall.business_id,
        name: stall.name,
        description: stall.description,
        pickup_address: stall.pickup_address,
        open_hours_json: stall.open_hours_json,
        capacity_per_day: stall.capacity_per_day,
        status: stall.status,
        created_at: stall.created_at,
        updated_at: stall.updated_at
      }))
    })

  } catch (error) {
    console.error('Error fetching stalls:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stalls' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's business ID
    const user = await getUserById(session.userId)
    if (!user || !user.business_id) {
      return NextResponse.json({ error: 'No business associated with user' }, { status: 404 })
    }

    const businessId = user.business_id
    const body = await request.json()
    const { name, description, pickupAddress, capacityPerDay } = body

    if (!name) {
      return NextResponse.json({ error: 'Stall name is required' }, { status: 400 })
    }

    // Create new stall
    const newStall = await createStall({
      business_id: businessId,
      name,
      description: description || '',
      pickup_address: pickupAddress || '',
      capacity_per_day: capacityPerDay || 100,
      status: 'active'
    })

    return NextResponse.json({
      success: true,
      stall: newStall
    })

  } catch (error) {
    console.error('Error creating stall:', error)
    return NextResponse.json(
      { error: 'Failed to create stall' },
      { status: 500 }
    )
  }
}