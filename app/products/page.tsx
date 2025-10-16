"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"

interface Product {
  id: string
  title: string
  short_desc: string
  price_cents: number
  currency: string
  status: string
  tags_csv: string
  images: Array<{ url_cached: string }>
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(cents / 100)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="mt-2 text-muted-foreground">Manage your menu items</p>
          </div>
          <Link href="/products/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>

        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-muted-foreground">No products yet</p>
              <Link href="/products/new">
                <Button>Create your first product</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                  {product.images && product.images.length > 0 ? (
                    <div className="relative aspect-video">
                      <Image
                        src={product.images[0].url_cached || "/placeholder.svg"}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-muted">
                      <span className="text-muted-foreground">No image</span>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="line-clamp-1">{product.title}</CardTitle>
                      <Badge variant={product.status === "active" ? "default" : "secondary"}>{product.status}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{product.short_desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatPrice(Number(product.price_cents), product.currency)}</p>
                    {product.tags_csv && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {product.tags_csv.split(",").map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
