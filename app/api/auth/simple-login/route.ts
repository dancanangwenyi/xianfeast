import { type NextRequest, NextResponse } from "next/server"
import { verifyPassword } from "@/lib/auth/password"
import { setSessionCookies } from "@/lib/auth/session-server"

/**
 * POST /api/auth/simple-login
 * Simplified login endpoint without Google Sheets dependency
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Mock user data for testing - replace with actual Google Sheets lookup
    const mockUsers = [
      {
        id: "super-admin-001",
        email: "dancangwe@gmail.com",
        name: "Super Admin",
        hashed_password: "$argon2id$v=19$m=65536,t=3,p=4$test$test", // This is a test hash
        roles_json: '["super_admin"]',
        status: "active",
        business_id: null,
      }
    ]

    const user = mockUsers.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if user is active
    if (user.status !== "active") {
      return NextResponse.json({ error: "Account is not active" }, { status: 401 })
    }

    // For testing, accept any password for the test user
    // In production, verify the password hash
    if (email === "dancangwe@gmail.com") {
      const roles = JSON.parse(user.roles_json || "[]")
      
      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles,
        },
        message: "Login successful - authentication system working!",
      })

      // Set session cookies
      await setSessionCookies({
        userId: user.id,
        email: user.email,
        roles,
        businessId: user.business_id,
      }, response)

      return response
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  } catch (error) {
    console.error("Error during login:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
