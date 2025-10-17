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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CheckCircle,
  Search,
  MoreHorizontal,
  Eye,
  XCircle,
  Clock,
  Building2,
  Package,
  Image,
  User,
  Calendar,
  Check,
  X,
  AlertTriangle,
  Shield,
  Zap,
} from "lucide-react"
import { motion } from "framer-motion"

interface ApprovalItem {
  id: string
  type: "product" | "image" | "business" | "user"
  title: string
  description: string
  status: "pending" | "approved" | "rejected"
  submittedBy: string
  submittedByEmail: string
  businessId?: string
  businessName?: string
  submittedAt: string
  priority: "low" | "medium" | "high"
  metadata?: any
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null)

  useEffect(() => {
    const fetchApprovals = async () => {
      setLoading(true)
      try {
        // Mock data - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setApprovals([
          {
            id: "APP-001",
            type: "product",
            title: "New Product: Spicy Tofu Bowl",
            description: "A delicious vegan option with marinated tofu, vegetables, and spicy sauce",
            status: "pending",
            submittedBy: "Priya Sharma",
            submittedByEmail: "chef@spicegarden.com",
            businessId: "2",
            businessName: "Spice Garden",
            submittedAt: "2024-10-16T18:30:00Z",
            priority: "medium",
            metadata: {
              price: 12.99,
              category: "Main Course",
              prepTime: 15,
              ingredients: ["Tofu", "Vegetables", "Spicy Sauce", "Rice"]
            }
          },
          {
            id: "APP-002",
            type: "image",
            title: "Product Image: Kung Pao Chicken",
            description: "High-quality image for the Kung Pao Chicken product",
            status: "pending",
            submittedBy: "Li Wei",
            submittedByEmail: "owner@goldendragon.com",
            businessId: "1",
            businessName: "Golden Dragon Restaurant",
            submittedAt: "2024-10-16T17:45:00Z",
            priority: "high",
            metadata: {
              imageUrl: "/placeholder.jpg",
              productId: "PROD-001",
              dimensions: "1200x800"
            }
          },
          {
            id: "APP-003",
            type: "business",
            title: "New Business: Sushi Master",
            description: "Traditional Japanese sushi restaurant with fresh ingredients",
            status: "pending",
            submittedBy: "Hiroshi Tanaka",
            submittedByEmail: "manager@tokyosushi.com",
            submittedAt: "2024-10-16T16:20:00Z",
            priority: "high",
            metadata: {
              address: "456 Sushi St, Tokyo, JP",
              phone: "+81-3-1234-5678",
              cuisine: "Japanese",
              capacity: 50
            }
          },
          {
            id: "APP-004",
            type: "product",
            title: "New Product: Mango Lassi",
            description: "Refreshing yogurt drink with fresh mango",
            status: "approved",
            submittedBy: "Priya Sharma",
            submittedByEmail: "chef@spicegarden.com",
            businessId: "2",
            businessName: "Spice Garden",
            submittedAt: "2024-10-15T14:30:00Z",
            priority: "low",
            metadata: {
              price: 4.99,
              category: "Beverage",
              prepTime: 5,
              ingredients: ["Mango", "Yogurt", "Sugar", "Cardamom"]
            }
          },
          {
            id: "APP-005",
            type: "user",
            title: "New User: Chef Assistant",
            description: "Request to add a new chef assistant to the team",
            status: "rejected",
            submittedBy: "Li Wei",
            submittedByEmail: "owner@goldendragon.com",
            businessId: "1",
            businessName: "Golden Dragon Restaurant",
            submittedAt: "2024-10-15T10:15:00Z",
            priority: "medium",
            metadata: {
              userEmail: "assistant@goldendragon.com",
              role: "chef_assistant",
              reason: "Insufficient documentation"
            }
          },
          {
            id: "APP-006",
            type: "image",
            title: "Product Image: Butter Chicken",
            description: "Professional food photography for Butter Chicken",
            status: "pending",
            submittedBy: "Priya Sharma",
            submittedByEmail: "chef@spicegarden.com",
            businessId: "2",
            businessName: "Spice Garden",
            submittedAt: "2024-10-16T15:10:00Z",
            priority: "medium",
            metadata: {
              imageUrl: "/placeholder.jpg",
              productId: "PROD-002",
              dimensions: "1200x800"
            }
          }
        ])
      } catch (error) {
        console.error("Failed to fetch approvals:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchApprovals()
  }, [])

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = approval.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          approval.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          approval.submittedBy.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || approval.type === typeFilter
    const matchesStatus = statusFilter === "all" || approval.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const getTypeColor = (type: ApprovalItem["type"]) => {
    switch (type) {
      case "product":
        return "bg-green-100 text-green-800 border-green-200"
      case "image":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "business":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "user":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeIcon = (type: ApprovalItem["type"]) => {
    switch (type) {
      case "product":
        return <Package className="h-3 w-3" />
      case "image":
        return <Image className="h-3 w-3" />
      case "business":
        return <Building2 className="h-3 w-3" />
      case "user":
        return <User className="h-3 w-3" />
      default:
        return <Package className="h-3 w-3" />
    }
  }

  const getStatusColor = (status: ApprovalItem["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800"
    }
  }

  const getStatusIcon = (status: ApprovalItem["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3" />
      case "approved":
        return <CheckCircle className="h-3 w-3" />
      case "rejected":
        return <XCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getPriorityColor = (priority: ApprovalItem["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleApprove = async (id: string) => {
    try {
      // Mock API call - replace with actual API call
      console.log("Approving item:", id)
      setApprovals(prev => prev.map(item => 
        item.id === id ? { ...item, status: "approved" as const } : item
      ))
    } catch (error) {
      console.error("Failed to approve item:", error)
    }
  }

  const handleReject = async (id: string) => {
    try {
      // Mock API call - replace with actual API call
      console.log("Rejecting item:", id)
      setApprovals(prev => prev.map(item => 
        item.id === id ? { ...item, status: "rejected" as const } : item
      ))
    } catch (error) {
      console.error("Failed to reject item:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Approvals Management
            </h1>
            <p className="text-slate-600 mt-1">Review and approve pending items across the platform</p>
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
            Approvals Management
          </h1>
          <p className="text-slate-600 mt-1">Review and approve pending items across the platform</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Batch Approve
          </Button>
        </div>
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
              <CardTitle className="text-sm font-medium text-slate-600">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {approvals.filter(a => a.status === "pending").length}
              </div>
              <p className="text-xs text-yellow-600 mt-1">Awaiting review</p>
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
              <CardTitle className="text-sm font-medium text-slate-600">Approved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {approvals.filter(a => a.status === "approved").length}
              </div>
              <p className="text-xs text-green-600 mt-1">Successfully approved</p>
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
              <CardTitle className="text-sm font-medium text-slate-600">High Priority</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {approvals.filter(a => a.priority === "high" && a.status === "pending").length}
              </div>
              <p className="text-xs text-red-600 mt-1">Urgent attention</p>
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
              <CardTitle className="text-sm font-medium text-slate-600">Total Items</CardTitle>
              <Shield className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{approvals.length}</div>
              <p className="text-xs text-slate-500 mt-1">All time</p>
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
                  placeholder="Search approvals by title, description, or submitter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="product">Products</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="business">Businesses</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approvals Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Approvals</CardTitle>
          <CardDescription>
            {filteredApprovals.length} items found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApprovals.map((approval, index) => (
                <motion.tr
                  key={approval.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-slate-50"
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{approval.title}</div>
                      <div className="text-sm text-slate-500 truncate max-w-xs">
                        {approval.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(approval.type)}>
                      {getTypeIcon(approval.type)}
                      <span className="ml-1 capitalize">{approval.type}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(approval.priority)}>
                      <span className="capitalize">{approval.priority}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(approval.status)}>
                      {getStatusIcon(approval.status)}
                      <span className="ml-1 capitalize">{approval.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                          {approval.submittedBy.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{approval.submittedBy}</div>
                        <div className="text-xs text-slate-500">{approval.submittedByEmail}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {approval.businessName ? (
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-1 text-slate-400" />
                        <span className="text-sm">{approval.businessName}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-500">
                      {new Date(approval.submittedAt).toLocaleDateString()}
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
                          setSelectedApproval(approval)
                          setIsDetailDialogOpen(true)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {approval.status === "pending" && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => handleApprove(approval.id)}
                              className="text-green-600"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleReject(approval.id)}
                              className="text-red-600"
                            >
                              <X className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approval Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>{selectedApproval?.title}</span>
            </DialogTitle>
            <DialogDescription>
              Review details and make approval decision
            </DialogDescription>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-slate-600 mb-2">Type & Priority</h4>
                  <div className="flex space-x-2">
                    <Badge className={getTypeColor(selectedApproval.type)}>
                      {getTypeIcon(selectedApproval.type)}
                      <span className="ml-1 capitalize">{selectedApproval.type}</span>
                    </Badge>
                    <Badge className={getPriorityColor(selectedApproval.priority)}>
                      <span className="capitalize">{selectedApproval.priority}</span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-slate-600 mb-2">Status</h4>
                  <Badge className={getStatusColor(selectedApproval.status)}>
                    {getStatusIcon(selectedApproval.status)}
                    <span className="ml-1 capitalize">{selectedApproval.status}</span>
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-600 mb-2">Description</h4>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm">{selectedApproval.description}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-600 mb-2">Submitted By</h4>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {selectedApproval.submittedBy.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{selectedApproval.submittedBy}</div>
                    <div className="text-sm text-slate-500">{selectedApproval.submittedByEmail}</div>
                  </div>
                </div>
              </div>

              {selectedApproval.businessName && (
                <div>
                  <h4 className="font-medium text-slate-600 mb-2">Business</h4>
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 text-slate-400 mr-2" />
                    <span className="text-sm">{selectedApproval.businessName}</span>
                  </div>
                </div>
              )}

              {selectedApproval.metadata && (
                <div>
                  <h4 className="font-medium text-slate-600 mb-2">Additional Details</h4>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedApproval.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium text-slate-600 mb-2">Timeline</h4>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Submitted: {new Date(selectedApproval.submittedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
            {selectedApproval?.status === "pending" && (
              <>
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    handleReject(selectedApproval.id)
                    setIsDetailDialogOpen(false)
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    handleApprove(selectedApproval.id)
                    setIsDetailDialogOpen(false)
                  }}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
