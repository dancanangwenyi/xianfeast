"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CustomerLayout } from "@/components/customer/layout/customer-layout"
import { 
  Search, 
  Filter,
  ChefHat,
  DollarSign,
  X
} from "lucide-react"

interface Stall {
  id: string
  name: string
  description: string
  cuisine_type: string
  business_name: string
  product_count: number
  min_price_cents: number
  max_price_cents: number
  products: any[]
  has_products: boolean
}

interface StallsData {
  stalls: Stall[]
  filters: {
    cuisine_types: string[]
    total_count: number
  }
}

function CustomerStallsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [stallsData, setStallsData] = useState<StallsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [selectedCuisine, setSelectedCuisine] = useState(searchParams.get("cuisine") || "")
  const [priceRange, setPriceRange] = useState(searchParams.get("priceRange") || "")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadStalls()
  }, [searchTerm, selectedCuisine, priceRange])

  const loadStalls = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.set("search", searchTerm)
      if (selectedCuisine) params.set("cuisine", selectedCuisine)
      if (priceRange) params.set("priceRange", priceRange)

      const response = await fetch(`/api/customer/stalls?${params.toString()}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/customer/login")
          return
        }
        throw new Error("Failed to load stalls")
      }
      
      const data = await response.json()
      setStallsData(data)
    } catch (error) {
      console.error("Stalls error:", error)
      setError("Failed to load stalls. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("search", value)
    } else {
      params.delete("search")
    }
    router.push(`/customer/stalls?${params.toString()}`)
  }

  const handleCuisineFilter = (cuisine: string) => {
    const newCuisine = selectedCuisine === cuisine ? "" : cuisine
    setSelectedCuisine(newCuisine)
    const params = new URLSearchParams(searchParams.toString())
    if (newCuisine) {
      params.set("cuisine", newCuisine)
    } else {
      params.delete("cuisine")
    }
    router.push(`/customer/stalls?${params.toString()}`)
  }

  const handlePriceFilter = (range: string) => {
    const newRange = priceRange === range ? "" : range
    setPriceRange(newRange)
    const params = new URLSearchParams(searchParams.toString())
    if (newRange) {
      params.set("priceRange", newRange)
    } else {
      params.delete("priceRange")
    }
    router.push(`/customer/stalls?${params.toString()}`)
  }

  const clearAllFilters = () => {
    setSearchTerm("")
    setSelectedCuisine("")
    setPriceRange("")
    router.push("/customer/stalls")
  }

  const hasActiveFilters = searchTerm || selectedCuisine || priceRange

  if (loading) {
    return (
      <CustomerLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-6 sm:h-8 w-48 sm:w-64" />
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-4 sm:p-6">
                  <Skeleton className="h-4 w-32 mb-2 dark:bg-gray-700" />
                  <Skeleton className="h-6 w-48 mb-2 dark:bg-gray-700" />
                  <Skeleton className="h-4 w-full mb-4 dark:bg-gray-700" />
                  <Skeleton className="h-8 w-24 dark:bg-gray-700" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CustomerLayout>
    )
  }

  if (error) {
    return (
      <CustomerLayout>
        <div className="p-6 text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={loadStalls}>Try Again</Button>
        </div>
      </CustomerLayout>
    )
  }

  if (!stallsData) {
    return (
      <CustomerLayout>
        <div className="p-6 text-center">
          <div className="text-gray-600">No data available</div>
        </div>
      </CustomerLayout>
    )
  }

  const { stalls, filters } = stallsData

  return (
    <CustomerLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="animate-in fade-in duration-500">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Browse Stalls</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 animate-in slide-in-from-bottom-2 duration-700 delay-100">
              Discover amazing meals from {filters.total_count} available stalls
            </p>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 delay-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                <Input
                  placeholder="Search stalls, cuisine, or dishes..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-200"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 w-full sm:w-auto"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                    {[searchTerm, selectedCuisine, priceRange].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <Card className="p-4">
                <div className="space-y-4">
                  {/* Cuisine Filter */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Cuisine Type</h3>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant={selectedCuisine === "" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleCuisineFilter("")}
                      >
                        All Cuisines
                      </Button>
                      {filters.cuisine_types.map((cuisine) => (
                        <Button
                          key={cuisine}
                          variant={selectedCuisine === cuisine ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleCuisineFilter(cuisine)}
                        >
                          {cuisine}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range Filter */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Price Range</h3>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant={priceRange === "" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePriceFilter("")}
                      >
                        Any Price
                      </Button>
                      <Button
                        variant={priceRange === "0-1000" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePriceFilter("0-1000")}
                      >
                        Under $10
                      </Button>
                      <Button
                        variant={priceRange === "1000-2000" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePriceFilter("1000-2000")}
                      >
                        $10 - $20
                      </Button>
                      <Button
                        variant={priceRange === "2000-5000" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePriceFilter("2000-5000")}
                      >
                        $20 - $50
                      </Button>
                      <Button
                        variant={priceRange === "5000-999999" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePriceFilter("5000-999999")}
                      >
                        $50+
                      </Button>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Clear All Filters
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Active filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: {searchTerm}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleSearch("")}
                    />
                  </Badge>
                )}
                {selectedCuisine && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {selectedCuisine}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleCuisineFilter("")}
                    />
                  </Badge>
                )}
                {priceRange && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Price: {
                      priceRange === "0-1000" ? "Under $10" :
                      priceRange === "1000-2000" ? "$10-$20" :
                      priceRange === "2000-5000" ? "$20-$50" :
                      "$50+"
                    }
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handlePriceFilter("")}
                    />
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {stalls.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {stalls.map((stall, index) => (
              <Card key={stall.id} className={`hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-300 cursor-pointer group dark:bg-gray-800 dark:border-gray-700 animate-in slide-in-from-bottom-4 delay-${(index % 6 + 1) * 100}`}>
                <Link href={`/customer/stalls/${stall.id}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 text-gray-900 dark:text-gray-100">
                          {stall.name}
                        </CardTitle>
                        <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">
                          {stall.business_name}
                        </CardDescription>
                      </div>
                      {stall.cuisine_type && (
                        <Badge variant="secondary" className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shrink-0">
                          {stall.cuisine_type}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stall.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {stall.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                          <ChefHat className="h-4 w-4" />
                          <span>{stall.product_count} items</span>
                        </div>
                        {stall.min_price_cents > 0 && stall.max_price_cents > 0 && (
                          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-medium">
                              {stall.min_price_cents === stall.max_price_cents
                                ? formatCurrency(stall.min_price_cents)
                                : `${formatCurrency(stall.min_price_cents)} - ${formatCurrency(stall.max_price_cents)}`
                              }
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Preview products */}
                      {stall.products.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Popular Items
                          </p>
                          <div className="space-y-1">
                            {stall.products.slice(0, 2).map((product) => (
                              <div key={product.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700 truncate">{product.name}</span>
                                <span className="text-gray-600 font-medium ml-2">
                                  {formatCurrency(product.price_cents || 0)}
                                </span>
                              </div>
                            ))}
                            {stall.products.length > 2 && (
                              <p className="text-xs text-gray-500">
                                +{stall.products.length - 2} more items
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <Button className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 group-hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg">
                        View Menu
                      </Button>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stalls found</h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters
                ? "Try adjusting your search or filters"
                : "No stalls are currently available"
              }
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearAllFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}

export default function CustomerStallsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    }>
      <CustomerStallsPageContent />
    </Suspense>
  )
}