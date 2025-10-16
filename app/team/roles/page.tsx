"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"

interface Role {
  id: string
  name: string
  businessId: string
  permissions: string[]
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles")
      const data = await response.json()
      setRoles(data.roles || [])
    } catch (error) {
      console.error("Error fetching roles:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Roles & Permissions</h1>
            <p className="mt-2 text-muted-foreground">Manage role-based access control</p>
          </div>
          <Link href="/team/roles/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </Link>
        </div>

        {loading ? (
          <p>Loading roles...</p>
        ) : roles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-muted-foreground">No custom roles yet</p>
              <Link href="/team/roles/new">
                <Button>Create your first role</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <CardTitle>{role.name}</CardTitle>
                  <CardDescription>{role.permissions.length} permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 5).map((permission) => (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {permission.split(":")[1]}
                      </Badge>
                    ))}
                    {role.permissions.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 5} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
