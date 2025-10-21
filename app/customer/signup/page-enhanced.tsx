/**
 * Enhanced Customer Signup Page with Comprehensive Validation
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
import { Loader2, Mail, User, CheckCircle, AlertTriangle } from "lucide-react"
import { useFormValidation, useFormSubmission } from "@/hooks/useFormValidation"
import { customerSignupValidator } from "@/lib/validation/form-validator"
import { ValidatedInput } from "@/components/ui/form-field-error"
import { ApiErrorHandler, customerApi } from "@/lib/error-handling/api-error-handler"
import { useToast } from "@/hooks/use-toast"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"

export default function CustomerSignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [networkStatus] = useNetworkStatus()
  const [success, setSuccess] = useState(false)

  // Form validation setup
  const [formState, formActions] = useFormValidation(
    { name: '', email: '' },
    {
      validator: customerSignupValidator,
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
        throw new Error('Internet connection required for signup. Please check your connection and try again.')
      }

      try {
        const response = await customerApi('/api/auth/customer/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: values.name.trim(),
            email: values.email.trim().toLowerCase()
          })
        }, 'customer-signup')

        const data = await response.json()

        if (!response.ok) {
          throw {
            status: response.status,
            message: data.error || 'Signup failed',
            details: data.details
          }
        }

        // Success
        setSuccess(true)
        toast({
          title: "Account Created!",
          description: "Please check your email for a magic link to complete setup.",
          variant: "default"
        })

        return data
      } catch (error) {
        const apiError = ApiErrorHandler.parseApiError(error, 'customer-signup')
        
        // Show user-friendly error message
        toast({
          title: "Signup Failed",
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
      console.error('Signup error:', error)
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

  // Success state
  if (success) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription>
                We've sent a magic link to <strong>{formState.values.email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Click the link in your email to complete your account setup and create a password.
                  The link will expire in 24 hours.
                </AlertDescription>
              </Alert>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email? Check your spam folder or{" "}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto"
                    onClick={() => setSuccess(false)}
                  >
                    try again
                  </Button>
                </p>
                
                <Link href="/customer/login">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    )
  }

  // Signup form
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription>
              Join XianFeast to start ordering delicious meals from local stalls
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              {/* Network status warning */}
              {!networkStatus.isOnline && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You're currently offline. Please connect to the internet to create an account.
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

              {/* Name field */}
              <ValidatedInput
                id="name"
                type="text"
                label="Full Name"
                placeholder="Enter your full name"
                value={formState.values.name || ''}
                onChange={handleInputChange('name')}
                onBlur={handleInputBlur('name')}
                error={formState.errors.name}
                touched={formState.touched.name}
                isValidating={formState.isValidating}
                showSuccess={true}
                required
                disabled={isSubmitting || !networkStatus.isOnline}
                helpText="This will be used to personalize your experience"
                autoComplete="name"
              />

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
                helpText="We'll send you a magic link to complete your signup"
                autoComplete="email"
              />

              {/* Submit button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={!formState.isValid || isSubmitting || !networkStatus.isOnline}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>

              {/* Login link */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/customer/login" className="text-primary hover:underline">
                    Sign in
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