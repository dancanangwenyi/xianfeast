"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Loader2 } from "lucide-react"
import Image from "next/image"

interface ImageUploaderProps {
  productId?: string
  businessId: string
  onUploadComplete?: (imageData: { imageId: string; url: string }) => void
  maxFiles?: number
}

export function ImageUploader({ productId, businessId, onUploadComplete, maxFiles = 5 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<Array<{ id: string; url: string; file?: File }>>([])
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (images.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`)
      return
    }

    setError("")
    setUploading(true)

    try {
      for (const file of files) {
        // Create preview
        const previewUrl = URL.createObjectURL(file)
        const tempId = `temp-${Date.now()}-${Math.random()}`

        setImages((prev) => [...prev, { id: tempId, url: previewUrl, file }])

        // Upload to server
        const formData = new FormData()
        formData.append("file", file)
        formData.append("businessId", businessId)
        if (productId) {
          formData.append("productId", productId)
        }

        const response = await fetch("/api/drive/upload", {
          method: "POST",
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Upload failed")
        }

        // Update with real data
        setImages((prev) =>
          prev.map((img) => (img.id === tempId ? { id: data.imageId || data.driveFileId, url: data.url } : img)),
        )

        if (onUploadComplete) {
          onUploadComplete({ imageId: data.imageId || data.driveFileId, url: data.url })
        }
      }
    } catch (err: any) {
      setError(err.message || "Upload failed")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxFiles}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Images
            </>
          )}
        </Button>
        <span className="text-sm text-muted-foreground">
          {images.length} / {maxFiles} images
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image) => (
            <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border">
              <Image src={image.url || "/placeholder.svg"} alt="Product" fill className="object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(image.id)}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
