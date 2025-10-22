"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { CustomerLayout } from "@/components/customer/layout/customer-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft,
  Clock,
  MapPin,
  CreditCard,
  Package,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ChefHat,
  Calendar,
  Star,
  MessageSquare,
  RefreshCw,
  X,
  Edit3
} from "lucide-react"
import Link from "next/link"

interface OrderItem {
  id: string
  product_id: string
  qty: number
  unit_price_cents: number
  total_price_cents: number
  notes?: string
  product_name?: string
  product_image?: string
}

interface OrderDetails {
  id: string
  business_id: string
  stall_id: string
  customer_user_id: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'fulfilled' | 'cancelled'
  scheduled_for: string
  total_cents: number
  currency: string
  created_at: string
  updated_at: string
  notes?: string
  delivery_option?: 'pickup' | 'delivery'
  delivery_address?: string
  delivery_instructions?: string
  payment_method: 'cash' | 'card'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  subtotal_cents: number
  delivery_fee_cents: number
  tax_cents: number
  stall_name?: string
  stall_cuisine?: string
  items: OrderItem[]
  estimated_ready_time?: string
  actual_ready_time?: string
  status_history?: Array<{
    status: string
    timestamp: string
    notes?: string
  }>
}

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
    description: "Your order is waiting for confirmation"
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800",
    icon: CheckCircle,
    description: "Your order has been confirmed and is being prepared"
  },
  preparing: {
    label: "Preparing",
    color: "bg-orange-100 text-orange-800",
    icon: ChefHat,
    description: "Your order is being prepared"
  },
  ready: {
    label: "Ready",
    color: "bg-green-100 text-green-800",
    icon: Package,
    description: "Your order is ready for pickup/delivery"
  },
  fulfilled: {
    label: "Fulfilled",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    description: "Your order has been completed"
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: AlertTriangle,
    description: "Your order has been cancelled"
  }
}

export default function CustomerOrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails()
    }
  }, [orderId])

  // Auto-refresh order details every 15 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && order) {
        fetchOrderDetails(true) // Silent refresh
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [loading, order])

  const fetchOrderDetails = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      if (silent) setRefreshing(true)
      setError(null)

      const response = await fetch(`/api/customer/orders/${orderId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Order not found")
        }
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to load order details")
      }

      const data = await response.json()
      setOrder(data.order)
    } catch (error) {
      console.error("Fetch order error:", error)
      setError(error instanceof Error ? error.message : "Failed to load order details")
    } finally {
      if (!silent) setLoading(false)
      if (silent) setRefreshing(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!order || order.status !== 'pending') return

    try {
      setCancelling(true)
      const response = await fetch(`/api/customer/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to cancel order")
      }

      // Refresh order details to show updated status
      await fetchOrderDetails()
    } catch (error) {
      console.error("Cancel order error:", error)
      setError(error instanceof Error ? error.message : "Failed to cancel order")
    } finally {
      setCancelling(false)
    }
  }

  const handleReorder = () => {
    if (!order) return
    
    // Navigate to stall page with items pre-selected
    router.push(`/customer/stalls/${order.stall_id}?reorder=${order.id}`)
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString)
      return {
        date: date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        })
      }
    } catch {
      return { date: dateTimeString, time: '' }
    }
  }

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  }

  const getStatusTimeline = () => {
    const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'fulfilled']
    const currentStatusIndex = statuses.indexOf(order?.status || 'pending')
    
    return statuses.map((status, index) => {
      const config = statusConfig[status as keyof typeof statusConfig]
      const isCompleted = index <= currentStatusIndex && order?.status !== 'cancelled'
      const isCurrent = index === currentStatusIndex && order?.status !== 'cancelled'
      const isCancelled = order?.status === 'cancelled'
      
      return {
        status,
        label: config.label,
        icon: config.icon,
        isCompleted: isCompleted && !isCancelled,
        isCurrent: isCurrent && !isCancelled,
        timestamp: order?.status_history?.find(h => h.status === status)?.timestamp
      }
    })
  }

  const canCancelOrder = () => {
    return order?.status === 'pending' && !cancelling
  }

  const canModifyOrder = () => {
    return order?.status === 'pending'
  }

  if (loading) {
    return (
      <CustomerLayout>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-48"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  if (error) {
    return (
      <CustomerLayout>
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Link href="/customer/orders">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Orders
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  if (!order) {
    return (
      <CustomerLayout>
        <div className="p-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link href="/customer/orders">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Button>
            </Link>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  const statusInfo = getStatusConfig(order.status)
  const StatusIcon = statusInfo.icon
  const scheduledDateTime = formatDateTime(order.scheduled_for)

  return (
    <CustomerLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/customer/orders">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Orders
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Order #{order.id.slice(-8).toUpperCase()}
                </h1>
                <p className="text-gray-600">
                  Placed on {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchOrderDetails()}
                disabled={loading || refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <StatusIcon className="h-5 w-5" />
                    Order Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-6">
                    <Badge className={statusInfo.color}>
                      {statusInfo.label}
                    </Badge>
                    <span className="text-gray-600">{statusInfo.description}</span>
                  </div>

                  {/* Status Timeline */}
                  {order.status !== 'cancelled' && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Order Progress</h4>
                      <div className="space-y-3">
                        {getStatusTimeline().map((step, index) => {
                          const StepIcon = step.icon
                          return (
                            <div key={step.status} className="flex items-center gap-3">
                              <div className={`
                                flex items-center justify-center w-8 h-8 rounded-full border-2
                                ${step.isCompleted 
                                  ? 'bg-green-100 border-green-500 text-green-700' 
                                  : step.isCurrent 
                                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                                    : 'bg-gray-100 border-gray-300 text-gray-400'
                                }
                              `}>
                                <StepIcon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className={`font-medium ${
                                  step.isCompleted || step.isCurrent ? 'text-gray-900' : 'text-gray-500'
                                }`}>
                                  {step.label}
                                </div>
                                {step.timestamp && (
                                  <div className="text-sm text-gray-500">
                                    {new Date(step.timestamp).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {order.status === 'cancelled' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-800">
                        <X className="h-4 w-4" />
                        <span className="font-medium">Order Cancelled</span>
                      </div>
                      <p className="text-red-700 text-sm mt-1">
                        This order was cancelled on {new Date(order.updated_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  {order.estimated_ready_time && (
                    <div className="text-sm text-gray-600 mt-4">
                      <strong>Estimated ready time:</strong> {formatDateTime(order.estimated_ready_time).time}
                    </div>
                  )}
                  
                  {order.actual_ready_time && (
                    <div className="text-sm text-gray-600">
                      <strong>Actual ready time:</strong> {formatDateTime(order.actual_ready_time).time}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <ChefHat className="h-4 w-4" />
                    <span className="font-semibold">{order.stall_name}</span>
                    {order.stall_cuisine && (
                      <Badge variant="outline">{order.stall_cuisine}</Badge>
                    )}
                  </div>

                  {order.items.map((item, index) => (
                    <div key={item.id} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product_name || 'Unknown Product'}</h4>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.qty} × {formatCurrency(item.unit_price_cents)}
                          </p>
                          {item.notes && (
                            <p className="text-sm text-gray-600 italic">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">
                            {formatCurrency(item.total_price_cents)}
                          </span>
                        </div>
                      </div>
                      {index < order.items.length - 1 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Delivery/Pickup Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {order.delivery_option === 'delivery' ? 'Delivery' : 'Pickup'} Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{scheduledDateTime.date}</div>
                      <div className="text-sm text-gray-600">{scheduledDateTime.time}</div>
                    </div>
                  </div>

                  {order.delivery_option === 'delivery' && order.delivery_address && (
                    <div>
                      <div className="font-medium">Delivery Address:</div>
                      <div className="text-gray-600">{order.delivery_address}</div>
                      {order.delivery_instructions && (
                        <div className="text-sm text-gray-600 mt-1">
                          <strong>Instructions:</strong> {order.delivery_instructions}
                        </div>
                      )}
                    </div>
                  )}

                  {order.notes && (
                    <div>
                      <div className="font-medium">Order Notes:</div>
                      <div className="text-gray-600">{order.notes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="capitalize">{order.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                      {order.payment_status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatCurrency(order.subtotal_cents)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Delivery Fee</span>
                      <span>{formatCurrency(order.delivery_fee_cents)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>{formatCurrency(order.tax_cents)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{formatCurrency(order.total_cents)}</span>
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="space-y-2">
                    {canCancelOrder() && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handleCancelOrder}
                        disabled={cancelling}
                      >
                        {cancelling ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Cancel Order
                          </>
                        )}
                      </Button>
                    )}

                    {canModifyOrder() && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          // Navigate to edit order page (future implementation)
                          router.push(`/customer/orders/${order.id}/edit`)
                        }}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Modify Order
                      </Button>
                    )}

                    {(order.status === 'fulfilled' || order.status === 'cancelled') && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handleReorder}
                      >
                        Order Again
                      </Button>
                    )}

                    {order.status === 'fulfilled' && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          // Navigate to rating page (future implementation)
                          router.push(`/customer/orders/${order.id}/review`)
                        }}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Rate Order
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Help */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Need Help?
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <p>If you have any questions about your order, please contact the stall directly or reach out to our support team.</p>
                  <Button variant="link" className="p-0 h-auto mt-2">
                    Contact Support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}