"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Building2 } from "lucide-react"

interface Business {
  id: string
  name: string
  owner_user_id: string
  currency: string
  timezone: string
  status: string
  created_at: string
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBusinesses()
  }, [])

  const fetchBusinesses = async () => {
    try {
      const response = await fetch("/api/admin/businesses")
      const data = await response.json()
      setBusinesses(data.businesses || [])
    } catch (error) {
      console.error("Error fetching businesses:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Businesses Management</h1>
          <p className="mt-2 text-muted-foreground">Manage all businesses on the platform</p>
        </div>
        <Link href="/admin/businesses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Business
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">No businesses yet</p>
            <Link href="/admin/businesses/new">
              <Button>Create your first business</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <Link key={business.id} href={`/admin/businesses/${business.id}`}>
              <Card className="transition-shadow hover:shadow-lg cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1">{business.name}</CardTitle>
                    <Badge variant={business.status === "active" ? "default" : "secondary"}>
                      {business.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {business.email || "No email"} • {business.phone || "No phone"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {business.description || "No description"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(business.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
