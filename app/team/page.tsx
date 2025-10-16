"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, UserCog, Shield } from "lucide-react"

interface User {
  id: string
  email: string
  name: string
  roles: string[]
  status: string
  mfaEnabled: boolean
  lastLogin?: string
}

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Team Management</h1>
            <p className="mt-2 text-muted-foreground">Manage users and their roles</p>
          </div>
          <div className="flex gap-2">
            <Link href="/team/roles">
              <Button variant="outline">
                <Shield className="mr-2 h-4 w-4" />
                Manage Roles
              </Button>
            </Link>
            <Link href="/team/invite">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <p>Loading team members...</p>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-muted-foreground">No team members yet</p>
              <Link href="/team/invite">
                <Button>Invite your first team member</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.mfaEnabled && (
                        <Badge variant="outline" className="gap-1">
                          <Shield className="h-3 w-3" />
                          MFA
                        </Badge>
                      )}
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Roles</p>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role} variant="secondary">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Last login</p>
                      <p className="text-sm font-medium">{formatDate(user.lastLogin)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/team/${user.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <UserCog className="mr-2 h-4 w-4" />
                        Edit Roles
                      </Button>
                    </Link>
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
