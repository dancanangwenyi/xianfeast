"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUploader } from "@/components/image-uploader"

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // TODO: Get these from context or URL params
  const stallId = "stall-1"
  const businessId = "business-1"

  const [formData, setFormData] = useState({
    title: "",
    shortDesc: "",
    longDesc: "",
    priceCents: "",
    currency: "KES",
    sku: "",
    tags: "",
    dietFlags: "",
    prepTimeMinutes: "",
    inventoryQty: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stallId,
          businessId,
          title: formData.title,
          shortDesc: formData.shortDesc,
          longDesc: formData.longDesc,
          priceCents: Number.parseInt(formData.priceCents),
          currency: formData.currency,
          sku: formData.sku,
          tags: formData.tags.split(",").map((t) => t.trim()),
          dietFlags: formData.dietFlags.split(",").map((t) => t.trim()),
          prepTimeMinutes: Number.parseInt(formData.prepTimeMinutes) || 0,
          inventoryQty: formData.inventoryQty ? Number.parseInt(formData.inventoryQty) : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create product")
      }

      router.push(`/products/${data.productId}`)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Create New Product</CardTitle>
            <CardDescription>Add a new item to your menu</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Product Name *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Kung Pao Chicken"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDesc">Short Description</Label>
                <Input
                  id="shortDesc"
                  value={formData.shortDesc}
                  onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                  placeholder="Brief one-line description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longDesc">Full Description</Label>
                <Textarea
                  id="longDesc"
                  value={formData.longDesc}
                  onChange={(e) => setFormData({ ...formData, longDesc: e.target.value })}
                  placeholder="Detailed description, ingredients, etc."
                  rows={4}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priceCents">Price (cents) *</Label>
                  <Input
                    id="priceCents"
                    type="number"
                    value={formData.priceCents}
                    onChange={(e) => setFormData({ ...formData, priceCents: e.target.value })}
                    required
                    placeholder="1299 = KSh 12.99"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="KES"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="PROD-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prepTimeMinutes">Prep Time (minutes)</Label>
                  <Input
                    id="prepTimeMinutes"
                    type="number"
                    value={formData.prepTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, prepTimeMinutes: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="spicy, chicken, popular"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dietFlags">Dietary Flags (comma-separated)</Label>
                <Input
                  id="dietFlags"
                  value={formData.dietFlags}
                  onChange={(e) => setFormData({ ...formData, dietFlags: e.target.value })}
                  placeholder="gluten-free, dairy-free, vegan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inventoryQty">Inventory Quantity (optional)</Label>
                <Input
                  id="inventoryQty"
                  type="number"
                  value={formData.inventoryQty}
                  onChange={(e) => setFormData({ ...formData, inventoryQty: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="space-y-2">
                <Label>Product Images</Label>
                <ImageUploader businessId={businessId} maxFiles={5} />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Product"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
