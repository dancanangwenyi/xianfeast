import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getUserById } from '@/lib/dynamodb/users'
import { getProductsByBusinessId, getStallsByBusinessId } from '@/lib/dynamodb/businesses'

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

    // Fetch real products data from DynamoDB
    const products = await getProductsByBusinessId(businessId)
    const stalls = await getStallsByBusinessId(businessId)

    // Add stall names to products
    const productsWithStallNames = products.map(product => {
      const stall = stalls.find(s => s.id === product.stall_id)
      return {
        ...product,
        stall_name: stall?.name || 'Unknown Stall'
      }
    })

    return NextResponse.json({
      products: productsWithStallNames
    })

  } catch (error) {
    console.error('Error fetching business products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}