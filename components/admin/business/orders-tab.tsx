"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ShoppingCart, Clock, CheckCircle, XCircle, DollarSign, User, Store } from "lucide-react"

interface Order {
  id: string
  business_id: string
  stall_id: string
  customer_user_id: string
  status: string
  scheduled_for: string
  total_cents: number
  currency: string
  created_at: string
  updated_at: string
  notes?: string
  items?: OrderItem[]
}

interface OrderItem {
  id: string
  order_id: string
  product_id: string
  qty: number
  unit_price_cents: number
  total_price_cents: number
  notes?: string
}

interface OrdersTabProps {
  businessId: string
}

export function OrdersTab({ businessId }: OrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [businessId, statusFilter])

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({ businessId })
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      
      const response = await fetch(`/api/orders?${params}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Order status updated successfully",
        })
        fetchOrders()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update order status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  const formatPrice = (cents: number, currency: string) => {
    return `${currency} ${(cents / 100).toFixed(2)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "secondary"
      case "confirmed": return "default"
      case "preparing": return "outline"
      case "ready": return "default"
      case "fulfilled": return "default"
      case "cancelled": return "destructive"
      default: return "secondary"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />
      case "confirmed": return <CheckCircle className="h-4 w-4" />
      case "preparing": return <Clock className="h-4 w-4" />
      case "ready": return <CheckCircle className="h-4 w-4" />
      case "fulfilled": return <CheckCircle className="h-4 w-4" />
      case "cancelled": return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "pending": return "confirmed"
      case "confirmed": return "preparing"
      case "preparing": return "ready"
      case "ready": return "fulfilled"
      default: return null
    }
  }

  const getNextStatusLabel = (currentStatus: string) => {
    switch (currentStatus) {
      case "pending": return "Confirm"
      case "confirmed": return "Start Preparing"
      case "preparing": return "Mark Ready"
      case "ready": return "Mark Fulfilled"
      default: return null
    }
  }

  if (loading) {
    return <div>Loading orders...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Orders Management</h3>
          <p className="text-sm text-muted-foreground">
            View and manage all orders for this business
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">
              {statusFilter === "all" ? "No orders yet" : `No ${statusFilter} orders`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Order #{order.id.slice(-8)}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Customer: {order.customer_user_id.slice(-8)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Store className="h-4 w-4" />
                          Stall: {order.stall_id.slice(-8)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(order.scheduled_for).toLocaleString()}
                        </span>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(order.status)} className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">
                      {formatPrice(order.total_cents, order.currency)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(order.created_at).toLocaleString()}
                  </div>
                </div>

                {order.notes && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm">{order.notes}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  {order.status !== "cancelled" && order.status !== "fulfilled" && (
                    <>
                      {getNextStatus(order.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateOrderStatus(order.id, getNextStatus(order.status)!)}
                        >
                          {getNextStatusLabel(order.status)}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(order.id, "cancelled")}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}