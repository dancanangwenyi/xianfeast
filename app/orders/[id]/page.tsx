"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowLeft } from "lucide-react"

interface OrderItem {
  id: string
  product_id: string
  qty: number
  unit_price_cents: number
  total_price_cents: number
  notes: string
}

interface Order {
  id: string
  status: string
  scheduled_for: string
  total_cents: number
  currency: string
  created_at: string
  notes: string
  items: OrderItem[]
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [resolvedParams.id])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${resolvedParams.id}`)
      const data = await response.json()
      setOrder(data.order)
    } catch (error) {
      console.error("Error fetching order:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setActionLoading(true)
    try {
      await fetch(`/api/orders/${resolvedParams.id}/confirm`, { method: "POST" })
      fetchOrder()
    } catch (error) {
      console.error("Error confirming order:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    setActionLoading(true)
    try {
      await fetch(`/api/orders/${resolvedParams.id}/cancel`, { method: "POST" })
      fetchOrder()
    } catch (error) {
      console.error("Error cancelling order:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return <div className="min-h-screen bg-background p-8">Loading...</div>
  }

  if (!order) {
    return <div className="min-h-screen bg-background p-8">Order not found</div>
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Order #{order.id.slice(0, 8)}</h1>
            <div className="mt-2 flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(order.scheduled_for)}</span>
            </div>
          </div>
          <Badge variant={order.status === "confirmed" ? "default" : "secondary"}>{order.status}</Badge>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium">Product ID: {item.product_id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.qty}</p>
                      {item.notes && <p className="text-sm text-muted-foreground">Notes: {item.notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(Number(item.total_price_cents))}</p>
                      <p className="text-sm text-muted-foreground">{formatPrice(Number(item.unit_price_cents))} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Order Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-2xl font-bold">
                <span>Total</span>
                <span>{formatPrice(Number(order.total_cents))}</span>
              </div>
            </CardContent>
          </Card>

          {order.status === "draft" && (
            <div className="flex gap-4">
              <Button onClick={handleConfirm} disabled={actionLoading} className="flex-1">
                {actionLoading ? "Processing..." : "Confirm Order"}
              </Button>
              <Button onClick={handleCancel} disabled={actionLoading} variant="destructive" className="flex-1">
                Cancel Order
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
