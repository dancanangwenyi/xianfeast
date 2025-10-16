"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarOrderPicker } from "@/components/calendar-order-picker"
import { Plus, Minus, Trash2 } from "lucide-react"

interface Product {
  id: string
  title: string
  short_desc: string
  price_cents: number
  currency: string
}

interface OrderItem {
  productId: string
  product: Product
  qty: number
  unitPriceCents: number
  notes: string
}

export default function NewOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [notes, setNotes] = useState("")

  // TODO: Get these from context or URL params
  const stallId = "stall-1"
  const businessId = "business-1"

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products?stallId=${stallId}&status=active`)
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const addProduct = (product: Product) => {
    const existing = orderItems.find((item) => item.productId === product.id)
    if (existing) {
      setOrderItems(orderItems.map((item) => (item.productId === product.id ? { ...item, qty: item.qty + 1 } : item)))
    } else {
      setOrderItems([
        ...orderItems,
        {
          productId: product.id,
          product,
          qty: 1,
          unitPriceCents: Number(product.price_cents),
          notes: "",
        },
      ])
    }
  }

  const updateQuantity = (productId: string, delta: number) => {
    setOrderItems(
      orderItems
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.qty + delta
            return newQty > 0 ? { ...item, qty: newQty } : null
          }
          return item
        })
        .filter(Boolean) as OrderItem[],
    )
  }

  const removeItem = (productId: string) => {
    setOrderItems(orderItems.filter((item) => item.productId !== productId))
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.unitPriceCents * item.qty, 0)
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!selectedDate) {
      setError("Please select a delivery date")
      setLoading(false)
      return
    }

    if (orderItems.length === 0) {
      setError("Please add at least one item to your order")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          stallId,
          scheduledFor: selectedDate.toISOString(),
          items: orderItems.map((item) => ({
            productId: item.productId,
            qty: item.qty,
            unitPriceCents: item.unitPriceCents,
            notes: item.notes,
          })),
          notes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order")
      }

      router.push(`/orders/${data.orderId}`)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold">Create New Order</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Delivery Date</CardTitle>
                  <CardDescription>Choose when you want your order delivered</CardDescription>
                </CardHeader>
                <CardContent>
                  <CalendarOrderPicker
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    minDate={new Date()}
                  />
                  {selectedDate && (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Selected:{" "}
                      {selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Available Products</CardTitle>
                  <CardDescription>Add items to your order</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{product.title}</h4>
                          <p className="text-sm text-muted-foreground">{product.short_desc}</p>
                          <p className="mt-1 font-semibold">{formatPrice(Number(product.price_cents))}</p>
                        </div>
                        <Button type="button" onClick={() => addProduct(product)} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Order Notes</CardTitle>
                  <CardDescription>Any special instructions or requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Extra spicy, no onions, etc."
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orderItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No items added yet</p>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {orderItems.map((item) => (
                          <div key={item.productId} className="space-y-2 rounded-lg border p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium">{item.product.title}</h5>
                                <p className="text-sm text-muted-foreground">{formatPrice(item.unitPriceCents)}</p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(item.productId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantity(item.productId, -1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-12 text-center font-medium">{item.qty}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantity(item.productId, 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>{formatPrice(calculateTotal())}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <Button type="submit" className="w-full" disabled={loading || orderItems.length === 0}>
                    {loading ? "Creating Order..." : "Create Order"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
