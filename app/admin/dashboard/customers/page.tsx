"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users,
  Search,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Calendar,
  Eye,
  UserCheck,
  UserX,
  Clock,
  BarChart3,
  Filter
} from "lucide-react"
import { motion } from "framer-motion"

interface Customer {
  id: string
  name: string
  email: string
  created_at: string
  status: 'active' | 'inactive'
  total_orders: number
  total_spent: number
  last_order_date?: string
  favorite_stalls: string[]
}

interface CustomerAnalytics {
  signup_trends: {
    total_customers: number
    new_this_week: number
    new_this_month: number
  }
  order_patterns: {
    total_orders: number
    orders_this_week: number
    orders_this_month: number
    average_order_value: number
    total_revenue: number
  }
  retention_metrics: {
    total_customers: number
    active_customers: number
    retention_rate: number
    repeat_customers: number
  }
  popular_stalls: Array<{
    stall_name: string
    business_name: string
    order_count: number
    revenue: number
  }>
  weekly_signups: Array<{
    week: string
    signup_count: number
  }>
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchCustomersAndAnalytics()
  }, [])

  const fetchCustomersAndAnalytics = async () => {
    setLoading(true)
    try {
      // Fetch customer analytics
      const analyticsResponse = await fetch('/api/admin/customer-analytics')
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setAnalytics(analyticsData)
      }

      // Mock customer data - in real implementation, this would come from an API
      // that aggregates user data with order statistics
      const mockCustomers: Customer[] = [
        {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          created_at: "2024-10-01T10:00:00Z",
          status: "active",
          total_orders: 12,
          total_spent: 245.50,
          last_order_date: "2024-10-15T19:30:00Z",
          favorite_stalls: ["Golden Dragon", "Spice Garden"]
        },
        {
          id: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          created_at: "2024-09-15T14:30:00Z",
          status: "active",
          total_orders: 8,
          total_spent: 156.75,
          last_order_date: "2024-10-14T20:15:00Z",
          favorite_stalls: ["Tokyo Sushi"]
        },
        {
          id: "3",
          name: "Mike Johnson",
          email: "mike@example.com",
          created_at: "2024-08-20T09:15:00Z",
          status: "inactive",
          total_orders: 3,
          total_spent: 67.25,
          last_order_date: "2024-09-05T18:45:00Z",
          favorite_stalls: ["Mediterranean Bistro"]
        }
      ]
      
      setCustomers(mockCustomers)
    } catch (error) {
      console.error("Failed to fetch customer data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
        <UserCheck className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">
        <UserX className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Customer Management
            </h1>
            <p className="text-slate-600 mt-1">Loading customer data and analytics...</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-slate-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Customer Management
          </h1>
          <p className="text-slate-600 mt-1">Monitor customer activity, orders, and growth trends</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{analytics.signup_trends.total_customers}</div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{analytics.signup_trends.new_this_month} this month
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Active Customers</CardTitle>
                <UserCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{analytics.retention_metrics.active_customers}</div>
                <p className="text-xs text-green-600 mt-1">
                  {analytics.retention_metrics.retention_rate.toFixed(1)}% retention rate
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{analytics.order_patterns.total_orders}</div>
                <p className="text-xs text-blue-600 mt-1">
                  +{analytics.order_patterns.orders_this_week} this week
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Customer Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(analytics.order_patterns.total_revenue)}
                </div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Avg: {formatCurrency(analytics.order_patterns.average_order_value)}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Popular Stalls */}
      {analytics && analytics.popular_stalls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Popular Stalls Among Customers</CardTitle>
            <CardDescription>Top performing stalls by customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.popular_stalls.slice(0, 5).map((stall, index) => (
                <motion.div
                  key={stall.stall_name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{stall.stall_name}</div>
                      <div className="text-sm text-slate-500">{stall.business_name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{stall.order_count} orders</div>
                    <div className="text-sm text-slate-500">{formatCurrency(stall.revenue)}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search customers by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>
            {filteredCustomers.length} customers found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No customers found</h3>
              <p className="text-slate-500">
                {searchTerm || statusFilter !== 'all' 
                  ? "No customers match your current filters" 
                  : "Customer data will appear here once users sign up"
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer, index) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-slate-50"
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                            {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-slate-500">{customer.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(customer.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <ShoppingCart className="h-4 w-4 mr-1 text-slate-400" />
                        {customer.total_orders}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(customer.total_spent)}</div>
                    </TableCell>
                    <TableCell>
                      {customer.last_order_date ? (
                        <div className="text-sm">
                          {formatDate(customer.last_order_date)}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400">Never</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-slate-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(customer.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}