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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  ShoppingCart,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Globe,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
} from "lucide-react"
import { motion } from "framer-motion"

interface Business {
  id: string
  name: string
  ownerEmail: string
  ownerName: string
  status: "active" | "disabled" | "pending"
  stallsCount: number
  productsCount: number
  ordersCount: number
  revenue: number
  currency: string
  timezone: string
  createdAt: string
  lastActivity: string
  description?: string
  address?: string
  website?: string
  phone?: string
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)

  // Form state for creating new business
  const [newBusiness, setNewBusiness] = useState({
    name: "",
    ownerEmail: "",
    ownerName: "",
    currency: "KES",
    timezone: "UTC",
    description: "",
  })

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true)
      try {
        // Mock data - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setBusinesses([
          {
            id: "1",
            name: "Golden Dragon Restaurant",
            ownerEmail: "owner@goldendragon.com",
            ownerName: "Li Wei",
            status: "active",
            stallsCount: 3,
            productsCount: 45,
            ordersCount: 234,
            revenue: 15680,
            currency: "KES",
            timezone: "America/New_York",
            createdAt: "2024-01-15",
            lastActivity: "2 hours ago",
            description: "Authentic Chinese cuisine with modern twist",
            address: "123 Main St, New York, NY",
            website: "goldendragon.com",
            phone: "+1-555-0123"
          },
          {
            id: "2",
            name: "Spice Garden",
            ownerEmail: "chef@spicegarden.com",
            ownerName: "Priya Sharma",
            status: "active",
            stallsCount: 2,
            productsCount: 32,
            ordersCount: 189,
            revenue: 12340,
            currency: "KES",
            timezone: "America/Los_Angeles",
            createdAt: "2024-02-03",
            lastActivity: "1 day ago",
            description: "Indian street food and traditional dishes",
            address: "456 Oak Ave, Los Angeles, CA",
            website: "spicegarden.com",
            phone: "+1-555-0456"
          },
          {
            id: "3",
            name: "Tokyo Sushi Bar",
            ownerEmail: "manager@tokyosushi.com",
            ownerName: "Hiroshi Tanaka",
            status: "pending",
            stallsCount: 1,
            productsCount: 28,
            ordersCount: 67,
            revenue: 4560,
            currency: "KES",
            timezone: "America/Chicago",
            createdAt: "2024-03-10",
            lastActivity: "3 days ago",
            description: "Fresh sushi and Japanese cuisine",
            address: "789 Pine St, Chicago, IL",
            phone: "+1-555-0789"
          },
          {
            id: "4",
            name: "Mediterranean Bistro",
            ownerEmail: "owner@medbistro.com",
            ownerName: "Maria Rodriguez",
            status: "disabled",
            stallsCount: 2,
            productsCount: 38,
            ordersCount: 0,
            revenue: 0,
            currency: "KES",
            timezone: "America/New_York",
            createdAt: "2024-01-28",
            lastActivity: "1 week ago",
            description: "Mediterranean and Middle Eastern cuisine",
            address: "321 Elm St, Boston, MA",
            website: "medbistro.com",
            phone: "+1-555-0321"
          }
        ])
      } catch (error) {
        console.error("Failed to fetch businesses:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [])

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          business.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          business.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || business.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateBusiness = async () => {
    try {
      // Mock API call - replace with actual API call
      console.log("Creating business:", newBusiness)
      setIsCreateDialogOpen(false)
      setNewBusiness({
        name: "",
        ownerEmail: "",
        ownerName: "",
        currency: "KES",
        timezone: "UTC",
        description: "",
      })
      // Refresh businesses list
    } catch (error) {
      console.error("Failed to create business:", error)
    }
  }

  const getStatusColor = (status: Business["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
      case "disabled":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800"
    }
  }

  const getStatusIcon = (status: Business["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-3 w-3" />
      case "pending":
        return <Clock className="h-3 w-3" />
      case "disabled":
        return <AlertTriangle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Businesses Management
            </h1>
            <p className="text-slate-600 mt-1">Manage all businesses on the platform</p>
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
            Businesses Management
          </h1>
          <p className="text-slate-600 mt-1">Manage all businesses on the platform</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Business
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Business</DialogTitle>
              <DialogDescription>
                Create a new business and invite the owner to join the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Business Name</Label>
                <Input
                  id="name"
                  placeholder="Enter business name"
                  value={newBusiness.name}
                  onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  placeholder="Enter owner's full name"
                  value={newBusiness.ownerName}
                  onChange={(e) => setNewBusiness({ ...newBusiness, ownerName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ownerEmail">Owner Email</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  placeholder="Enter owner's email"
                  value={newBusiness.ownerEmail}
                  onChange={(e) => setNewBusiness({ ...newBusiness, ownerEmail: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={newBusiness.currency} onValueChange={(value) => setNewBusiness({ ...newBusiness, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={newBusiness.timezone} onValueChange={(value) => setNewBusiness({ ...newBusiness, timezone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the business"
                  value={newBusiness.description}
                  onChange={(e) => setNewBusiness({ ...newBusiness, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBusiness}>
                Create Business
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
              <CardTitle className="text-sm font-medium text-slate-600">Total Businesses</CardTitle>
              <Building2 className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{businesses.length}</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +2 this month
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
              <CardTitle className="text-sm font-medium text-slate-600">Active Businesses</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {businesses.filter(b => b.status === "active").length}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {Math.round((businesses.filter(b => b.status === "active").length / businesses.length) * 100)}% of total
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
              <CardTitle className="text-sm font-medium text-slate-600">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {businesses.filter(b => b.status === "pending").length}
              </div>
              <p className="text-xs text-yellow-600 mt-1">Needs review</p>
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
              <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                ${businesses.reduce((sum, b) => sum + b.revenue, 0).toLocaleString()}
              </div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% this month
              </p>
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
                  placeholder="Search businesses, owners, or emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Businesses Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Businesses</CardTitle>
          <CardDescription>
            {filteredBusinesses.length} businesses found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stalls</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBusinesses.map((business, index) => (
                <motion.tr
                  key={business.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-slate-50"
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white text-xs">
                          {business.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{business.name}</div>
                        <div className="text-sm text-slate-500">{business.currency}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{business.ownerName}</div>
                      <div className="text-sm text-slate-500">{business.ownerEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(business.status)}>
                      {getStatusIcon(business.status)}
                      <span className="ml-1 capitalize">{business.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-1 text-slate-400" />
                      {business.stallsCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <ShoppingCart className="h-4 w-4 mr-1 text-slate-400" />
                      {business.productsCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-slate-400" />
                      {business.ordersCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      ${business.revenue.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-500">
                      {new Date(business.createdAt).toLocaleDateString()}
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
                          setSelectedBusiness(business)
                          setIsDetailDialogOpen(true)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Business
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Business
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

      {/* Business Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>{selectedBusiness?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Business details and management options
            </DialogDescription>
          </DialogHeader>
          {selectedBusiness && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedBusiness.status)}>
                      {getStatusIcon(selectedBusiness.status)}
                      <span className="ml-1 capitalize">{selectedBusiness.status}</span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Currency</Label>
                  <div className="mt-1 text-sm">{selectedBusiness.currency}</div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-slate-600">Owner Information</Label>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">{selectedBusiness.ownerName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">{selectedBusiness.ownerEmail}</span>
                  </div>
                  {selectedBusiness.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">{selectedBusiness.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Business Stats</Label>
                <div className="mt-2 grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-lg font-bold">{selectedBusiness.stallsCount}</div>
                    <div className="text-xs text-slate-500">Stalls</div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-lg font-bold">{selectedBusiness.productsCount}</div>
                    <div className="text-xs text-slate-500">Products</div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-lg font-bold">{selectedBusiness.ordersCount}</div>
                    <div className="text-xs text-slate-500">Orders</div>
                  </div>
                </div>
              </div>

              {selectedBusiness.description && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Description</Label>
                  <div className="mt-1 text-sm text-slate-700">{selectedBusiness.description}</div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-slate-600">Timeline</Label>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Created: {new Date(selectedBusiness.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Last Activity: {selectedBusiness.lastActivity}</span>
                  </div>
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
              Manage Business
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
