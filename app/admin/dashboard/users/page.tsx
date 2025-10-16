"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Shield,
  Key,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserPlus,
  Building2,
  Settings,
  Lock,
  Unlock,
  RefreshCw,
} from "lucide-react"
import { motion } from "framer-motion"

interface User {
  id: string
  name: string
  email: string
  roles: string[]
  mfaEnabled: boolean
  status: "active" | "disabled" | "invited" | "suspended"
  lastLogin: string
  createdAt: string
  businessId?: string
  businessName?: string
  phone?: string
  invitedBy?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Form state for inviting new user
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "user",
    businessId: "",
  })

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        // Mock data - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setUsers([
          {
            id: "1",
            name: "Super Admin",
            email: "dancangwe@gmail.com",
            roles: ["super_admin"],
            mfaEnabled: false,
            status: "active",
            lastLogin: "2 minutes ago",
            createdAt: "2024-01-01",
            phone: "+1-555-0001"
          },
          {
            id: "2",
            name: "Li Wei",
            email: "owner@goldendragon.com",
            roles: ["business_owner"],
            mfaEnabled: true,
            status: "active",
            lastLogin: "1 hour ago",
            createdAt: "2024-01-15",
            businessId: "1",
            businessName: "Golden Dragon Restaurant",
            phone: "+1-555-0123"
          },
          {
            id: "3",
            name: "Priya Sharma",
            email: "chef@spicegarden.com",
            roles: ["stall_manager"],
            mfaEnabled: false,
            status: "active",
            lastLogin: "3 hours ago",
            createdAt: "2024-02-03",
            businessId: "2",
            businessName: "Spice Garden",
            phone: "+1-555-0456"
          },
          {
            id: "4",
            name: "Hiroshi Tanaka",
            email: "manager@tokyosushi.com",
            roles: ["business_owner"],
            mfaEnabled: false,
            status: "pending",
            lastLogin: "Never",
            createdAt: "2024-03-10",
            businessId: "3",
            businessName: "Tokyo Sushi Bar",
            invitedBy: "Super Admin"
          },
          {
            id: "5",
            name: "Maria Rodriguez",
            email: "owner@medbistro.com",
            roles: ["business_owner"],
            mfaEnabled: true,
            status: "disabled",
            lastLogin: "1 week ago",
            createdAt: "2024-01-28",
            businessId: "4",
            businessName: "Mediterranean Bistro",
            phone: "+1-555-0321"
          },
          {
            id: "6",
            name: "John Smith",
            email: "john@example.com",
            roles: ["menu_editor"],
            mfaEnabled: false,
            status: "active",
            lastLogin: "2 days ago",
            createdAt: "2024-02-15",
            businessId: "1",
            businessName: "Golden Dragon Restaurant",
            phone: "+1-555-0789"
          }
        ])
      } catch (error) {
        console.error("Failed to fetch users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.roles.includes(roleFilter)
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleInviteUser = async () => {
    try {
      // Mock API call - replace with actual API call
      console.log("Inviting user:", newUser)
      setIsInviteDialogOpen(false)
      setNewUser({
        name: "",
        email: "",
        role: "user",
        businessId: "",
      })
      // Refresh users list
    } catch (error) {
      console.error("Failed to invite user:", error)
    }
  }

  const getStatusColor = (status: User["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "invited":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "disabled":
        return "bg-red-100 text-red-800 border-red-200"
      case "suspended":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: User["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-3 w-3" />
      case "invited":
        return <Mail className="h-3 w-3" />
      case "pending":
        return <Clock className="h-3 w-3" />
      case "disabled":
        return <AlertTriangle className="h-3 w-3" />
      case "suspended":
        return <Lock className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "business_owner":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "stall_manager":
        return "bg-green-100 text-green-800 border-green-200"
      case "menu_editor":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "order_fulfiller":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Users Management
            </h1>
            <p className="text-slate-600 mt-1">Manage all users and their roles across the platform</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-slate-200 rounded w-1/3"></div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Users Management
          </h1>
          <p className="text-slate-600 mt-1">Manage all users and their roles across the platform</p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation to a new user to join the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter user's full name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter user's email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="business_owner">Business Owner</SelectItem>
                    <SelectItem value="stall_manager">Stall Manager</SelectItem>
                    <SelectItem value="menu_editor">Menu Editor</SelectItem>
                    <SelectItem value="order_fulfiller">Order Fulfiller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="businessId">Business (Optional)</Label>
                <Select value={newUser.businessId} onValueChange={(value) => setNewUser({ ...newUser, businessId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Business</SelectItem>
                    <SelectItem value="1">Golden Dragon Restaurant</SelectItem>
                    <SelectItem value="2">Spice Garden</SelectItem>
                    <SelectItem value="3">Tokyo Sushi Bar</SelectItem>
                    <SelectItem value="4">Mediterranean Bistro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteUser}>
                <Mail className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{users.length}</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <UserPlus className="h-3 w-3 mr-1" />
                +3 this month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Users</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {users.filter(u => u.status === "active").length}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {Math.round((users.filter(u => u.status === "active").length / users.length) * 100)}% of total
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">MFA Enabled</CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {users.filter(u => u.mfaEnabled).length}
              </div>
              <p className="text-xs text-blue-600 mt-1">Enhanced security</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Pending Invites</CardTitle>
              <Mail className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {users.filter(u => u.status === "invited" || u.status === "pending").length}
              </div>
              <p className="text-xs text-yellow-600 mt-1">Awaiting response</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="business_owner">Business Owner</SelectItem>
                  <SelectItem value="stall_manager">Stall Manager</SelectItem>
                  <SelectItem value="menu_editor">Menu Editor</SelectItem>
                  <SelectItem value="order_fulfiller">Order Fulfiller</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {filteredUsers.length} users found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>MFA</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-slate-50"
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white text-xs">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} className={getRoleColor(role)}>
                          {role.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status)}>
                      {getStatusIcon(user.status)}
                      <span className="ml-1 capitalize">{user.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {user.mfaEnabled ? (
                        <Shield className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.businessName ? (
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-1 text-slate-400" />
                        <span className="text-sm">{user.businessName}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">No business</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-500">
                      {user.lastLogin}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user)
                          setIsDetailDialogOpen(true)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Key className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Reset MFA
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status === "active" ? (
                          <DropdownMenuItem className="text-orange-600">
                            <Lock className="mr-2 h-4 w-4" />
                            Disable User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-green-600">
                            <Unlock className="mr-2 h-4 w-4" />
                            Enable User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>{selectedUser?.name}</span>
            </DialogTitle>
            <DialogDescription>
              User details and management options
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white text-lg">
                    {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-slate-600">{selectedUser.email}</p>
                  <Badge className={getStatusColor(selectedUser.status)}>
                    {getStatusIcon(selectedUser.status)}
                    <span className="ml-1 capitalize">{selectedUser.status}</span>
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Roles</Label>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedUser.roles.map((role) => (
                      <Badge key={role} className={getRoleColor(role)}>
                        {role.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">MFA Status</Label>
                  <div className="mt-2 flex items-center">
                    {selectedUser.mfaEnabled ? (
                      <>
                        <Shield className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm text-green-600">Enabled</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
                        <span className="text-sm text-orange-600">Disabled</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {selectedUser.businessName && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Business</Label>
                  <div className="mt-2 flex items-center">
                    <Building2 className="h-4 w-4 text-slate-400 mr-2" />
                    <span className="text-sm">{selectedUser.businessName}</span>
                  </div>
                </div>
              )}

              {selectedUser.phone && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Contact</Label>
                  <div className="mt-2 text-sm">{selectedUser.phone}</div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-slate-600">Timeline</Label>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Created: {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Last Login: {selectedUser.lastLogin}</span>
                  </div>
                  {selectedUser.invitedBy && (
                    <div className="flex items-center space-x-2">
                      <UserPlus className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">Invited by: {selectedUser.invitedBy}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Manage User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
