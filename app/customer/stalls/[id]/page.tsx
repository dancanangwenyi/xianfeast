"use client"

import React, { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CustomerLayout } from "@/components/customer/layout/customer-layout"
import { useCart } from "@/hooks/useCart"
import { 
  ArrowLeft,
  Clock, 
  MapPin, 
  Plus,
  Minus,
  ShoppingCart,
  Star,
  ChefHat
} from "lucide-react"

interface Product {
  id: string
  title: string
  short_desc: string
  long_desc: string
  price_cents: number
  currency: string
  tags_csv: string
  diet_flags_csv: string
  prep_time_minutes: number
  inventory_qty: number
  status: string
  images: ProductImage[]
}

interface ProductImage {
  id: string
  url_cached: string
  order_index: number
}

interface StallDetail {
  id: string
  name: string
  description: string
  pickup_address: string
  open_hours_json: string
  capacity_per_day: number
  cuisine_type?: string
  business_name: string
  products: Product[]
}



function StallDetailContent() {
  const router = useRouter()
  const params = useParams()
  const stallId = params.id as string

  const [stall, setStall] = useState<StallDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { items: cartItems, addItem, updateQuantity, getItemQuantity, getTotalItems, getTotalValue, loading: cartLoading } = useCart()

  useEffect(() => {
    if (stallId) {
      loadStallDetail()
    }
  }, [stallId])

  const loadStallDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customer/stalls/${stallId}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/customer/login")
          return
        }
        if (response.status === 404) {
          setError("Stall not found")
          return
        }
        throw new Error("Failed to load stall details")
      }
      
      const data = await response.json()
      setStall(data)
    } catch (error) {
      console.error("Stall detail error:", error)
      setError("Failed to load stall details. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const parseOpenHours = (openHoursJson: string) => {
    try {
      return JSON.parse(openHoursJson)
    } catch {
      return {}
    }
  }

  const addToCart = async (product: Product) => {
    await addItem({
      product_id: product.id,
      stall_id: stall!.id,
      product_title: product.title,
      product_price_cents: product.price_cents,
      stall_name: stall!.name
    })
  }

  const removeFromCart = async (productId: string) => {
    const currentQuantity = getItemQuantity(productId)
    if (currentQuantity > 0) {
      await updateQuantity(productId, currentQuantity - 1, stall!.id)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-24 w-24 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <div className="space-x-4">
          <Button onClick={() => router.back()}>Go Back</Button>
          <Button onClick={loadStallDetail} variant="outline">Try Again</Button>
        </div>
      </div>
    )
  }

  if (!stall) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-600">Stall not found</div>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    )
  }

  const openHours = parseOpenHours(stall.open_hours_json)

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Stalls
          </Button>
        </div>

        {/* Stall Info */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{stall.name}</h1>
                {stall.cuisine_type && (
                  <Badge variant="secondary" className="text-sm">
                    {stall.cuisine_type}
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 mb-2">{stall.business_name}</p>
              {stall.description && (
                <p className="text-gray-700 mb-4">{stall.description}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {stall.pickup_address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{stall.pickup_address}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <ChefHat className="h-4 w-4" />
                  <span>{stall.products.length} items available</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Capacity: {stall.capacity_per_day} orders/day</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Menu</h2>
              {stall.products.length > 0 ? (
                <div className="space-y-4">
                  {stall.products.map((product) => (
                    <Card key={product.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            {product.images.length > 0 ? (
                              <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-gray-100">
                                <Image
                                  src={product.images[0].url_cached || "/placeholder.jpg"}
                                  alt={product.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-24 w-24 rounded-lg bg-gray-100 flex items-center justify-center">
                                <ChefHat className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  {product.title}
                                </h3>
                                {product.short_desc && (
                                  <p className="text-gray-600 text-sm mb-2">
                                    {product.short_desc}
                                  </p>
                                )}
                                
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {product.tags_csv && product.tags_csv.split(',').map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag.trim()}
                                    </Badge>
                                  ))}
                                  {product.diet_flags_csv && product.diet_flags_csv.split(',').map((flag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {flag.trim()}
                                    </Badge>
                                  ))}
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{product.prep_time_minutes} min</span>
                                  </div>
                                  {product.inventory_qty > 0 && (
                                    <span className="text-green-600">
                                      {product.inventory_qty} available
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Price and Cart Controls */}
                              <div className="flex flex-col items-end gap-3">
                                <div className="text-xl font-bold text-gray-900">
                                  {formatCurrency(product.price_cents)}
                                </div>
                                
                                {product.status === 'active' && product.inventory_qty > 0 ? (
                                  <div className="flex items-center gap-2">
                                    {getItemQuantity(product.id) > 0 ? (
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => removeFromCart(product.id)}
                                          disabled={cartLoading}
                                          className="h-8 w-8 p-0"
                                        >
                                          <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-8 text-center font-medium">
                                          {getItemQuantity(product.id)}
                                        </span>
                                        <Button
                                          size="sm"
                                          onClick={() => addToCart(product)}
                                          disabled={cartLoading}
                                          className="h-8 w-8 p-0"
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        size="sm"
                                        onClick={() => addToCart(product)}
                                        disabled={cartLoading}
                                        className="flex items-center gap-2"
                                      >
                                        <Plus className="h-4 w-4" />
                                        Add to Cart
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <Badge variant="secondary">
                                    {product.inventory_qty <= 0 ? "Out of Stock" : "Unavailable"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items</h3>
                  <p className="text-gray-600">This stall hasn't added any products yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Your Order
                </CardTitle>
                <CardDescription>
                  {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} in cart
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cartItems.length > 0 ? (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.product_id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product_title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.product_price_cents)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.product_id)}
                            disabled={cartLoading}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const product = stall?.products.find(p => p.id === item.product_id)
                              if (product) addToCart(product)
                            }}
                            disabled={cartLoading}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between font-semibold">
                        <span>Total</span>
                        <span>{formatCurrency(getTotalValue())}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={() => router.push('/customer/cart')}
                    >
                      Proceed to Checkout
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <ShoppingCart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Your cart is empty</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stall Hours */}
            {Object.keys(openHours).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {Object.entries(openHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="capitalize">{day}</span>
                        <span className="text-gray-600">{hours as string}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
  )
}

export default function StallDetailPage() {
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
      <StallDetailContent />
    </CustomerLayout>
  )
}