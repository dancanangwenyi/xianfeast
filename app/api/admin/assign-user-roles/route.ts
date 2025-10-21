import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, createUserRole, createRole } from "@/lib/dynamodb/users"

export async function POST(request: NextRequest) {
    try {
        // First, ensure roles exist
        const superAdminRoleData = {
            name: 'super_admin',
            permissions: ['*'] as any[] // All permissions
        }

        const businessOwnerRoleData = {
            name: 'business_owner',
            permissions: ['business:*'] as any[] // Business permissions
        }

        // Create roles (will skip if they exist)
        let superAdminRole, businessOwnerRole
        try {
            superAdminRole = await createRole(superAdminRoleData)
            businessOwnerRole = await createRole(businessOwnerRoleData)
        } catch (error) {
            console.log('Roles might already exist, continuing...')
            // Use hardcoded IDs if creation fails
            superAdminRole = { id: 'role_super_admin' }
            businessOwnerRole = { id: 'role_business_owner' }
        }

        // Get users
        const superAdminUser = await getUserByEmail('dancangwe@gmail.com')
        const businessOwnerUser = await getUserByEmail('eccsgl.dancan@gmail.com')

        if (!superAdminUser || !businessOwnerUser) {
            return NextResponse.json({ error: "Users not found" }, { status: 404 })
        }

        // Assign super admin role
        await createUserRole({
            id: `ur_${superAdminUser.id}_${superAdminRole.id}`,
            user_id: superAdminUser.id,
            role_id: superAdminRole.id,
            business_id: '' // Super admin has no specific business
        } as any)

        // Assign business owner role (assuming business ID from previous setup)
        await createUserRole({
            id: `ur_${businessOwnerUser.id}_${businessOwnerRole.id}`,
            user_id: businessOwnerUser.id,
            role_id: businessOwnerRole.id,
            business_id: 'biz_1760954255340_65gul96eq' // The business we created earlier
        } as any)

        return NextResponse.json({
            success: true,
            message: "User roles assigned successfully",
            assignments: [
                { user: 'dancangwe@gmail.com', role: 'super_admin' },
                { user: 'eccsgl.dancan@gmail.com', role: 'business_owner', business: 'biz_1760954255340_65gul96eq' }
            ]
        })

    } catch (error) {
        console.error("Error assigning user roles:", error)
        return NextResponse.json({
            error: "Failed to assign user roles",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}