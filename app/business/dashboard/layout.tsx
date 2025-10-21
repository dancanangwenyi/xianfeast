"use client"

import { SessionAwareLayout } from "@/components/layout/SessionAwareLayout"
import { BusinessSidebar } from "@/components/business/layout/BusinessSidebar"
import { BusinessHeader } from "@/components/business/layout/BusinessHeader"

export default function BusinessDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionAwareLayout requiredRoles={['business_owner', 'stall_manager']}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <BusinessHeader />
        <div className="flex">
          <BusinessSidebar />
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </div>
    </SessionAwareLayout>
  )
}