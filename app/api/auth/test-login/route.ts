import { type NextRequest, NextResponse } from "next/server"
import { verifyPassword } from "@/lib/auth/password"
import { setSessionCookie } from "@/lib/auth/session"

/**
 * POST /api/auth/test-login
 * Test login endpoint without Google Sheets dependency
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Mock user data for testing
    const mockUser = {
      id: "test-user-id",
      email: "dancangwe@gmail.com",
      name: "Super Admin",
      hashed_password: "$argon2id$v=19$m=65536,t=3,p=4$test$test", // This won't match, but we'll handle it
      roles_json: '["super_admin"]',
      status: "active",
      business_id: null,
    }

    // For testing, accept any password for the test user
    if (email === "dancangwe@gmail.com") {
      const roles = JSON.parse(mockUser.roles_json || "[]")
      
      await setSessionCookie({
        userId: mockUser.id,
        email: mockUser.email,
        roles,
        businessId: mockUser.business_id,
      })

      return NextResponse.json({
        success: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          roles,
        },
        message: "Test login successful - authentication system working!",
      })
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  } catch (error) {
    console.error("Error during test login:", error)
    return NextResponse.json({ error: "Test login failed" }, { status: 500 })
  }
}
