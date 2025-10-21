"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Package, Edit, Trash2, DollarSign, Store, Eye, CheckCircle } from "lucide-react"

interface Product {
  id: string
  stall_id: string
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
  created_at: string
  stall_name?: string
}

interface Stall {
  id: string
  name: string
  status: string
}

export default function BusinessProductsPage() {
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
    currency: "USD",
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
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/businesses/my-products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      } else {
        console.error('Failed to fetch products')
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStalls = async () => {
    try {
      const response = await fetch('/api/businesses/my-stalls')
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
      currency: "USD",
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
    // Mock creation for demonstration
    toast({
      title: "Success",
      description: "Product created successfully (demo mode)",
    })
    setIsCreateDialogOpen(false)
    resetForm()
    fetchProducts()
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white', label: 'Active' },
      draft: { color: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white', label: 'Draft' },
      pending: { color: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white', label: 'Pending' },
      suspended: { color: 'bg-gradient-to-r from-red-500 to-rose-500 text-white', label: 'Suspended' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return <Badge className={`${config.color} shadow-md`}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground mt-1">Loading your products...</p>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-card via-card to-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                <Package className="h-6 w-6 text-white" />
              </div>
              Products Management
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              Manage your menu items, pricing, and availability
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
                  Add a new product to your menu
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
                      placeholder="1599 for $15.99"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-currency">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="KES">KES</SelectItem>
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

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProduct}>Create Product</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {products.length === 0 ? (
        <Card className="bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm border border-border/50 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Package className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Create your first product to start building your menu
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white shadow-md"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-muted/20 to-muted/5 border-b border-border/30">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-md flex items-center justify-center">
                        <Package className="h-3 w-3 text-white" />
                      </div>
                      {product.title}
                    </CardTitle>
                    <CardDescription className="mt-2 font-medium">
                      {product.short_desc}
                    </CardDescription>
                  </div>
                  {getStatusBadge(product.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-lg font-bold text-green-600">
                      ${(product.price_cents / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{product.stall_name}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    Stock: {product.inventory_qty} • Prep: {product.prep_time_minutes}min
                  </p>
                </div>

                {product.tags_csv && (
                  <div className="flex flex-wrap gap-1">
                    {product.tags_csv.split(',').map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex justify-between gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}