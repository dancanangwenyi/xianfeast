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

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBusinesses()
  }, [])

  const fetchBusinesses = async () => {
    try {
      const response = await fetch("/api/businesses")
      const data = await response.json()
      setBusinesses(data.businesses || [])
    } catch (error) {
      console.error("Error fetching businesses:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Businesses</h1>
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
          <p>Loading businesses...</p>
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
                <Card className="transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="line-clamp-1">{business.name}</CardTitle>
                      <Badge variant={business.status === "active" ? "default" : "secondary"}>{business.status}</Badge>
                    </div>
                    <CardDescription>
                      {business.currency} • {business.timezone}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(business.created_at).toLocaleDateString()}
                    </p>
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
