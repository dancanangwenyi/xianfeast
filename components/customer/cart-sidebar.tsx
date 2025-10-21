"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { useCart } from "@/hooks/useCart"
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight,
  Calendar
} from "lucide-react"

interface CartSidebarProps {
  children: React.ReactNode
}

export function CartSidebar({ children }: CartSidebarProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { 
    items, 
    loading, 
    updateQuantity, 
    removeItem, 
    getTotalItems, 
    getTotalValue 
  } = useCart()

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

  const handleQuantityChange = async (item: any, newQuantity: number) => {
    await updateQuantity(item.product_id, newQuantity, item.stall_id, item.scheduled_for)
  }

  const handleRemoveItem = async (item: any) => {
    await removeItem(item.product_id, item.stall_id, item.scheduled_for)
  }

  const handleViewCart = () => {
    setIsOpen(false)
    router.push('/customer/cart')
  }

  const handleCheckout = () => {
    setIsOpen(false)
    router.push('/customer/checkout')
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div className="relative">
          {children}
          {getTotalItems() > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {getTotalItems()}
            </Badge>
          )}
        </div>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Cart
          </SheetTitle>
          <SheetDescription>
            {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} in your cart
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-600 mb-4">Add some items to get started!</p>
                <Button onClick={() => setIsOpen(false)}>
                  Continue Shopping
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 my-6 overflow-y-auto">
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={`${item.product_id}-${item.stall_id}-${index}`} className="space-y-3">
                      <div className="flex gap-3">
                        {/* Product Image Placeholder */}
                        <div className="flex-shrink-0 h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                          <ShoppingCart className="h-6 w-6 text-gray-400" />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {item.product_title}
                          </h4>
                          <p className="text-xs text-gray-600 mb-1">
                            {item.stall_name}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(item.product_price_cents)}
                          </p>
                          
                          {item.scheduled_for && (
                            <Badge variant="outline" className="text-xs mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDateTime(item.scheduled_for)}
                            </Badge>
                          )}
                        </div>

                        {/* Remove Button */}
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

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            disabled={loading}
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            disabled={loading}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <span className="text-sm font-semibold">
                          {formatCurrency(item.product_price_cents * item.quantity)}
                        </span>
                      </div>

                      {index < items.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart Summary and Actions */}
              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({getTotalItems()} items)</span>
                    <span>{formatCurrency(getTotalValue())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery</span>
                    <span>Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(getTotalValue())}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={handleCheckout}
                    disabled={loading}
                  >
                    Checkout
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleViewCart}
                  >
                    View Cart
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}