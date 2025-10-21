/**
 * React Hook for Real-time Form Validation
 * Provides comprehensive form validation with real-time feedback
 */

import { useState, useCallback, useEffect } from 'react'
import { FormValidator, ValidationResult, ValidationError } from '@/lib/validation/form-validator'

export interface UseFormValidationOptions {
  validator: FormValidator
  validateOnChange?: boolean
  validateOnBlur?: boolean
  debounceMs?: number
}

export interface FormValidationState {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  isValid: boolean
  isValidating: boolean
  hasErrors: boolean
}

export interface FormValidationActions {
  setValue: (field: string, value: any) => void
  setValues: (values: Record<string, any>) => void
  setError: (field: string, error: string) => void
  clearError: (field: string) => void
  clearAllErrors: () => void
  validateField: (field: string) => Promise<boolean>
  validateForm: () => Promise<boolean>
  reset: (initialValues?: Record<string, any>) => void
  markFieldTouched: (field: string) => void
  markAllFieldsTouched: () => void
}

export function useFormValidation(
  initialValues: Record<string, any> = {},
  options: UseFormValidationOptions
): [FormValidationState, FormValidationActions] {
  const {
    validator,
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300
  } = options

  // Form state
  const [values, setValuesState] = useState<Record<string, any>>(initialValues)
  const [errors, setErrorsState] = useState<Record<string, string>>({})
  const [touched, setTouchedState] = useState<Record<string, boolean>>({})
  const [isValidating, setIsValidating] = useState(false)

  // Debounce timer
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Computed state
  const isValid = Object.keys(errors).length === 0
  const hasErrors = Object.keys(errors).length > 0

  /**
   * Set single field value
   */
  const setValue = useCallback((field: string, value: any) => {
    // Sanitize input
    const sanitizedValue = typeof value === 'string' ? validator.sanitizeInput(value) : value

    setValuesState(prev => ({ ...prev, [field]: sanitizedValue }))

    // Validate on change if enabled
    if (validateOnChange && touched[field]) {
      // Clear existing debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      // Set new debounce timer
      const timer = setTimeout(() => {
        validateFieldInternal(field, sanitizedValue)
      }, debounceMs)

      setDebounceTimer(timer)
    }
  }, [validator, validateOnChange, touched, debounceTimer, debounceMs])

  /**
   * Set multiple field values
   */
  const setValues = useCallback((newValues: Record<string, any>) => {
    const sanitizedValues: Record<string, any> = {}
    
    for (const [field, value] of Object.entries(newValues)) {
      sanitizedValues[field] = typeof value === 'string' ? validator.sanitizeInput(value) : value
    }

    setValuesState(prev => ({ ...prev, ...sanitizedValues }))

    // Validate changed fields if enabled
    if (validateOnChange) {
      Object.keys(sanitizedValues).forEach(field => {
        if (touched[field]) {
          validateFieldInternal(field, sanitizedValues[field])
        }
      })
    }
  }, [validator, validateOnChange, touched])

  /**
   * Internal field validation
   */
  const validateFieldInternal = useCallback((field: string, value?: any) => {
    const fieldValue = value !== undefined ? value : values[field]
    const error = validator.validateField(field, fieldValue)
    
    setErrorsState(prev => {
      const newErrors = { ...prev }
      if (error) {
        newErrors[field] = error.message
      } else {
        delete newErrors[field]
      }
      return newErrors
    })

    return !error
  }, [validator, values])

  /**
   * Validate single field (public method)
   */
  const validateField = useCallback(async (field: string): Promise<boolean> => {
    setIsValidating(true)
    
    try {
      const isFieldValid = validateFieldInternal(field)
      return isFieldValid
    } finally {
      setIsValidating(false)
    }
  }, [validateFieldInternal])

  /**
   * Validate entire form
   */
  const validateForm = useCallback(async (): Promise<boolean> => {
    setIsValidating(true)
    
    try {
      const result = validator.validateForm(values)
      setErrorsState(result.fieldErrors)
      return result.isValid
    } finally {
      setIsValidating(false)
    }
  }, [validator, values])

  /**
   * Set field error manually
   */
  const setError = useCallback((field: string, error: string) => {
    setErrorsState(prev => ({ ...prev, [field]: error }))
  }, [])

  /**
   * Clear field error
   */
  const clearError = useCallback((field: string) => {
    setErrorsState(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    setErrorsState({})
  }, [])

  /**
   * Reset form
   */
  const reset = useCallback((newInitialValues?: Record<string, any>) => {
    const resetValues = newInitialValues || initialValues
    setValuesState(resetValues)
    setErrorsState({})
    setTouchedState({})
    
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      setDebounceTimer(null)
    }
  }, [initialValues, debounceTimer])

  /**
   * Mark field as touched
   */
  const markFieldTouched = useCallback((field: string) => {
    setTouchedState(prev => ({ ...prev, [field]: true }))
    
    // Validate on blur if enabled
    if (validateOnBlur) {
      validateFieldInternal(field)
    }
  }, [validateOnBlur, validateFieldInternal])

  /**
   * Mark all fields as touched
   */
  const markAllFieldsTouched = useCallback(() => {
    const allFields = Object.keys(values)
    const touchedFields = allFields.reduce((acc, field) => {
      acc[field] = true
      return acc
    }, {} as Record<string, boolean>)
    
    setTouchedState(touchedFields)
  }, [values])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  const state: FormValidationState = {
    values,
    errors,
    touched,
    isValid,
    isValidating,
    hasErrors
  }

  const actions: FormValidationActions = {
    setValue,
    setValues,
    setError,
    clearError,
    clearAllErrors,
    validateField,
    validateForm,
    reset,
    markFieldTouched,
    markAllFieldsTouched
  }

  return [state, actions]
}

/**
 * Hook for handling form submission with validation
 */
export function useFormSubmission<T = any>(
  onSubmit: (values: Record<string, any>) => Promise<T>,
  validationActions: FormValidationActions
) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = useCallback(async (values: Record<string, any>) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Mark all fields as touched to show validation errors
      validationActions.markAllFieldsTouched()
      
      // Validate form before submission
      const isValid = await validationActions.validateForm()
      
      if (!isValid) {
        throw new Error('Please fix the errors in the form before submitting')
      }

      // Submit form
      const result = await onSubmit(values)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during submission'
      setSubmitError(errorMessage)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [onSubmit, validationActions])

  return {
    handleSubmit,
    isSubmitting,
    submitError,
    clearSubmitError: () => setSubmitError(null)
  }
}