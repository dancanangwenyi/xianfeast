"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ShoppingCart,
  Search,
  MoreHorizontal,
  Eye,
  Download,
  TrendingUp,
  Calendar,
  Clock,
  DollarSign,
  Building2,
  User,
  Package,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Filter,
  BarChart3,
} from "lucide-react"
import { motion } from "framer-motion"
import { formatPrice } from "@/lib/currency"

interface Order {
  id: string
  businessId: string
  businessName: string
  stallId: string
  stallName: string
  customerId: string
  customerName: string
  customerEmail: string
  status: "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled"
  totalCents: number
  currency: string
  itemsCount: number
  scheduledFor: string
  createdAt: string
  notes?: string
  items: OrderItem[]
}

interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPriceCents: number
  totalPriceCents: number
  notes?: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [businessFilter, setBusinessFilter] = useState<string>("all")
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      try {
        // Mock data - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setOrders([
          {
            id: "ORD-001",
            businessId: "1",
            businessName: "Golden Dragon Restaurant",
            stallId: "1",
            stallName: "Main Kitchen",
            customerId: "1",
            customerName: "John Doe",
            customerEmail: "john@example.com",
            status: "confirmed",
            totalCents: 2450,
            currency: "KES",
            itemsCount: 3,
            scheduledFor: "2024-10-16T19:30:00Z",
            createdAt: "2024-10-16T18:45:00Z",
            notes: "Extra spicy",
            items: [
              {
                id: "1",
                productId: "1",
                productName: "Kung Pao Chicken",
                quantity: 2,
                unitPriceCents: 1200,
                totalPriceCents: 2400,
              },
              {
                id: "2",
                productId: "2",
                productName: "Spring Rolls",
                quantity: 1,
                unitPriceCents: 500,
                totalPriceCents: 500,
              }
            ]
          },
          {
            id: "ORD-002",
            businessId: "2",
            businessName: "Spice Garden",
            stallId: "2",
            stallName: "Indian Street Food",
            customerId: "2",
            customerName: "Jane Smith",
            customerEmail: "jane@example.com",
            status: "preparing",
            totalCents: 1800,
            currency: "KES",
            itemsCount: 2,
            scheduledFor: "2024-10-16T20:00:00Z",
            createdAt: "2024-10-16T19:15:00Z",
            items: [
              {
                id: "3",
                productId: "3",
                productName: "Chicken Biryani",
                quantity: 1,
                unitPriceCents: 1500,
                totalPriceCents: 1500,
              },
              {
                id: "4",
                productId: "4",
                productName: "Mango Lassi",
                quantity: 1,
                unitPriceCents: 300,
                totalPriceCents: 300,
              }
            ]
          },
          {
            id: "ORD-003",
            businessId: "1",
            businessName: "Golden Dragon Restaurant",
            stallId: "1",
            stallName: "Main Kitchen",
            customerId: "3",
            customerName: "Mike Johnson",
            customerEmail: "mike@example.com",
            status: "ready",
            totalCents: 3200,
            currency: "KES",
            itemsCount: 4,
            scheduledFor: "2024-10-16T19:45:00Z",
            createdAt: "2024-10-16T18:30:00Z",
            items: [
              {
                id: "5",
                productId: "5",
                productName: "Sweet and Sour Pork",
                quantity: 1,
                unitPriceCents: 1400,
                totalPriceCents: 1400,
              },
              {
                id: "6",
                productId: "6",
                productName: "Fried Rice",
                quantity: 1,
                unitPriceCents: 800,
                totalPriceCents: 800,
              },
              {
                id: "7",
                productId: "7",
                productName: "Wonton Soup",
                quantity: 1,
                unitPriceCents: 600,
                totalPriceCents: 600,
              },
              {
                id: "8",
                productId: "8",
                productName: "Fortune Cookie",
                quantity: 1,
                unitPriceCents: 200,
                totalPriceCents: 200,
              }
            ]
          },
          {
            id: "ORD-004",
            businessId: "3",
            businessName: "Tokyo Sushi Bar",
            stallId: "3",
            stallName: "Sushi Counter",
            customerId: "4",
            customerName: "Sarah Wilson",
            customerEmail: "sarah@example.com",
            status: "completed",
            totalCents: 4500,
            currency: "KES",
            itemsCount: 2,
            scheduledFor: "2024-10-16T19:00:00Z",
            createdAt: "2024-10-16T18:00:00Z",
            items: [
              {
                id: "9",
                productId: "9",
                productName: "Salmon Roll",
                quantity: 2,
                unitPriceCents: 1800,
                totalPriceCents: 3600,
              },
              {
                id: "10",
                productId: "10",
                productName: "Miso Soup",
                quantity: 1,
                unitPriceCents: 400,
                totalPriceCents: 400,
              }
            ]
          },
          {
            id: "ORD-005",
            businessId: "2",
            businessName: "Spice Garden",
            stallId: "2",
            stallName: "Indian Street Food",
            customerId: "5",
            customerName: "David Brown",
            customerEmail: "david@example.com",
            status: "cancelled",
            totalCents: 2200,
            currency: "KES",
            itemsCount: 3,
            scheduledFor: "2024-10-16T20:30:00Z",
            createdAt: "2024-10-16T19:00:00Z",
            notes: "Customer cancelled - change of plans",
            items: [
              {
                id: "11",
                productId: "11",
                productName: "Butter Chicken",
                quantity: 1,
                unitPriceCents: 1600,
                totalPriceCents: 1600,
              },
              {
                id: "12",
                productId: "12",
                productName: "Naan Bread",
                quantity: 2,
                unitPriceCents: 300,
                totalPriceCents: 600,
              }
            ]
          }
        ])
      } catch (error) {
        console.error("Failed to fetch orders:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.businessName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesBusiness = businessFilter === "all" || order.businessId === businessFilter
    return matchesSearch && matchesStatus && matchesBusiness
  })

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
      case "preparing":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800"
      case "ready":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800"
    }
  }

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3" />
      case "confirmed":
        return <CheckCircle className="h-3 w-3" />
      case "preparing":
        return <RefreshCw className="h-3 w-3" />
      case "ready":
        return <Package className="h-3 w-3" />
      case "completed":
        return <CheckCircle className="h-3 w-3" />
      case "cancelled":
        return <XCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const formatCurrency = (cents: number, currency: string) => {
    return formatPrice(cents, currency as any)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Orders Management
            </h1>
            <p className="text-slate-600 mt-1">Monitor and manage all orders across the platform</p>
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
            Orders Management
          </h1>
          <p className="text-slate-600 mt-1">Monitor and manage all orders across the platform</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            AI Forecast
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{orders.length}</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% this week
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
              <CardTitle className="text-sm font-medium text-slate-600">Active Orders</CardTitle>
              <RefreshCw className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {orders.filter(o => ["pending", "confirmed", "preparing", "ready"].includes(o.status)).length}
              </div>
              <p className="text-xs text-blue-600 mt-1">In progress</p>
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
              <CardTitle className="text-sm font-medium text-slate-600">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {orders.filter(o => o.status === "completed").length}
              </div>
              <p className="text-xs text-green-600 mt-1">Successfully delivered</p>
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
              <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(orders.reduce((sum, o) => sum + o.totalCents, 0), "KES")}
              </div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8% this week
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Businesses */}
      <Card>
        <CardHeader>
          <CardTitle>Top Businesses by Order Volume</CardTitle>
          <CardDescription>This week's performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.reduce((acc, order) => {
              const business = acc.find(b => b.id === order.businessId)
              if (business) {
                business.orderCount++
                business.revenue += order.totalCents
              } else {
                acc.push({
                  id: order.businessId,
                  name: order.businessName,
                  orderCount: 1,
                  revenue: order.totalCents
                })
              }
              return acc
            }, [] as { id: string; name: string; orderCount: number; revenue: number }[])
            .sort((a, b) => b.orderCount - a.orderCount)
            .slice(0, 5)
            .map((business, index) => (
              <motion.div
                key={business.id}
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
                    <div className="font-medium">{business.name}</div>
                    <div className="text-sm text-slate-500">{business.orderCount} orders</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(business.revenue, "KES")}</div>
                  <div className="text-sm text-slate-500">Revenue</div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search orders by ID, customer, or business..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-48">
              <Select value={businessFilter} onValueChange={setBusinessFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by business" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Businesses</SelectItem>
                  <SelectItem value="1">Golden Dragon Restaurant</SelectItem>
                  <SelectItem value="2">Spice Garden</SelectItem>
                  <SelectItem value="3">Tokyo Sushi Bar</SelectItem>
                  <SelectItem value="4">Mediterranean Bistro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            {filteredOrders.length} orders found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-slate-50"
                >
                  <TableCell>
                    <div className="font-mono text-sm font-medium">{order.id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                          {order.customerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-sm text-slate-500">{order.customerEmail}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-1 text-slate-400" />
                      <span className="text-sm">{order.businessName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-1 text-slate-400" />
                      {order.itemsCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(order.totalCents, order.currency)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-500">
                      {formatDateTime(order.scheduledFor)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-500">
                      {formatDateTime(order.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                          setSelectedOrder(order)
                          setIsDetailDialogOpen(true)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Update Status
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel Order
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>{selectedOrder?.id}</span>
            </DialogTitle>
            <DialogDescription>
              Order details and management options
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-slate-600 mb-2">Customer Information</h4>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">{selectedOrder.customerEmail}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-slate-600 mb-2">Business Information</h4>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">{selectedOrder.businessName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">{selectedOrder.stallName}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-600 mb-2">Order Status</h4>
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {getStatusIcon(selectedOrder.status)}
                  <span className="ml-1 capitalize">{selectedOrder.status}</span>
                </Badge>
              </div>

              <div>
                <h4 className="font-medium text-slate-600 mb-3">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-slate-500">Qty: {item.quantity}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(item.totalPriceCents, selectedOrder.currency)}</div>
                        <div className="text-sm text-slate-500">{formatCurrency(item.unitPriceCents, selectedOrder.currency)} each</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-lg">{formatCurrency(selectedOrder.totalCents, selectedOrder.currency)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h4 className="font-medium text-slate-600 mb-2">Notes</h4>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-slate-600 mb-2">Timeline</h4>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">Created: {formatDateTime(selectedOrder.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">Scheduled: {formatDateTime(selectedOrder.scheduledFor)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
            <Button>
              <RefreshCw className="h-4 w-4 mr-2" />
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
