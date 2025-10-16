"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PermissionsMatrix } from "@/components/permissions-matrix"
import type { Permission } from "@/lib/types"

export default function NewRolePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [roleName, setRoleName] = useState("")
  const [permissions, setPermissions] = useState<Permission[]>([])

  // TODO: Get businessId from context
  const businessId = "business-1"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!roleName) {
      setError("Role name is required")
      setLoading(false)
      return
    }

    if (permissions.length === 0) {
      setError("Please select at least one permission")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          roleName,
          permissions,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create role")
      }

      router.push("/team/roles")
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">Create New Role</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Details</CardTitle>
              <CardDescription>Define the role name and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name *</Label>
                <Input
                  id="roleName"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g., Kitchen Manager"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <PermissionsMatrix selectedPermissions={permissions} onChange={setPermissions} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Role"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
