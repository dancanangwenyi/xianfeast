import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getUserById } from '@/lib/dynamodb/users'
import { getStallsByBusinessId } from '@/lib/dynamodb/businesses'

export async function GET(request: NextRequest) {
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

    // Fetch real stalls data from DynamoDB
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
    console.error('Error fetching business stalls:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stalls' },
      { status: 500 }
    )
  }
}