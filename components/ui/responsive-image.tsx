"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ResponsiveImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fallback?: React.ReactNode
  priority?: boolean
  sizes?: string
  fill?: boolean
}

export function ResponsiveImage({
  src,
  alt,
  width = 400,
  height = 300,
  className,
  fallback,
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  fill = false,
  ...props
}: ResponsiveImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  if (hasError && fallback) {
    return <>{fallback}</>
  }

  if (hasError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg",
        className
      )}>
        <div className="text-center p-4">
          <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-gray-400 dark:text-gray-500 text-xl">📷</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Image not available</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
      )}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          fill ? "object-cover" : ""
        )}
        {...props}
      />
    </div>
  )
}