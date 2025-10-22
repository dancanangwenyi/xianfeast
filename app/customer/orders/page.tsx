"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { CustomerLayout } from "@/components/customer/layout/customer-layout"
import { 
  Clock, 
  Calendar, 
  MapPin, 
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw
} from "lucide-react"

interface Order {
  id: string
  stall_name: string
  stall_cuisine: string
  status: string
  total_amount_cents: number
  created_at: string
  scheduled_for?: string
  items: Array<{
    id: string
    product_name: string
    product_image?: string
    quantity: number
    unit_price_cents: number
  }>
  item_count: number
}

interface OrdersData {
  orders: Order[]
  pagination: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
  stats: {
    total: number
    pending: number
    confirmed: number
    in_preparation: number
    completed: number
    canceled: number
  }
}

function CustomerOrdersPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ordersData, setOrdersData] = useState<OrdersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(searchParams.get("status") || "all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [activeTab, sortBy, sortOrder])

  // Auto-refresh orders every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        loadOrders(true) // Silent refresh
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [loading])

  const loadOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      if (silent) setRefreshing(true)
      
      const params = new URLSearchParams()
      if (activeTab !== "all") params.set("status", activeTab)
      params.set("sort", sortBy)
      params.set("order", sortOrder)

      const response = await fetch(`/api/customer/orders?${params.toString()}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/customer/login")
          return
        }
        throw new Error("Failed to load orders")
      }
      
      const data = await response.json()
      setOrdersData(data)
      setError(null)
    } catch (error) {
      console.error("Orders error:", error)
      setError("Failed to load orders. Please try again.")
    } finally {
      if (!silent) setLoading(false)
      if (silent) setRefreshing(false)
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />
      case 'in_preparation':
        return <Loader className="h-4 w-4" />
      case 'completed':
        return <Package className="h-4 w-4" />
      case 'canceled':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_preparation': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'canceled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value !== "all") {
      params.set("status", value)
    } else {
      params.delete("status")
    }
    router.push(`/customer/orders?${params.toString()}`)
  }

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const handleRefresh = () => {
    loadOrders()
  }

  // Filter orders based on search query
  const filteredOrders = ordersData?.orders.filter(order => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      order.id.toLowerCase().includes(query) ||
      order.stall_name.toLowerCase().includes(query) ||
      order.stall_cuisine?.toLowerCase().includes(query) ||
      order.items.some(item => item.product_name.toLowerCase().includes(query))
    )
  }) || []

  if (loading) {
    return (
      <CustomerLayout>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full" />
                  </div>
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
          <Button onClick={loadOrders}>Try Again</Button>
        </div>
      </CustomerLayout>
    )
  }

  if (!ordersData) {
    return (
      <CustomerLayout>
        <div className="p-6 text-center">
          <div className="text-gray-600">No data available</div>
        </div>
      </CustomerLayout>
    )
  }

  const { orders, stats } = ordersData

  return (
    <CustomerLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-2">
              Track and manage your {stats.total} orders
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search orders, stalls, or items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="scheduled_for">Scheduled</SelectItem>
                <SelectItem value="total_amount_cents">Amount</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Order Status Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              All ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm">
              Pending ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="text-xs sm:text-sm">
              Confirmed ({stats.confirmed})
            </TabsTrigger>
            <TabsTrigger value="in_preparation" className="text-xs sm:text-sm">
              Preparing ({stats.in_preparation})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm">
              Completed ({stats.completed})
            </TabsTrigger>
            <TabsTrigger value="canceled" className="text-xs sm:text-sm">
              Canceled ({stats.canceled})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            Order #{order.id.slice(-8)}
                          </CardTitle>
                          <CardDescription>
                            {order.stall_name} • {order.stall_cuisine}
                          </CardDescription>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} flex items-center space-x-1`}>
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Order Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Ordered: {formatDate(order.created_at)}</span>
                          </div>
                          {order.scheduled_for && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>Scheduled: {formatDate(order.scheduled_for)}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Package className="h-4 w-4" />
                            <span>{order.item_count} item{order.item_count !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Items:</p>
                          <div className="space-y-1">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                                <span className="text-gray-700">
                                  {item.quantity}x {item.product_name}
                                </span>
                                <span className="font-medium text-gray-900">
                                  {formatCurrency(item.unit_price_cents * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Total and Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="text-lg font-bold text-gray-900">
                            Total: {formatCurrency(order.total_amount_cents)}
                          </div>
                          <div className="flex space-x-2">
                            <Link href={`/customer/orders/${order.id}`}>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </Link>
                            {order.status === 'completed' && (
                              <Button size="sm">
                                Reorder
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === "all" ? "No orders yet" : `No ${activeTab.replace('_', ' ')} orders`}
                </h3>
                <p className="text-gray-600 mb-6">
                  {activeTab === "all" 
                    ? "Start exploring stalls and place your first order!"
                    : `You don't have any ${activeTab.replace('_', ' ')} orders at the moment.`
                  }
                </p>
                <Link href="/customer/stalls">
                  <Button>
                    Browse Stalls
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </CustomerLayout>
  )
}

export default function CustomerOrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    }>
      <CustomerOrdersPageContent />
    </Suspense>
  )
}