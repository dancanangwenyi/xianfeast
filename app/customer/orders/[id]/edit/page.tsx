"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { CustomerLayout } from "@/components/customer/layout/customer-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft,
  Calendar,
  Clock,
  Save,
  AlertTriangle,
  Loader2
} from "lucide-react"
import Link from "next/link"

interface OrderDetails {
  id: string
  stall_name?: string
  status: string
  scheduled_for: string
  total_cents: number
  items: Array<{
    product_name?: string
    qty: number
  }>
}

export default function EditOrderPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [scheduledFor, setScheduledFor] = useState("")
  const [reason, setReason] = useState("")

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails()
    }
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
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
      
      // Set initial form values
      setScheduledFor(data.order.scheduled_for.slice(0, 16)) // Format for datetime-local input
    } catch (error) {
      console.error("Fetch order error:", error)
      setError(error instanceof Error ? error.message : "Failed to load order details")
    } finally {
      setLoading(false)
    }
  }

  const handleReschedule = async () => {
    if (!order || !scheduledFor) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/customer/orders/${orderId}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheduled_for: new Date(scheduledFor).toISOString(),
          reason: reason.trim() || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to reschedule order")
      }

      const data = await response.json()
      setSuccess("Order rescheduled successfully!")
      
      // Redirect back to order details after a short delay
      setTimeout(() => {
        router.push(`/customer/orders/${orderId}`)
      }, 2000)

    } catch (error) {
      console.error("Reschedule error:", error)
      setError(error instanceof Error ? error.message : "Failed to reschedule order")
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const canEdit = () => {
    return order && ['pending', 'confirmed'].includes(order.status)
  }

  if (loading) {
    return (
      <CustomerLayout>
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-48"></div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  if (error && !order) {
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
            <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have permission to edit it.</p>
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

  if (!canEdit()) {
    return (
      <CustomerLayout>
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This order cannot be modified because its status is "{order.status}". 
                Only pending or confirmed orders can be rescheduled.
              </AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Link href={`/customer/orders/${orderId}`}>
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Order Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href={`/customer/orders/${orderId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Order
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Order #{order.id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-gray-600">
                Reschedule your order from {order.stall_name}
              </p>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Stall:</span>
                  <div className="font-medium">{order.stall_name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Total:</span>
                  <div className="font-medium">{formatCurrency(order.total_cents)}</div>
                </div>
              </div>
              
              <div>
                <span className="text-gray-600">Items:</span>
                <div className="mt-1">
                  {order.items.map((item, index) => (
                    <div key={index} className="text-sm">
                      {item.qty}x {item.product_name || 'Unknown Product'}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reschedule Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Reschedule Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_for">New Date & Time</Label>
                <Input
                  id="scheduled_for"
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
                <p className="text-sm text-gray-600">
                  Current: {new Date(order.scheduled_for).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Rescheduling (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Let the stall know why you're rescheduling..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleReschedule}
                  disabled={saving || !scheduledFor}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Rescheduling...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Reschedule Order
                    </>
                  )}
                </Button>
                <Link href={`/customer/orders/${orderId}`}>
                  <Button variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card>
            <CardContent className="pt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Important Notes:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• The stall will be notified of your rescheduling request</li>
                  <li>• You can only reschedule pending or confirmed orders</li>
                  <li>• Orders can only be rescheduled to future dates and times</li>
                  <li>• The stall may contact you if the new time isn't available</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CustomerLayout>
  )
}