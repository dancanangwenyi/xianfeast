"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Users, Mail, UserCheck, UserX, Lock, Unlock, RotateCcw } from "lucide-react"

interface User {
  id: string
  email: string
  name: string
  roles: string[]
  mfaEnabled: boolean
  status: string
  lastLogin?: string
  createdAt: string
}

interface Role {
  id: string
  role_name: string
  permissions_csv: string
}

interface UsersTabProps {
  businessId: string
}

export function UsersTab({ businessId }: UsersTabProps) {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [managingUser, setManagingUser] = useState<User | null>(null)
  const [inviteData, setInviteData] = useState({
    email: "",
    name: "",
    role: ""
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [businessId])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/users?businessId=${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await fetch(`/api/roles?businessId=${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles || [])
      }
    } catch (error) {
      console.error("Error fetching roles:", error)
    }
  }

  const handleInviteUser = async () => {
    try {
      const response = await fetch("/api/auth/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteData.email,
          name: inviteData.name,
          businessId,
          role: inviteData.role,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User invitation sent successfully",
        })
        setIsInviteDialogOpen(false)
        setInviteData({ email: "", name: "", role: "" })
        fetchUsers()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to send invitation",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      })
    }
  }

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `User ${status === "active" ? "activated" : "deactivated"} successfully`,
        })
        fetchUsers()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update user status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      })
    }
  }

  const handleResetPassword = async (userId: string) => {
    if (!confirm("Are you sure you want to send a password reset link to this user?")) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Password reset link sent successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to send password reset",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send password reset",
        variant: "destructive",
      })
    }
  }

  const handleUpdateUserRoles = async (userId: string, newRoles: string[]) => {
    try {
      const response = await fetch(`/api/users/${userId}/roles`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roles: newRoles }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User roles updated successfully",
        })
        setManagingUser(null)
        fetchUsers()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update user roles",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user roles",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "pending": return "secondary"
      case "suspended": return "destructive"
      default: return "outline"
    }
  }

  const getRoleNames = (roleIds: string[]) => {
    return roleIds.map(roleId => {
      const role = roles.find(r => r.id === roleId)
      return role?.role_name || roleId
    }).join(", ")
  }

  if (loading) {
    return <div>Loading users...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-card via-card to-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              Users Management
            </h3>
            <p className="text-sm text-muted-foreground font-medium mt-2">
              Manage users, roles, and permissions for this business
            </p>
          </div>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white shadow-md">
                <Plus className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation to a new user to join this business
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-name">Full Name</Label>
                <Input
                  id="invite-name"
                  value={inviteData.name}
                  onChange={(e) => setInviteData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Initial Role</Label>
                <Select value={inviteData.role} onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.role_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteUser}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">No users yet</p>
            <Button onClick={() => setIsInviteDialogOpen(true)}>
              Invite your first user
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {user.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {user.email}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                    {user.mfaEnabled && (
                      <Badge variant="outline">MFA</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Roles</Label>
                  <p className="text-sm text-muted-foreground">
                    {getRoleNames(user.roles) || "No roles assigned"}
                  </p>
                </div>

                {user.lastLogin && (
                  <div>
                    <Label className="text-sm font-medium">Last Login</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(user.lastLogin).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setManagingUser(user)}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Manage Roles
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetPassword(user.id)}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Password
                  </Button>

                  {user.status === "active" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateUserStatus(user.id, "suspended")}
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateUserStatus(user.id, "active")}
                    >
                      <Unlock className="mr-2 h-4 w-4" />
                      Activate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Role Management Dialog */}
      <Dialog open={!!managingUser} onOpenChange={() => setManagingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
            <DialogDescription>
              Update roles and permissions for {managingUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Roles</Label>
              <div className="flex flex-wrap gap-2">
                {managingUser?.roles.map((roleId) => (
                  <Badge key={roleId} variant="outline">
                    {roles.find(r => r.id === roleId)?.role_name || roleId}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Available Roles</Label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`role-${role.id}`}
                      checked={managingUser?.roles.includes(role.id)}
                      onChange={(e) => {
                        if (!managingUser) return
                        const newRoles = e.target.checked
                          ? [...managingUser.roles, role.id]
                          : managingUser.roles.filter(r => r !== role.id)
                        setManagingUser({ ...managingUser, roles: newRoles })
                      }}
                    />
                    <Label htmlFor={`role-${role.id}`} className="text-sm">
                      {role.role_name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setManagingUser(null)}>
                Cancel
              </Button>
              <Button onClick={() => managingUser && handleUpdateUserRoles(managingUser.id, managingUser.roles)}>
                Update Roles
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}