"use client"

import { useState, useEffect } from "react"

// Disable static generation for this page
export const dynamic = 'force-dynamic'
import { useRouter } from "next/navigation"
import { CustomerLayout } from "@/components/customer/layout/customer-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCart } from "@/hooks/useCart"
import { 
  ShoppingCart, 
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Loader2,
  ChefHat
} from "lucide-react"
import Link from "next/link"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface DeliveryOption {
  id: string
  name: string
  description: string
  price_cents: number
  estimated_time: string
}

interface OrderSchedule {
  date: string
  time: string
  notes?: string
}

function CheckoutContent() {
  const router = useRouter()
  const { 
    items, 
    loading: cartLoading, 
    error: cartError, 
    getTotalItems, 
    getTotalValue,
    clearCart
  } = useCart()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Form state
  const [deliveryOption, setDeliveryOption] = useState<string>("pickup")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [deliveryInstructions, setDeliveryInstructions] = useState("")
  const [orderSchedule, setOrderSchedule] = useState<OrderSchedule>({
    date: "",
    time: "",
    notes: ""
  })
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const deliveryOptions: DeliveryOption[] = [
    {
      id: "pickup",
      name: "Pickup",
      description: "Pick up your order at the stall",
      price_cents: 0,
      estimated_time: "15-30 minutes"
    },
    {
      id: "delivery",
      name: "Delivery",
      description: "We'll deliver to your location",
      price_cents: 299, // $2.99
      estimated_time: "30-45 minutes"
    }
  ]

  useEffect(() => {
    // Redirect if cart is empty
    if (!cartLoading && items.length === 0) {
      router.push('/customer/cart')
    }
  }, [items, cartLoading, router])

  useEffect(() => {
    // Set default schedule to 1 hour from now
    const now = new Date()
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
    
    setOrderSchedule({
      date: oneHourLater.toISOString().split('T')[0],
      time: oneHourLater.toTimeString().slice(0, 5),
      notes: ""
    })
  }, [])

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Validate delivery address if delivery is selected
    if (deliveryOption === "delivery" && !deliveryAddress.trim()) {
      errors.deliveryAddress = "Delivery address is required"
    }

    // Validate schedule
    if (!orderSchedule.date) {
      errors.scheduleDate = "Order date is required"
    }

    if (!orderSchedule.time) {
      errors.scheduleTime = "Order time is required"
    }

    // Validate schedule is in the future
    if (orderSchedule.date && orderSchedule.time) {
      const scheduledDateTime = new Date(`${orderSchedule.date}T${orderSchedule.time}`)
      const now = new Date()
      
      if (scheduledDateTime <= now) {
        errors.scheduleDateTime = "Order must be scheduled for a future time"
      }

      // Check if it's too far in advance (30 days)
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      if (scheduledDateTime > thirtyDaysFromNow) {
        errors.scheduleDateTime = "Orders can only be scheduled up to 30 days in advance"
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const calculateTotal = () => {
    const subtotal = getTotalValue()
    const deliveryFee = deliveryOption === "delivery" ? 299 : 0
    const tax = Math.round((subtotal + deliveryFee) * 0.08) // 8% tax
    return {
      subtotal,
      deliveryFee,
      tax,
      total: subtotal + deliveryFee + tax
    }
  }

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const orderData = {
        items: items.map(item => ({
          product_id: item.product_id,
          stall_id: item.stall_id,
          quantity: item.quantity,
          unit_price_cents: item.product_price_cents,
          special_instructions: item.special_instructions
        })),
        scheduled_for: `${orderSchedule.date}T${orderSchedule.time}:00`,
        delivery_option: deliveryOption,
        delivery_address: deliveryOption === "delivery" ? deliveryAddress : undefined,
        delivery_instructions: deliveryInstructions || undefined,
        payment_method: paymentMethod,
        order_notes: orderSchedule.notes || undefined,
        ...calculateTotal()
      }

      const response = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to place order')
      }

      const result = await response.json()
      
      // Clear cart and show success
      await clearCart()
      setSuccess(true)
      
      // Redirect to order confirmation after a short delay
      setTimeout(() => {
        router.push(`/customer/orders/${result.order.id}`)
      }, 2000)

    } catch (error) {
      console.error("Place order error:", error)
      setError(error instanceof Error ? error.message : 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  // Group items by stall for better organization
  const itemsByStall = items.reduce((acc, item) => {
    if (!acc[item.stall_id]) {
      acc[item.stall_id] = {
        stall_name: item.stall_name,
        items: []
      }
    }
    acc[item.stall_id].items.push(item)
    return acc
  }, {} as Record<string, { stall_name: string; items: typeof items }>)

  const totals = calculateTotal()

  if (!mounted || cartLoading) {
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

  if (success) {
    return (
      <CustomerLayout>
        <div className="p-6">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="py-12">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h1>
                <p className="text-gray-600 mb-6">
                  Your order has been confirmed and sent to the stall. You'll receive email updates as your order progresses.
                </p>
                <div className="animate-pulse text-sm text-gray-500">
                  Redirecting to order details...
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/customer/cart">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cart
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          </div>

          {/* Error Alert */}
          {(error || cartError) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error || cartError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Review */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Order Review
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(itemsByStall).map(([stallId, stallData]) => (
                    <div key={stallId} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ChefHat className="h-4 w-4" />
                        <h4 className="font-semibold">{stallData.stall_name}</h4>
                      </div>
                      {stallData.items.map((item, index) => (
                        <div key={`${item.product_id}-${index}`} className="flex justify-between items-center pl-6">
                          <div>
                            <span className="font-medium">{item.quantity}x {item.product_title}</span>
                            {item.special_instructions && (
                              <p className="text-sm text-gray-600">Note: {item.special_instructions}</p>
                            )}
                          </div>
                          <span className="font-semibold">
                            {formatCurrency(item.product_price_cents * item.quantity)}
                          </span>
                        </div>
                      ))}
                      {Object.keys(itemsByStall).length > 1 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Delivery Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={deliveryOption} onValueChange={setDeliveryOption}>
                    {deliveryOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2 p-4 border rounded-lg">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <div className="flex-1">
                          <Label htmlFor={option.id} className="font-medium cursor-pointer">
                            {option.name} {option.price_cents > 0 && `(${formatCurrency(option.price_cents)})`}
                          </Label>
                          <p className="text-sm text-gray-600">{option.description}</p>
                          <p className="text-sm text-gray-500">Est. {option.estimated_time}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>

                  {deliveryOption === "delivery" && (
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="delivery-address">Delivery Address *</Label>
                        <Input
                          id="delivery-address"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Enter your delivery address"
                          className={validationErrors.deliveryAddress ? "border-red-500" : ""}
                        />
                        {validationErrors.deliveryAddress && (
                          <p className="text-sm text-red-600 mt-1">{validationErrors.deliveryAddress}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="delivery-instructions">Delivery Instructions</Label>
                        <Textarea
                          id="delivery-instructions"
                          value={deliveryInstructions}
                          onChange={(e) => setDeliveryInstructions(e.target.value)}
                          placeholder="Any special delivery instructions..."
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Scheduling */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Order Scheduling
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="order-date">Date *</Label>
                      <Input
                        id="order-date"
                        type="date"
                        value={orderSchedule.date}
                        onChange={(e) => setOrderSchedule(prev => ({ ...prev, date: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className={validationErrors.scheduleDate ? "border-red-500" : ""}
                      />
                      {validationErrors.scheduleDate && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.scheduleDate}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="order-time">Time *</Label>
                      <Input
                        id="order-time"
                        type="time"
                        value={orderSchedule.time}
                        onChange={(e) => setOrderSchedule(prev => ({ ...prev, time: e.target.value }))}
                        className={validationErrors.scheduleTime ? "border-red-500" : ""}
                      />
                      {validationErrors.scheduleTime && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.scheduleTime}</p>
                      )}
                    </div>
                  </div>
                  
                  {validationErrors.scheduleDateTime && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{validationErrors.scheduleDateTime}</AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label htmlFor="order-notes">Order Notes</Label>
                    <Textarea
                      id="order-notes"
                      value={orderSchedule.notes}
                      onChange={(e) => setOrderSchedule(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any special requests or notes for your order..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="font-medium cursor-pointer">
                        Cash on {deliveryOption === "delivery" ? "Delivery" : "Pickup"}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg opacity-50">
                      <RadioGroupItem value="card" id="card" disabled />
                      <Label htmlFor="card" className="font-medium">
                        Credit/Debit Card (Coming Soon)
                      </Label>
                    </div>
                  </RadioGroup>
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
                      <span>Subtotal ({getTotalItems()} items)</span>
                      <span>{formatCurrency(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Delivery Fee</span>
                      <span>{formatCurrency(totals.deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>{formatCurrency(totals.tax)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{formatCurrency(totals.total)}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={loading || items.length === 0}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        Place Order
                        <CheckCircle className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-gray-600 text-center">
                    By placing this order, you agree to our terms of service
                  </div>
                </CardContent>
              </Card>

              {/* Estimated Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Estimated Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <p>
                    Your order will be ready for {deliveryOption} in approximately{" "}
                    {deliveryOptions.find(opt => opt.id === deliveryOption)?.estimated_time}.
                  </p>
                  <p className="mt-2">
                    You'll receive email updates as your order progresses.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}

export default function CustomerCheckoutPage() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
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

  return <CheckoutContent />
}