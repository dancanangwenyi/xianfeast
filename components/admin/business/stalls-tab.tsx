"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Store, Edit, Trash2, MapPin, Clock } from "lucide-react"

interface Stall {
  id: string
  business_id: string
  name: string
  description: string
  pickup_address: string
  open_hours_json: string
  capacity_per_day: number
  status: string
  created_at: string
  updated_at: string
}

interface StallsTabProps {
  businessId: string
}

export function StallsTab({ businessId }: StallsTabProps) {
  const [stalls, setStalls] = useState<Stall[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingStall, setEditingStall] = useState<Stall | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pickup_address: "",
    capacity_per_day: 100,
    status: "active"
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchStalls()
  }, [businessId])

  const fetchStalls = async () => {
    try {
      const response = await fetch(`/api/stalls?businessId=${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setStalls(data.stalls || [])
      }
    } catch (error) {
      console.error("Error fetching stalls:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      pickup_address: "",
      capacity_per_day: 100,
      status: "active"
    })
    setEditingStall(null)
  }

  const handleCreateStall = async () => {
    try {
      const response = await fetch("/api/stalls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          name: formData.name,
          description: formData.description,
          pickupAddress: formData.pickup_address,
          capacityPerDay: formData.capacity_per_day,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Stall created successfully",
        })
        setIsCreateDialogOpen(false)
        resetForm()
        fetchStalls()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create stall",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create stall",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStall = async () => {
    if (!editingStall) return

    try {
      const response = await fetch(`/api/stalls/${editingStall.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Stall updated successfully",
        })
        resetForm()
        fetchStalls()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update stall",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update stall",
        variant: "destructive",
      })
    }
  }

  const handleDeleteStall = async (stallId: string) => {
    if (!confirm("Are you sure you want to delete this stall? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/stalls/${stallId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Stall deleted successfully",
        })
        fetchStalls()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete stall",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete stall",
        variant: "destructive",
      })
    }
  }

  const startEdit = (stall: Stall) => {
    setEditingStall(stall)
    setFormData({
      name: stall.name,
      description: stall.description,
      pickup_address: stall.pickup_address,
      capacity_per_day: stall.capacity_per_day,
      status: stall.status
    })
  }

  if (loading) {
    return <div>Loading stalls...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-card via-card to-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Store className="h-4 w-4 text-white" />
              </div>
              Stalls Management
            </h3>
            <p className="text-sm text-muted-foreground font-medium mt-2">
              Manage stalls, vendor spaces, and categories for this business
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white shadow-md">
                <Plus className="mr-2 h-4 w-4" />
                Add Stall
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Stall</DialogTitle>
              <DialogDescription>
                Add a new stall, vendor space, or category to this business
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stall-name">Stall Name</Label>
                <Input
                  id="stall-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Vegetarian Kitchen, Desserts Corner"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stall-description">Description</Label>
                <Textarea
                  id="stall-description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe what this stall offers"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickup-address">Pickup Address</Label>
                <Textarea
                  id="pickup-address"
                  value={formData.pickup_address}
                  onChange={(e) => handleInputChange("pickup_address", e.target.value)}
                  placeholder="Where customers can pick up orders"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Daily Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity_per_day}
                  onChange={(e) => handleInputChange("capacity_per_day", parseInt(e.target.value))}
                  placeholder="Maximum orders per day"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateStall}>Create Stall</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      </div>

      {stalls.length === 0 ? (
        <Card className="bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm border border-border/50 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Store className="h-8 w-8 text-white" />
            </div>
            <p className="mb-6 text-muted-foreground font-medium text-lg">No stalls yet</p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white shadow-md"
            >
              Create your first stall
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stalls.map((stall) => (
            <Card key={stall.id} className="bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-muted/20 to-muted/5 border-b border-border/30">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
                        <Store className="h-3 w-3 text-white" />
                      </div>
                      {stall.name}
                    </CardTitle>
                    <CardDescription className="mt-2 font-medium">
                      {stall.description || "No description"}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={stall.status === "active" ? "default" : "secondary"}
                    className={`${
                      stall.status === "active" 
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md" 
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {stall.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {stall.pickup_address && (
                  <div className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-lg p-3">
                    <MapPin className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">{stall.pickup_address}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200/50 dark:border-green-800/50 rounded-lg p-3">
                  <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                    Capacity: {stall.capacity_per_day} orders/day
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(stall)}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteStall(stall.id)}
                    className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:from-red-100 hover:to-rose-100 dark:hover:from-red-900/50 dark:hover:to-rose-900/50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingStall} onOpenChange={() => resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stall</DialogTitle>
            <DialogDescription>
              Update stall information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-stall-name">Stall Name</Label>
              <Input
                id="edit-stall-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-stall-description">Description</Label>
              <Textarea
                id="edit-stall-description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pickup-address">Pickup Address</Label>
              <Textarea
                id="edit-pickup-address"
                value={formData.pickup_address}
                onChange={(e) => handleInputChange("pickup_address", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-capacity">Daily Capacity</Label>
              <Input
                id="edit-capacity"
                type="number"
                value={formData.capacity_per_day}
                onChange={(e) => handleInputChange("capacity_per_day", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStall}>Update Stall</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}