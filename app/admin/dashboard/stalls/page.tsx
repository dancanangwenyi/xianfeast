"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  Filter,
  MapPin,
  Clock,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { motion } from "framer-motion"
import { formatPrice } from "@/lib/currency"

interface Stall {
  id: string
  business_id: string
  business_name?: string
  name: string
  description: string
  pickup_address: string
  open_hours_json: string
  capacity_per_day: number
  created_at: string
  status: "active" | "disabled"
}

interface Business {
  id: string
  name: string
}

export default function StallsPage() {
  const [stalls, setStalls] = useState<Stall[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [businessFilter, setBusinessFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    fetchStalls()
    fetchBusinesses()
  }, [])

  const fetchStalls = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/stalls")
      const data = await response.json()
      setStalls(data.stalls || [])
    } catch (error) {
      console.error("Failed to fetch stalls:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBusinesses = async () => {
    try {
      const response = await fetch("/api/admin/businesses")
      const data = await response.json()
      setBusinesses(data.businesses || [])
    } catch (error) {
      console.error("Failed to fetch businesses:", error)
    }
  }

  const filteredStalls = stalls.filter((stall) => {
    const matchesSearch = stall.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stall.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stall.pickup_address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBusiness = businessFilter === "all" || stall.business_id === businessFilter
    const matchesStatus = statusFilter === "all" || stall.status === statusFilter
    
    return matchesSearch && matchesBusiness && matchesStatus
  })

  const getStatusColor = (status: Stall["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
      case "disabled":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
    }
  }

  const getStatusIcon = (status: Stall["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-3 w-3" />
      case "disabled":
        return <XCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const formatOpenHours = (openHoursJson: string) => {
    try {
      const hours = JSON.parse(openHoursJson)
      if (hours && typeof hours === 'object') {
        return Object.entries(hours)
          .map(([day, time]) => `${day}: ${time}`)
          .join(', ')
      }
    } catch (error) {
      // Invalid JSON, return as is
    }
    return openHoursJson || "Not set"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Stalls Management
            </h1>
            <p className="text-slate-600 mt-1">Manage food stalls and their operations</p>
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
            Stalls Management
          </h1>
          <p className="text-slate-600 mt-1">Manage food stalls and their operations</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Stall
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Stall</DialogTitle>
              <DialogDescription>
                Set up a new food stall for a business
              </DialogDescription>
            </DialogHeader>
            <CreateStallForm 
              businesses={businesses}
              onSuccess={() => {
                setIsCreateModalOpen(false)
                fetchStalls()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Stalls</CardTitle>
              <Building2 className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stalls.length}</div>
              <p className="text-xs text-slate-500 mt-1">Across all businesses</p>
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
              <CardTitle className="text-sm font-medium text-slate-600">Active Stalls</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stalls.filter(s => s.status === "active").length}
              </div>
              <p className="text-xs text-green-600 mt-1">Currently operating</p>
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
              <CardTitle className="text-sm font-medium text-slate-600">Total Capacity</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stalls.reduce((sum, s) => sum + s.capacity_per_day, 0)}
              </div>
              <p className="text-xs text-blue-600 mt-1">Orders per day</p>
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
              <CardTitle className="text-sm font-medium text-slate-600">Businesses</CardTitle>
              <Building2 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{businesses.length}</div>
              <p className="text-xs text-purple-600 mt-1">With stalls</p>
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
                  placeholder="Search stalls by name, description, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={businessFilter} onValueChange={setBusinessFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by business" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Businesses</SelectItem>
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name}
                    </SelectItem>
                  ))}
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
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stalls Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stalls</CardTitle>
          <CardDescription>
            {filteredStalls.length} stalls found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStalls.map((stall, index) => (
                <motion.tr
                  key={stall.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{stall.name}</div>
                      <div className="text-sm text-slate-500 truncate max-w-xs">
                        {stall.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {businesses.find(b => b.id === stall.business_id)?.name || "Unknown"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="text-sm max-w-xs truncate">{stall.pickup_address}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">{stall.capacity_per_day}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(stall.status)}>
                      {getStatusIcon(stall.status)}
                      <span className="ml-1 capitalize">{stall.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(stall.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setSelectedStall(stall)
                          setIsDetailModalOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stall Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Stall Details</DialogTitle>
            <DialogDescription>
              Complete information about this stall
            </DialogDescription>
          </DialogHeader>
          {selectedStall && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Name</label>
                  <p className="text-sm">{selectedStall.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Status</label>
                  <Badge className={getStatusColor(selectedStall.status)}>
                    {getStatusIcon(selectedStall.status)}
                    <span className="ml-1 capitalize">{selectedStall.status}</span>
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Description</label>
                <p className="text-sm">{selectedStall.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Pickup Address</label>
                <p className="text-sm">{selectedStall.pickup_address}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Open Hours</label>
                <p className="text-sm">{formatOpenHours(selectedStall.open_hours_json)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Daily Capacity</label>
                <p className="text-sm">{selectedStall.capacity_per_day} orders</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Created</label>
                <p className="text-sm">{new Date(selectedStall.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Create Stall Form Component
function CreateStallForm({ businesses, onSuccess }: { businesses: Business[], onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    businessId: "",
    name: "",
    description: "",
    pickupAddress: "",
    capacityPerDay: 100,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/stalls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: formData.businessId,
          name: formData.name,
          description: formData.description,
          pickupAddress: formData.pickupAddress,
          capacityPerDay: formData.capacityPerDay,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create stall")
        return
      }

      onSuccess()
    } catch (err) {
      setError("An error occurred while creating the stall")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600">Business</label>
        <Select value={formData.businessId} onValueChange={(value) => setFormData({ ...formData, businessId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select a business" />
          </SelectTrigger>
          <SelectContent>
            {businesses.map((business) => (
              <SelectItem key={business.id} value={business.id}>
                {business.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600">Stall Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter stall name"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600">Description</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the stall"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600">Pickup Address</label>
        <Input
          value={formData.pickupAddress}
          onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
          placeholder="Address where customers can pick up orders"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600">Daily Capacity</label>
        <Input
          type="number"
          value={formData.capacityPerDay}
          onChange={(e) => setFormData({ ...formData, capacityPerDay: parseInt(e.target.value) || 100 })}
          placeholder="100"
          min="1"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Creating..." : "Create Stall"}
        </Button>
      </div>
    </form>
  )
}
