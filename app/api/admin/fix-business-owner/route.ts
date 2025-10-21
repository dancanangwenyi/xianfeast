import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { updateUser } from '@/lib/dynamodb/users'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!session.roles.includes('super_admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, businessId } = body

    if (!userId || !businessId) {
      return NextResponse.json({ error: 'userId and businessId are required' }, { status: 400 })
    }

    // Update the user with the business_id
    const updatedUser = await updateUser(userId, {
      business_id: businessId
    })

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Business owner updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error fixing business owner:', error)
    return NextResponse.json(
      { error: 'Failed to update business owner' },
      { status: 500 }
    )
  }
}