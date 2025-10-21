import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Debug: Log session details
  console.log('🔍 Dashboard session:', {
    email: session.email,
    roles: session.roles,
    businessId: session.businessId
  })

  // Redirect super admins to the admin dashboard
  if (session.roles.includes("super_admin")) {
    console.log('🔄 Redirecting super admin to /admin/dashboard')
    redirect("/admin/dashboard")
  }

  // Redirect business owners and stall managers to business dashboard
  if (session.roles.includes("business_owner") || session.roles.includes("stall_manager")) {
    console.log('🔄 Redirecting business user to /business/dashboard')
    redirect("/business/dashboard")
  }

  console.log('⚠️ No redirect match for roles:', session.roles)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold">Welcome to XianFeast</h1>
        <p className="mt-2 text-muted-foreground">
          Logged in as {session.email} ({session.roles.join(", ")})
        </p>
        <div className="mt-8">
          <p>Dashboard content coming soon...</p>
        </div>
      </div>
    </div>
  )
}
