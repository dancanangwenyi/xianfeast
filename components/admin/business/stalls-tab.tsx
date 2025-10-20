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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Stalls Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage stalls, vendor spaces, and categories for this business
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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

      {stalls.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">No stalls yet</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Create your first stall
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stalls.map((stall) => (
            <Card key={stall.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      {stall.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {stall.description || "No description"}
                    </CardDescription>
                  </div>
                  <Badge variant={stall.status === "active" ? "default" : "secondary"}>
                    {stall.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {stall.pickup_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{stall.pickup_address}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Capacity: {stall.capacity_per_day} orders/day
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(stall)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteStall(stall.id)}
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