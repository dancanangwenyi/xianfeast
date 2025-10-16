"use client"

import { useEffect, useState } from "react"
import { redirect } from "next/navigation"
import { AnalyticsCard } from "@/components/analytics-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, ShoppingCart, Package, DollarSign, TrendingUp } from "lucide-react"

interface Analytics {
  businesses: { total: number; active: number }
  users: { total: number; active: number }
  orders: { total: number; confirmed: number; fulfilled: number }
  products: { total: number; active: number }
  revenue: { total: number; recent30Days: number }
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics/overview")
      if (response.status === 403) {
        redirect("/dashboard")
      }
      const data = await response.json()
      setAnalytics(data.overview)
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-7xl">
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-7xl">
          <p>Failed to load analytics</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Organization-wide analytics and management</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnalyticsCard
            title="Total Businesses"
            value={analytics.businesses.total}
            description={`${analytics.businesses.active} active`}
            icon={Building2}
          />

          <AnalyticsCard
            title="Total Users"
            value={analytics.users.total}
            description={`${analytics.users.active} active`}
            icon={Users}
          />

          <AnalyticsCard
            title="Total Orders"
            value={analytics.orders.total}
            description={`${analytics.orders.fulfilled} fulfilled`}
            icon={ShoppingCart}
          />

          <AnalyticsCard
            title="Total Products"
            value={analytics.products.total}
            description={`${analytics.products.active} active`}
            icon={Package}
          />

          <AnalyticsCard
            title="Total Revenue"
            value={formatCurrency(analytics.revenue.total)}
            description="All time"
            icon={DollarSign}
          />

          <AnalyticsCard
            title="Recent Revenue"
            value={formatCurrency(analytics.revenue.recent30Days)}
            description="Last 30 days"
            icon={TrendingUp}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <a href="/admin/businesses/new" className="block rounded-lg border p-4 transition-colors hover:bg-accent">
                <h3 className="font-medium">Create Business</h3>
                <p className="text-sm text-muted-foreground">Onboard a new business to the platform</p>
              </a>
              <a href="/team/invite" className="block rounded-lg border p-4 transition-colors hover:bg-accent">
                <h3 className="font-medium">Invite User</h3>
                <p className="text-sm text-muted-foreground">Send an invitation to a new user</p>
              </a>
              <a href="/team" className="block rounded-lg border p-4 transition-colors hover:bg-accent">
                <h3 className="font-medium">Manage Team</h3>
                <p className="text-sm text-muted-foreground">View and manage all users</p>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Platform status and metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Order Fulfillment Rate</span>
                <span className="font-medium">
                  {analytics.orders.total > 0
                    ? Math.round((analytics.orders.fulfilled / analytics.orders.total) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Products</span>
                <span className="font-medium">
                  {analytics.products.total > 0
                    ? Math.round((analytics.products.active / analytics.products.total) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Users</span>
                <span className="font-medium">
                  {analytics.users.total > 0 ? Math.round((analytics.users.active / analytics.users.total) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
