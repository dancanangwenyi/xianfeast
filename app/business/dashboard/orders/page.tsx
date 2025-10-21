"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { Search, Filter, ShoppingCart, Eye, CheckCircle, Clock, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Order {
  id: string
  customer_name: string
  customer_email: string
  stall_name: string
  total_amount: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'fulfilled'
  created_at: string
  delivery_date: string
  items_count: number
  order_type?: 'customer' | 'internal'
  delivery_option?: 'pickup' | 'delivery'
  payment_method?: 'cash' | 'card'
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
}

export default function BusinessOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all')
  const [orderStats, setOrderStats] = useState<any>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [orderTypeFilter])

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        include_customer_orders: 'true',
        type: orderTypeFilter
      })
      
      const response = await fetch(`/api/businesses/my-orders?${params}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setOrderStats(data.stats || {})
      } else {
        console.error('Failed to fetch orders')
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.stall_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white', label: 'Pending', icon: Clock },
      confirmed: { color: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white', label: 'Confirmed', icon: CheckCircle },
      preparing: { color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white', label: 'Preparing', icon: Clock },
      ready: { color: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white', label: 'Ready', icon: CheckCircle },
      completed: { color: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white', label: 'Completed', icon: CheckCircle },
      cancelled: { color: 'bg-gradient-to-r from-red-500 to-rose-500 text-white', label: 'Cancelled', icon: XCircle },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    return (
      <Badge className={`${config.color} shadow-md flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    // Mock status update for demonstration
    toast({
      title: "Success",
      description: `Order status updated to ${newStatus} (demo mode)`,
    })
    
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus as any } : order
    ))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground mt-1">Loading your orders...</p>
          </div>
        </div>
        
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-card via-card to-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              Orders Management
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              Track and manage all orders ({orderStats.total || orders.length} total: {orderStats.customer_orders || 0} customer, {orderStats.internal_orders || 0} internal)
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-r from-card via-card to-card/80 backdrop-blur-sm border border-border/50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search orders by customer, email, or stall..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Order Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="customer">Customer Orders</SelectItem>
                <SelectItem value="internal">Internal Orders</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm border border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-500" />
            Recent Orders
          </CardTitle>
          <CardDescription>
            Manage and track all customer orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? "No orders match your current filters" 
                  : "Orders will appear here once customers start placing them"
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Stall</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{order.stall_name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={order.order_type === 'customer' ? 'default' : 'secondary'}
                        className={order.order_type === 'customer' 
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' 
                          : 'bg-muted text-muted-foreground'
                        }
                      >
                        {order.order_type === 'customer' ? 'Customer' : 'Internal'}
                      </Badge>
                      {order.delivery_option && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {order.delivery_option === 'delivery' ? '🚚 Delivery' : '📦 Pickup'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${order.total_amount.toFixed(2)}
                      <div className="text-sm text-muted-foreground">
                        {order.items_count} items
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(order.delivery_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {order.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                          >
                            Confirm
                          </Button>
                        )}
                        {order.status === 'confirmed' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusUpdate(order.id, 'preparing')}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                          >
                            Start Prep
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusUpdate(order.id, 'ready')}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                          >
                            Mark Ready
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}