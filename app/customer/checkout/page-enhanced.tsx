/**
 * Enhanced Customer Checkout Page with Comprehensive Error Handling
 * Provides real-time validation, offline support, and user-friendly error messages
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  MapPin, 
  Clock, 
  CreditCard, 
  Loader2,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff
} from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useFormValidation, useFormSubmission } from '@/hooks/useFormValidation'
import { orderCheckoutValidator } from '@/lib/validation/form-validator'
import { ValidatedInput } from '@/components/ui/form-field-error'
import { ApiErrorHandler, customerApi } from '@/lib/error-handling/api-error-handler'
import { useToast } from '@/hooks/use-toast'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { useNetworkStatus, useOfflineApi } from '@/hooks/useNetworkStatus'
import { NetworkStatusIndicator, OfflineBanner } from '@/components/ui/network-status'

interface DeliveryOption {
  id: string
  name: string
  description: string
  price_cents: number
  estimated_time: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [networkStatus] = useNetworkStatus()
  const { apiCall } = useOfflineApi()
  
  // Cart state
  const {
    items, 
    loading: cartLoading, 
    error: cartError, 
    getTotalItems, 
    getTotalValue,
    clearCart
  } = useCart()

  // Form state
  const [deliveryOption, setDeliveryOption] = useState<string>("pickup")
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [success, setSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string>("")

  // Enhanced form validation
  const [formState, formActions] = useFormValidation(
    {
      deliveryAddress: '',
      scheduleDate: '',
      scheduleTime: '',
      specialInstructions: ''
    },
    {
      validator: orderCheckoutValidator,
      validateOnChange: true,
      validateOnBlur: true,
      debounceMs: 300
    }
  )

  // Update validation rules based on delivery option
  useEffect(() => {
    if (deliveryOption === 'delivery') {
      orderCheckoutValidator.addRule('deliveryAddress', { 
        required: true, 
        minLength: 10, 
        maxLength: 200 
      })
    } else {
      orderCheckoutValidator.addRule('deliveryAddress', { 
        required: false, 
        minLength: 10, 
        maxLength: 200 
      })
    }
  }, [deliveryOption])

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
      price_cents: 299,
      estimated_time: "30-45 minutes"
    }
  ]

  // Form submission handler
  const { handleSubmit, isSubmitting, submitError, clearSubmitError } = useFormSubmission(
    async (values) => {
      if (items.length === 0) {
        throw new Error('Your cart is empty. Please add items before checkout.')
      }

      // Prepare order data
      const orderData = {
        items: items.map(item => ({
          product_id: item.product_id,
          stall_id: item.stall_id,
          quantity: item.quantity,
          unit_price_cents: item.product_price_cents,
          special_instructions: item.special_instructions
        })),
        scheduled_for: `${values.scheduleDate}T${values.scheduleTime}:00.000Z`,
        delivery_option: deliveryOption,
        delivery_address: deliveryOption === 'delivery' ? values.deliveryAddress : undefined,
        special_instructions: values.specialInstructions,
        payment_method: paymentMethod
      }

      try {
        const response = await apiCall('/api/customer/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderData)
        })

        const data = await response.json()

        if (!response.ok) {
          throw {
            status: response.status,
            message: data.error || 'Order placement failed',
            details: data.details
          }
        }

        // Success
        setOrderNumber(data.data.order.id)
        setSuccess(true)
        
        // Clear cart
        await clearCart()

        toast({
          title: "Order Placed Successfully!",
          description: `Your order #${data.data.order.id} has been confirmed.`,
          variant: "default"
        })

        return data
      } catch (error) {
        const apiError = ApiErrorHandler.parseApiError(error, 'checkout')
        
        toast({
          title: "Order Failed",
          description: apiError.message,
          variant: "destructive"
        })

        throw new Error(apiError.message)
      }
    },
    formActions
  )

  // Handle form submission
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearSubmitError()
    
    try {
      await handleSubmit(formState.values)
    } catch (error) {
      console.error('Checkout error:', error)
    }
  }

  // Handle input changes
  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    formActions.setValue(field, e.target.value)
  }

  const handleInputBlur = (field: string) => () => {
    formActions.markFieldTouched(field)
  }

  // Calculate totals
  const subtotal = getTotalValue()
  const deliveryFee = deliveryOption === 'delivery' ? 299 : 0
  const total = subtotal + deliveryFee

  // Loading state
  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your cart...</p>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your order <strong>#{orderNumber}</strong> has been placed successfully.
                  You'll receive updates via email.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Button onClick={() => router.push('/customer/orders')} className="w-full">
                  View Order Status
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/customer/stalls')} 
                  className="w-full"
                >
                  Continue Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    )
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <CardTitle>Your Cart is Empty</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/customer/stalls')} className="w-full">
                Browse Stalls
              </Button>
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <OfflineBanner />
        
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Checkout</h1>
            <NetworkStatusIndicator />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Form */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={onSubmit} className="space-y-6">
                {/* Network status warning */}
                {!networkStatus.isOnline && (
                  <Alert>
                    <WifiOff className="h-4 w-4" />
                    <AlertDescription>
                      You're offline. Your order will be saved and submitted when connection is restored.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Cart error */}
                {cartError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{cartError}</AlertDescription>
                  </Alert>
                )}

                {/* Submit error */}
                {submitError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                {/* Delivery Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Delivery Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={deliveryOption} onValueChange={setDeliveryOption}>
                      {deliveryOptions.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{option.name}</p>
                                <p className="text-sm text-muted-foreground">{option.description}</p>
                                <p className="text-sm text-muted-foreground">{option.estimated_time}</p>
                              </div>
                              <div className="text-right">
                                {option.price_cents > 0 ? (
                                  <Badge variant="secondary">
                                    ${(option.price_cents / 100).toFixed(2)}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Free</Badge>
                                )}
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    {/* Delivery Address */}
                    {deliveryOption === 'delivery' && (
                      <div className="mt-4">
                        <ValidatedInput
                          id="deliveryAddress"
                          type="text"
                          label="Delivery Address"
                          placeholder="Enter your full delivery address"
                          value={formState.values.deliveryAddress || ''}
                          onChange={handleInputChange('deliveryAddress')}
                          onBlur={handleInputBlur('deliveryAddress')}
                          error={formState.errors.deliveryAddress}
                          touched={formState.touched.deliveryAddress}
                          isValidating={formState.isValidating}
                          showSuccess={true}
                          required
                          disabled={isSubmitting}
                          helpText="Include apartment/unit number, building name, and any delivery instructions"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Schedule */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      When do you want your order?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ValidatedInput
                        id="scheduleDate"
                        type="date"
                        label="Date"
                        value={formState.values.scheduleDate || ''}
                        onChange={handleInputChange('scheduleDate')}
                        onBlur={handleInputBlur('scheduleDate')}
                        error={formState.errors.scheduleDate}
                        touched={formState.touched.scheduleDate}
                        isValidating={formState.isValidating}
                        showSuccess={true}
                        required
                        disabled={isSubmitting}
                        min={new Date().toISOString().split('T')[0]}
                      />

                      <ValidatedInput
                        id="scheduleTime"
                        type="time"
                        label="Time"
                        value={formState.values.scheduleTime || ''}
                        onChange={handleInputChange('scheduleTime')}
                        onBlur={handleInputBlur('scheduleTime')}
                        error={formState.errors.scheduleTime}
                        touched={formState.touched.scheduleTime}
                        isValidating={formState.isValidating}
                        showSuccess={true}
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
                      <Textarea
                        id="specialInstructions"
                        placeholder="Any special requests or dietary requirements..."
                        value={formState.values.specialInstructions || ''}
                        onChange={handleInputChange('specialInstructions')}
                        onBlur={handleInputBlur('specialInstructions')}
                        disabled={isSubmitting}
                        className="mt-2"
                        maxLength={500}
                      />
                      {formState.errors.specialInstructions && (
                        <p className="text-sm text-destructive mt-1">
                          {formState.errors.specialInstructions}
                        </p>
                      )}
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
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash">Cash on {deliveryOption === 'delivery' ? 'Delivery' : 'Pickup'}</Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full"
                  disabled={!formState.isValid || isSubmitting || items.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {networkStatus.isOnline ? 'Placing Order...' : 'Saving Order...'}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Place Order • ${(total / 100).toFixed(2)}
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{item.product_title}</p>
                          <p className="text-sm text-muted-foreground">{item.stall_name}</p>
                          <p className="text-sm">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">
                          ${((item.product_price_cents * item.quantity) / 100).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal ({getTotalItems()} items)</span>
                      <span>${(subtotal / 100).toFixed(2)}</span>
                    </div>
                    
                    {deliveryFee > 0 && (
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span>${(deliveryFee / 100).toFixed(2)}</span>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${(total / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}