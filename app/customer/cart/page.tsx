"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { CustomerLayout } from "@/components/customer/layout/customer-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCart } from "@/hooks/useCart"
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Calendar,
  Clock,
  AlertTriangle,
  ChefHat,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

interface CartItemWithDetails {
  product_id: string
  stall_id: string
  quantity: number
  product_title: string
  product_price_cents: number
  stall_name: string
  scheduled_for?: string
  special_instructions?: string
}

export default function CustomerCartPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <CustomerLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <CustomerCartPageContent />
    </CustomerLayout>
  )
}

function CustomerCartPageContent() {
  const router = useRouter()
  const {
    items,
    loading,
    error,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalItems,
    getTotalValue,
    validation,
    syncWithServer
  } = useCart()

  const [schedulingItems, setSchedulingItems] = useState<Record<string, string>>({})
  const [instructionsItems, setInstructionsItems] = useState<Record<string, string>>({})

  useEffect(() => {
    // Initialize scheduling and instructions from cart items
    const scheduling: Record<string, string> = {}
    const instructions: Record<string, string> = {}

    items.forEach(item => {
      const key = `${item.product_id}-${item.stall_id}`
      if (item.scheduled_for) {
        scheduling[key] = item.scheduled_for
      }
      if (item.special_instructions) {
        instructions[key] = item.special_instructions
      }
    })

    setSchedulingItems(scheduling)
    setInstructionsItems(instructions)
  }, [items])

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return ''
    try {
      const date = new Date(dateTimeString)
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    } catch {
      return dateTimeString
    }
  }

  const handleQuantityChange = async (item: CartItemWithDetails, newQuantity: number) => {
    await updateQuantity(item.product_id, newQuantity, item.stall_id, item.scheduled_for)
  }

  const handleRemoveItem = async (item: CartItemWithDetails) => {
    await removeItem(item.product_id, item.stall_id, item.scheduled_for)
  }

  const handleSchedulingChange = (item: CartItemWithDetails, scheduledFor: string) => {
    const key = `${item.product_id}-${item.stall_id}`
    setSchedulingItems(prev => ({
      ...prev,
      [key]: scheduledFor
    }))
  }

  const handleInstructionsChange = (item: CartItemWithDetails, instructions: string) => {
    const key = `${item.product_id}-${item.stall_id}`
    setInstructionsItems(prev => ({
      ...prev,
      [key]: instructions
    }))
  }

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear your entire cart?')) {
      await clearCart()
    }
  }

  const handleProceedToCheckout = () => {
    // TODO: Implement checkout flow
    router.push('/customer/checkout')
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
  }, {} as Record<string, { stall_name: string; items: CartItemWithDetails[] }>)

  if (loading && items.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 animate-in fade-in duration-500">My Cart</h1>
        {items.length > 0 && (
          <Button
            variant="outline"
            onClick={handleClearCart}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cart
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant={error.includes('temporarily unavailable') ? 'default' : 'destructive'} className="animate-in slide-in-from-top-2 duration-300">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Validation Warnings */}
      {validation && !validation.valid && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some items in your cart may no longer be available. Please review your order.
            {validation.invalidItems.length > 0 && (
              <div className="mt-2">
                <strong>Invalid items:</strong> {validation.invalidItems.join(', ')}
              </div>
            )}
            {validation.unavailableItems.length > 0 && (
              <div className="mt-2">
                <strong>Unavailable items:</strong> {validation.unavailableItems.join(', ')}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {items.length === 0 ? (
        /* Empty cart state */
        <Card className="dark:bg-gray-800 dark:border-gray-700 animate-in fade-in duration-500">
          <CardContent className="text-center py-8 sm:py-12">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center animate-in zoom-in duration-700 delay-200">
              <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 animate-in slide-in-from-bottom-2 duration-500 delay-300">Your cart is empty</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 animate-in slide-in-from-bottom-2 duration-500 delay-400">
              Add some delicious items from our stalls to get started!
            </p>
            <Link href="/customer/stalls">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 animate-in slide-in-from-bottom-2 duration-500 delay-500">
                <Plus className="h-4 w-4 mr-2" />
                Browse Stalls
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {Object.entries(itemsByStall).map(([stallId, stallData], index) => (
              <Card key={stallId} className={`dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-4 delay-${(index + 1) * 100}`}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <ChefHat className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    {stallData.stall_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stallData.items.map((item, index) => {
                    const itemKey = `${item.product_id}-${item.stall_id}`
                    return (
                      <div key={`${item.product_id}-${index}`} className="space-y-4">
                        <div className="flex gap-4">
                          {/* Product Image Placeholder */}
                          <div className="flex-shrink-0">
                            <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center">
                              <ChefHat className="h-8 w-8 text-gray-400" />
                            </div>
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                  {item.product_title}
                                </h4>
                                <p className="text-gray-600 text-sm mb-2">
                                  {formatCurrency(item.product_price_cents)} each
                                </p>

                                {item.scheduled_for && (
                                  <Badge variant="outline" className="text-xs">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatDateTime(item.scheduled_for)}
                                  </Badge>
                                )}
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                  disabled={loading}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-12 text-center font-medium">
                                  {item.quantity}
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                  disabled={loading}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveItem(item)}
                                  disabled={loading}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Subtotal */}
                            <div className="text-right mt-2">
                              <span className="text-lg font-semibold">
                                {formatCurrency(item.product_price_cents * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Scheduling and Instructions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-24">
                          <div>
                            <Label htmlFor={`schedule-${itemKey}`} className="text-sm font-medium">
                              Schedule for
                            </Label>
                            <Input
                              id={`schedule-${itemKey}`}
                              type="datetime-local"
                              value={schedulingItems[itemKey] || ''}
                              onChange={(e) => handleSchedulingChange(item, e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`instructions-${itemKey}`} className="text-sm font-medium">
                              Special Instructions
                            </Label>
                            <Textarea
                              id={`instructions-${itemKey}`}
                              value={instructionsItems[itemKey] || ''}
                              onChange={(e) => handleInstructionsChange(item, e.target.value)}
                              placeholder="Any special requests..."
                              className="mt-1"
                              rows={2}
                            />
                          </div>
                        </div>

                        {index < stallData.items.length - 1 && <Separator />}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ))}

            {/* Continue Shopping */}
            <div className="text-center">
              <Link href="/customer/stalls">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add More Items
                </Button>
              </Link>
            </div>
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
                    <span>Items ({getTotalItems()})</span>
                    <span>{formatCurrency(getTotalValue())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(getTotalValue())}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleProceedToCheckout}
                  disabled={loading || items.length === 0}
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                <div className="text-xs text-gray-600 text-center">
                  Review your order details before placing
                </div>
              </CardContent>
            </Card>

            {/* Delivery Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Delivery Info
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <p>Orders are typically ready within 30-45 minutes of confirmation.</p>
                <p className="mt-2">You'll receive updates as your order progresses.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}