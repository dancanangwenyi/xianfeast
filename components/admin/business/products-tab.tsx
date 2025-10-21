"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Package, Edit, Trash2, CheckCircle, XCircle, DollarSign, Store } from "lucide-react"

interface Product {
  id: string
  stall_id: string
  business_id: string
  title: string
  short_desc: string
  long_desc: string
  price_cents: number
  currency: string
  sku: string
  tags_csv: string
  diet_flags_csv: string
  prep_time_minutes: number
  inventory_qty: number
  status: string
  created_by: string
  created_at: string
  updated_at: string
  images?: any[]
}

interface Stall {
  id: string
  name: string
  status: string
}

interface ProductsTabProps {
  businessId: string
}

export function ProductsTab({ businessId }: ProductsTabProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [stalls, setStalls] = useState<Stall[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    stall_id: "",
    title: "",
    short_desc: "",
    long_desc: "",
    price_cents: 0,
    currency: "KES",
    sku: "",
    tags_csv: "",
    diet_flags_csv: "",
    prep_time_minutes: 0,
    inventory_qty: 0,
    status: "draft"
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
    fetchStalls()
  }, [businessId])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products?businessId=${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStalls = async () => {
    try {
      const response = await fetch(`/api/stalls?businessId=${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setStalls(data.stalls || [])
      }
    } catch (error) {
      console.error("Error fetching stalls:", error)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      stall_id: "",
      title: "",
      short_desc: "",
      long_desc: "",
      price_cents: 0,
      currency: "KES",
      sku: "",
      tags_csv: "",
      diet_flags_csv: "",
      prep_time_minutes: 0,
      inventory_qty: 0,
      status: "draft"
    })
    setEditingProduct(null)
  }

  const handleCreateProduct = async () => {
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          stallId: formData.stall_id,
          title: formData.title,
          shortDesc: formData.short_desc,
          longDesc: formData.long_desc,
          priceCents: formData.price_cents,
          currency: formData.currency,
          sku: formData.sku,
          tags: formData.tags_csv.split(",").map(t => t.trim()).filter(Boolean),
          dietFlags: formData.diet_flags_csv.split(",").map(t => t.trim()).filter(Boolean),
          prepTimeMinutes: formData.prep_time_minutes,
          inventoryQty: formData.inventory_qty,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product created successfully",
        })
        setIsCreateDialogOpen(false)
        resetForm()
        fetchProducts()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create product",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      })
    }
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct) return

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product updated successfully",
        })
        resetForm()
        fetchProducts()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update product",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      })
    }
  }

  const handleApproveProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/approve`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product approved successfully",
        })
        fetchProducts()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to approve product",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve product",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        })
        fetchProducts()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete product",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  const startEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      stall_id: product.stall_id,
      title: product.title,
      short_desc: product.short_desc,
      long_desc: product.long_desc,
      price_cents: product.price_cents,
      currency: product.currency,
      sku: product.sku,
      tags_csv: product.tags_csv,
      diet_flags_csv: product.diet_flags_csv,
      prep_time_minutes: product.prep_time_minutes,
      inventory_qty: product.inventory_qty,
      status: product.status
    })
  }

  const getStallName = (stallId: string) => {
    const stall = stalls.find(s => s.id === stallId)
    return stall?.name || "Unknown Stall"
  }

  const formatPrice = (cents: number, currency: string) => {
    return `${currency} ${(cents / 100).toFixed(2)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "pending": return "secondary"
      case "draft": return "outline"
      case "suspended": return "destructive"
      default: return "secondary"
    }
  }

  if (loading) {
    return <div>Loading products...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-card via-card to-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Package className="h-4 w-4 text-white" />
              </div>
              Products Management
            </h3>
            <p className="text-sm text-muted-foreground font-medium mt-2">
              Manage products, pricing, and availability across all stalls
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white shadow-md">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
              <DialogDescription>
                Add a new product to one of your stalls
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product-stall">Stall</Label>
                  <Select value={formData.stall_id} onValueChange={(value) => handleInputChange("stall_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a stall" />
                    </SelectTrigger>
                    <SelectContent>
                      {stalls.map((stall) => (
                        <SelectItem key={stall.id} value={stall.id}>
                          {stall.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-title">Product Name</Label>
                  <Input
                    id="product-title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Chicken Burger"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="product-short-desc">Short Description</Label>
                <Input
                  id="product-short-desc"
                  value={formData.short_desc}
                  onChange={(e) => handleInputChange("short_desc", e.target.value)}
                  placeholder="Brief description for listings"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="product-long-desc">Full Description</Label>
                <Textarea
                  id="product-long-desc"
                  value={formData.long_desc}
                  onChange={(e) => handleInputChange("long_desc", e.target.value)}
                  placeholder="Detailed product description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product-price">Price (cents)</Label>
                  <Input
                    id="product-price"
                    type="number"
                    value={formData.price_cents}
                    onChange={(e) => handleInputChange("price_cents", parseInt(e.target.value) || 0)}
                    placeholder="e.g., 1500 for KES 15.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-sku">SKU</Label>
                  <Input
                    id="product-sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange("sku", e.target.value)}
                    placeholder="Product code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product-tags">Tags (comma-separated)</Label>
                  <Input
                    id="product-tags"
                    value={formData.tags_csv}
                    onChange={(e) => handleInputChange("tags_csv", e.target.value)}
                    placeholder="e.g., spicy, popular, new"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-diet">Diet Flags (comma-separated)</Label>
                  <Input
                    id="product-diet"
                    value={formData.diet_flags_csv}
                    onChange={(e) => handleInputChange("diet_flags_csv", e.target.value)}
                    placeholder="e.g., vegetarian, vegan, gluten-free"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prep-time">Prep Time (minutes)</Label>
                  <Input
                    id="prep-time"
                    type="number"
                    value={formData.prep_time_minutes}
                    onChange={(e) => handleInputChange("prep_time_minutes", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inventory">Inventory Quantity</Label>
                  <Input
                    id="inventory"
                    type="number"
                    value={formData.inventory_qty}
                    onChange={(e) => handleInputChange("inventory_qty", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProduct}>Create Product</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">No products yet</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Create your first product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {product.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Store className="h-4 w-4" />
                        {getStallName(product.stall_id)}
                      </div>
                      {product.short_desc}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(product.status)}>
                    {product.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <p className="font-semibold">{formatPrice(product.price_cents, product.currency)}</p>
                </div>

                {product.tags_csv && (
                  <div className="flex flex-wrap gap-1">
                    {product.tags_csv.split(",").map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Prep: {product.prep_time_minutes}min</span>
                  <span>Stock: {product.inventory_qty}</span>
                </div>

                <div className="flex justify-end gap-2">
                  {product.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApproveProduct(product.id)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(product)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => resetForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-product-stall">Stall</Label>
                <Select value={formData.stall_id} onValueChange={(value) => handleInputChange("stall_id", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stalls.map((stall) => (
                      <SelectItem key={stall.id} value={stall.id}>
                        {stall.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-product-title">Product Name</Label>
                <Input
                  id="edit-product-title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-product-short-desc">Short Description</Label>
              <Input
                id="edit-product-short-desc"
                value={formData.short_desc}
                onChange={(e) => handleInputChange("short_desc", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-product-long-desc">Full Description</Label>
              <Textarea
                id="edit-product-long-desc"
                value={formData.long_desc}
                onChange={(e) => handleInputChange("long_desc", e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-product-price">Price (cents)</Label>
                <Input
                  id="edit-product-price"
                  type="number"
                  value={formData.price_cents}
                  onChange={(e) => handleInputChange("price_cents", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-product-currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KES">KES</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-product-sku">SKU</Label>
                <Input
                  id="edit-product-sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange("sku", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProduct}>Update Product</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}