"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Save, Edit, X, Settings } from "lucide-react"

interface Business {
  id: string
  name: string
  description: string
  address: string
  phone: string
  email: string
  owner_user_id: string
  status: string
  created_at: string
  updated_at: string
  settings_json: string
}

interface BusinessInfoTabProps {
  business: Business
  onUpdate: (updatedBusiness: Business) => void
}

export function BusinessInfoTab({ business, onUpdate }: BusinessInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: business.name,
    description: business.description || "",
    address: business.address || "",
    phone: business.phone || "",
    email: business.email || "",
    status: business.status
  })
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/businesses/${business.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        onUpdate(data.business)
        setIsEditing(false)
        toast({
          title: "Success",
          description: "Business information updated successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update business",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update business information",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: business.name,
      description: business.description || "",
      address: business.address || "",
      phone: business.phone || "",
      email: business.email || "",
      status: business.status
    })
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm border border-border/50 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-muted/30 to-muted/10 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                Business Information
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium mt-2">
                Manage basic business details and contact information
              </CardDescription>
            </div>
            {!isEditing ? (
              <Button 
                onClick={() => setIsEditing(true)} 
                variant="outline"
                className="bg-gradient-to-r from-primary/10 to-orange-500/10 border-primary/20 hover:from-primary/20 hover:to-orange-500/20 hover:border-primary/30 transition-all duration-200"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Saving..." : "Save"}
                </Button>
                <Button 
                  onClick={handleCancel} 
                  variant="outline" 
                  disabled={loading}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-semibold text-foreground">Business Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter business name"
                  className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                />
              ) : (
                <div className="bg-muted/30 border border-border/30 rounded-md p-3">
                  <p className="text-sm font-medium text-foreground">{business.name}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="status" className="text-sm font-semibold text-foreground">Status</Label>
              {isEditing ? (
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="bg-muted/30 border border-border/30 rounded-md p-3">
                  <Badge 
                    variant={business.status === "active" ? "default" : "secondary"}
                    className={`${
                      business.status === "active" 
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" 
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {business.status.toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter business email"
                  className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                />
              ) : (
                <div className="bg-muted/30 border border-border/30 rounded-md p-3">
                  <p className="text-sm font-medium text-foreground">{business.email || "Not provided"}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="phone" className="text-sm font-semibold text-foreground">Phone</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                  className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                />
              ) : (
                <div className="bg-muted/30 border border-border/30 rounded-md p-3">
                  <p className="text-sm font-medium text-foreground">{business.phone || "Not provided"}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-semibold text-foreground">Description</Label>
            {isEditing ? (
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter business description"
                rows={3}
                className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 resize-none"
              />
            ) : (
              <div className="bg-muted/30 border border-border/30 rounded-md p-3 min-h-[80px]">
                <p className="text-sm font-medium text-foreground">{business.description || "No description provided"}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="address" className="text-sm font-semibold text-foreground">Address</Label>
            {isEditing ? (
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter business address"
                rows={2}
                className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 resize-none"
              />
            ) : (
              <div className="bg-muted/30 border border-border/30 rounded-md p-3 min-h-[60px]">
                <p className="text-sm font-medium text-foreground">{business.address || "No address provided"}</p>
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border/30">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground">Created</Label>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-md p-3">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {new Date(business.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground">Last Updated</Label>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200/50 dark:border-green-800/50 rounded-md p-3">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    {new Date(business.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}