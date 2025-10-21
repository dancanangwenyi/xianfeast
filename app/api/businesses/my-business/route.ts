import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getUserById } from '@/lib/dynamodb/users'
import { getBusinessById } from '@/lib/dynamodb/businesses'

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

    // Fetch real business data from DynamoDB
    const business = await getBusinessById(businessId)
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        status: business.status,
        description: business.description,
        address: business.address,
        phone: business.phone,
        email: business.email,
        created_at: business.created_at,
        updated_at: business.updated_at
      }
    })

  } catch (error) {
    console.error('Error fetching business info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business info' },
      { status: 500 }
    )
  }
}