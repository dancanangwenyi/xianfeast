import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getUserById } from '@/lib/dynamodb/users'
import { updateStall } from '@/lib/dynamodb/businesses'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's business ID for security
    const user = await getUserById(session.userId)
    if (!user || !user.business_id) {
      return NextResponse.json({ error: 'No business associated with user' }, { status: 404 })
    }

    const stallId = params.id
    const body = await request.json()

    // Update stall
    const updatedStall = await updateStall(stallId, {
      name: body.name,
      description: body.description,
      pickup_address: body.pickup_address,
      capacity_per_day: body.capacity_per_day,
      status: body.status
    })

    if (!updatedStall) {
      return NextResponse.json({ error: 'Stall not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      stall: updatedStall
    })

  } catch (error) {
    console.error('Error updating stall:', error)
    return NextResponse.json(
      { error: 'Failed to update stall' },
      { status: 500 }
    )
  }
}