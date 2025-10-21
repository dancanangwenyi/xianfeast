/**
 * Enhanced Customer Login Page with Comprehensive Validation
 * Provides real-time validation, error handling, and user-friendly feedback
 */

"use client"

import React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, LogIn, AlertTriangle, Eye, EyeOff } from "lucide-react"
import { useFormValidation, useFormSubmission } from "@/hooks/useFormValidation"
import { customerLoginValidator } from "@/lib/validation/form-validator"
import { ValidatedInput } from "@/components/ui/form-field-error"
import { ApiErrorHandler, customerApi } from "@/lib/error-handling/api-error-handler"
import { useToast } from "@/hooks/use-toast"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"

export default function CustomerLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [networkStatus] = useNetworkStatus()
  const [showPassword, setShowPassword] = useState(false)

  // Form validation setup
  const [formState, formActions] = useFormValidation(
    { email: '', password: '' },
    {
      validator: customerLoginValidator,
      validateOnChange: true,
      validateOnBlur: true,
      debounceMs: 300
    }
  )

  // Form submission handler
  const { handleSubmit, isSubmitting, submitError, clearSubmitError } = useFormSubmission(
    async (values) => {
      // Check network status
      if (!networkStatus.isOnline) {
        throw new Error('Internet connection required for login. Please check your connection and try again.')
      }

      try {
        const response = await customerApi('/api/auth/customer/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: values.email.trim().toLowerCase(),
            password: values.password
          })
        }, 'customer-login')

        const data = await response.json()

        if (!response.ok) {
          throw {
            status: response.status,
            message: data.error || 'Login failed',
            details: data.details
          }
        }

        // Success - redirect to customer dashboard
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
          variant: "default"
        })

        router.push('/customer/dashboard')
        return data
      } catch (error) {
        const apiError = ApiErrorHandler.parseApiError(error, 'customer-login')
        
        // Show user-friendly error message
        toast({
          title: "Login Failed",
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
      // Error is already handled by useFormSubmission and toast
      console.error('Login error:', error)
    }
  }

  // Handle input changes with validation
  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    formActions.setValue(field, e.target.value)
  }

  // Handle input blur for validation
  const handleInputBlur = (field: string) => () => {
    formActions.markFieldTouched(field)
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your XianFeast account to start ordering
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              {/* Network status warning */}
              {!networkStatus.isOnline && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You're currently offline. Please connect to the internet to sign in.
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit error */}
              {submitError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              {/* Email field */}
              <ValidatedInput
                id="email"
                type="email"
                label="Email Address"
                placeholder="Enter your email address"
                value={formState.values.email || ''}
                onChange={handleInputChange('email')}
                onBlur={handleInputBlur('email')}
                error={formState.errors.email}
                touched={formState.touched.email}
                isValidating={formState.isValidating}
                showSuccess={true}
                required
                disabled={isSubmitting || !networkStatus.isOnline}
                autoComplete="email"
              />

              {/* Password field */}
              <div className="space-y-2">
                <div className="relative">
                  <ValidatedInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    label="Password"
                    placeholder="Enter your password"
                    value={formState.values.password || ''}
                    onChange={handleInputChange('password')}
                    onBlur={handleInputBlur('password')}
                    error={formState.errors.password}
                    touched={formState.touched.password}
                    isValidating={formState.isValidating}
                    showSuccess={true}
                    required
                    disabled={isSubmitting || !networkStatus.isOnline}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-8 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Forgot password link */}
              <div className="text-right">
                <Link 
                  href="/customer/forgot-password" 
                  className="text-sm text-primary hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Submit button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={!formState.isValid || isSubmitting || !networkStatus.isOnline}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>

              {/* Signup link */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link href="/customer/signup" className="text-primary hover:underline">
                    Create one now
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  )
}