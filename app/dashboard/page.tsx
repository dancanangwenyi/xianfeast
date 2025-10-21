import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Redirect super admins to the admin dashboard
  if (session.roles.includes("super_admin")) {
    redirect("/admin/dashboard")
  }

  // Redirect business owners and stall managers to business dashboard
  if (session.roles.includes("business_owner") || session.roles.includes("stall_manager")) {
    redirect("/business/dashboard")
  }

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
