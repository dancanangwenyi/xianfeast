"use client"

import { Loader2Icon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpinnerProps extends React.ComponentProps<'svg'> {
  size?: "sm" | "md" | "lg"
}

function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: "size-4",
    md: "size-6", 
    lg: "size-8"
  }

  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn('animate-spin text-indigo-600 dark:text-indigo-400', sizeClasses[size], className)}
      {...props}
    />
  )
}

interface LoadingStateProps {
  message?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

function LoadingState({ 
  message = "Loading...", 
  size = "md", 
  className 
}: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 animate-in fade-in duration-500", className)}>
      <Spinner size={size} className="mb-4" />
      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium animate-in slide-in-from-bottom-2 duration-700 delay-200">
        {message}
      </p>
    </div>
  )
}

export { Spinner, LoadingState }
