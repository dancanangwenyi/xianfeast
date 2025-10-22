"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CustomerLayout } from "@/components/customer/layout/customer-layout"

import { 
  Store, 
  Clock, 
  ShoppingCart, 
  TrendingUp, 
  Calendar,
  MapPin,
  Star,
  ArrowRight,
  DollarSign
} from "lucide-react"

interface DashboardData {
  customer: {
    id: string
    name: string
    email: string
    customer_preferences: any
    customer_stats: {
      total_orders: number
      total_spent_cents: number
      upcoming_orders_count: number
      favorite_stalls: string[]
    }
  }
  recent_orders: any[]
  upcoming_orders: any[]
  available_stalls: any[]
  stats: any
}

export default function CustomerDashboardPage() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      // First check if user is authenticated
      const authResponse = await fetch("/api/auth/verify-session")
      
      if (!authResponse.ok) {
        // Not authenticated, redirect to login
        router.push("/customer/login")
        return
      }

      const sessionData = await authResponse.json()
      
      // Check if user has customer role
      if (!sessionData.roles?.includes("customer")) {
        // Not a customer, redirect to appropriate dashboard
        if (sessionData.roles?.includes("super_admin")) {
          router.push("/admin/dashboard")
        } else {
          router.push("/login")
        }
        return
      }

      // User is authenticated as customer, load dashboard data
      await loadDashboardData()
    } catch (error) {
      console.error("Auth check error:", error)
      router.push("/customer/login")
    }
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/customer/dashboard")
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/customer/login")
          return
        }
        throw new Error("Failed to load dashboard data")
      }
      
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error("Dashboard error:", error)
      setError("Failed to load dashboard. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'in_preparation': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'canceled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading || !mounted) {
    return (
      <CustomerLayout>
        <div className="p-4 sm:p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 sm:h-8 w-48 sm:w-64" />
            <Skeleton className="h-4 w-64 sm:w-96" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 sm:p-6">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 sm:h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CustomerLayout>
    )
  }

  if (error) {
    return (
      <CustomerLayout>
        <div className="p-6 text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={checkAuthAndLoadData}>Try Again</Button>
        </div>
      </CustomerLayout>
    )
  }

  if (!dashboardData) {
    return (
      <CustomerLayout>
        <div className="p-6 text-center">
          <div className="text-gray-600">No data available</div>
        </div>
      </CustomerLayout>
    )
  }

  const { customer, recent_orders, upcoming_orders, available_stalls, stats } = dashboardData

  return (
    <CustomerLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Welcome Section */}
        <div className="space-y-4">
          <div className="animate-in fade-in duration-500">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Welcome back, {customer.name}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400 animate-in fade-in duration-700 delay-100">
              Ready to discover your next favorite meal?
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="hover:shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-4 delay-200 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_orders}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-4 delay-300 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(stats.total_spent_cents)}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-4 delay-400 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming Orders</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.upcoming_orders_count}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-4 delay-500 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Favorite Stalls</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.favorite_stalls.length}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/customer/stalls">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Store className="h-5 w-5 text-indigo-600" />
                  <span>Browse Stalls</span>
                </CardTitle>
                <CardDescription>
                  Discover delicious meals from {available_stalls.length} active stalls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  Explore Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/customer/orders">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span>My Orders</span>
                </CardTitle>
                <CardDescription>
                  Track your {recent_orders.length} orders and order history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  View Orders
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/customer/cart">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  <span>My Cart</span>
                </CardTitle>
                <CardDescription>
                  Review items and place your next order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  View Cart
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Upcoming Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Upcoming Orders</span>
                <Link href="/customer/orders">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming_orders.length > 0 ? (
                <div className="space-y-4">
                  {upcoming_orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{order.stall_name}</p>
                        <p className="text-sm text-gray-600">
                          {order.scheduled_for ? formatDate(order.scheduled_for) : 'No schedule'}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {formatCurrency(order.total_amount_cents || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No upcoming orders</p>
                  <Link href="/customer/stalls">
                    <Button className="mt-4">Browse Stalls</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Stalls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Popular Stalls</span>
                <Link href="/customer/stalls">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {available_stalls.length > 0 ? (
                <div className="space-y-4">
                  {available_stalls.slice(0, 3).map((stall) => (
                    <Link key={stall.id} href={`/customer/stalls/${stall.id}`}>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{stall.name}</p>
                          <p className="text-sm text-gray-600">{stall.cuisine_type}</p>
                          <p className="text-xs text-gray-500">{stall.product_count} items available</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {stall.min_price_cents > 0 && stall.max_price_cents > 0 
                              ? `${formatCurrency(stall.min_price_cents)} - ${formatCurrency(stall.max_price_cents)}`
                              : 'View Menu'
                            }
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No stalls available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {recent_orders.length > 0 && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recent_orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Order from {order.stall_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CustomerLayout>
  )
}