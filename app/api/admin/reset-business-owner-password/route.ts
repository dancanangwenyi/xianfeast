import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, updateUser } from "@/lib/dynamodb/users"
import { hashPassword } from "@/lib/auth/password"

/**
 * POST /api/admin/reset-business-owner-password
 * Reset business owner password
 */
export async function POST(request: NextRequest) {
  try {
    const email = 'eccsgl.dancan@gmail.com'
    const newPassword = 'Majivuno@24116817'

    // Find the user
    const user = await getUserByEmail(email)
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword)

    // Update the user's password
    const updatedUser = await updateUser(user.id, {
      hashed_password: hashedPassword,
      password_change_required: false
    })

    if (updatedUser) {
      return NextResponse.json({ 
        success: true, 
        message: "Password reset successfully",
        user: {
          email: updatedUser.email,
          name: updatedUser.name
        }
      })
    } else {
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }

  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ error: "Password reset failed" }, { status: 500 })
  }
}