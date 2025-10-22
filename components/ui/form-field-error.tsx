/**
 * Form Field Error Component
 * Displays validation errors with helpful styling and animations
 */

'use client'

import React from 'react'
import { AlertCircle, Info, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FormFieldErrorProps {
  error?: string
  touched?: boolean
  isValidating?: boolean
  showSuccess?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function FormFieldError({
  error,
  touched,
  isValidating,
  showSuccess,
  className,
  size = 'sm'
}: FormFieldErrorProps) {
  // Don't show anything if field hasn't been touched
  if (!touched && !error) return null

  // Show validation spinner
  if (isValidating) {
    return (
      <div className={cn(
        'flex items-center gap-2 text-muted-foreground animate-pulse',
        {
          'text-xs': size === 'sm',
          'text-sm': size === 'md',
          'text-base': size === 'lg'
        },
        className
      )}>
        <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span>Validating...</span>
      </div>
    )
  }

  // Show error
  if (error) {
    return (
      <div className={cn(
        'flex items-start gap-2 text-destructive animate-in slide-in-from-top-1 duration-200',
        {
          'text-xs': size === 'sm',
          'text-sm': size === 'md',
          'text-base': size === 'lg'
        },
        className
      )}>
        <AlertCircle className={cn(
          'flex-shrink-0 mt-0.5',
          {
            'h-3 w-3': size === 'sm',
            'h-4 w-4': size === 'md',
            'h-5 w-5': size === 'lg'
          }
        )} />
        <span className="leading-tight">{error}</span>
      </div>
    )
  }

  // Show success if enabled
  if (showSuccess && touched) {
    return (
      <div className={cn(
        'flex items-center gap-2 text-green-600 animate-in slide-in-from-top-1 duration-200',
        {
          'text-xs': size === 'sm',
          'text-sm': size === 'md',
          'text-base': size === 'lg'
        },
        className
      )}>
        <CheckCircle className={cn(
          'flex-shrink-0',
          {
            'h-3 w-3': size === 'sm',
            'h-4 w-4': size === 'md',
            'h-5 w-5': size === 'lg'
          }
        )} />
        <span>Looks good!</span>
      </div>
    )
  }

  return null
}

/**
 * Form Field Help Text Component
 */
export interface FormFieldHelpProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function FormFieldHelp({
  children,
  className,
  size = 'sm'
}: FormFieldHelpProps) {
  return (
    <div className={cn(
      'flex items-start gap-2 text-muted-foreground',
      {
        'text-xs': size === 'sm',
        'text-sm': size === 'md',
        'text-base': size === 'lg'
      },
      className
    )}>
      <Info className={cn(
        'flex-shrink-0 mt-0.5',
        {
          'h-3 w-3': size === 'sm',
          'h-4 w-4': size === 'md',
          'h-5 w-5': size === 'lg'
        }
      )} />
      <span className="leading-tight">{children}</span>
    </div>
  )
}

/**
 * Enhanced Input Component with Validation
 */
export interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  touched?: boolean
  isValidating?: boolean
  showSuccess?: boolean
  helpText?: string
  label?: string
  required?: boolean
}

export function ValidatedInput({
  error,
  touched,
  isValidating,
  showSuccess,
  helpText,
  label,
  required,
  className,
  ...props
}: ValidatedInputProps) {
  const hasError = error && touched
  const hasSuccess = showSuccess && touched && !error

  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={props.id}
          className={cn(
            'block text-sm font-medium',
            hasError ? 'text-destructive' : 'text-foreground'
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          {...props}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            hasError && 'border-destructive focus-visible:ring-destructive',
            hasSuccess && 'border-green-500 focus-visible:ring-green-500',
            isValidating && 'border-blue-500',
            className
          )}
        />
        
        {/* Validation status indicator */}
        {(hasError || hasSuccess || isValidating) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValidating && (
              <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
            {hasError && (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            {hasSuccess && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
          </div>
        )}
      </div>

      {/* Help text */}
      {helpText && !hasError && (
        <FormFieldHelp>{helpText}</FormFieldHelp>
      )}

      {/* Error message */}
      <FormFieldError
        error={error}
        touched={touched}
        isValidating={isValidating}
        showSuccess={showSuccess}
      />
    </div>
  )
}