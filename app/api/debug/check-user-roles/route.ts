import { type NextRequest, NextResponse } from "next/server"
import { getUserWithRoles } from "@/lib/dynamodb/users"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: "Email parameter required" }, { status: 400 })
    }

    const userWithRoles = await getUserWithRoles(email)
    
    if (!userWithRoles) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: userWithRoles.id,
        email: userWithRoles.email,
        name: userWithRoles.name,
        status: userWithRoles.status
      },
      roles: userWithRoles.roles,
      roleCount: userWithRoles.roles.length
    })

  } catch (error) {
    console.error("Error checking user roles:", error)
    return NextResponse.json({ error: "Failed to check user roles" }, { status: 500 })
  }
}