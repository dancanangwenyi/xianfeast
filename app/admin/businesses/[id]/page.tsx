"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Building2, Store, Package, Users, ShoppingCart, BarChart3, Settings } from "lucide-react"
import Link from "next/link"

import { BusinessInfoTab } from "@/components/admin/business/business-info-tab"
import { StallsTab } from "@/components/admin/business/stalls-tab"
import { ProductsTab } from "@/components/admin/business/products-tab"
import { UsersTab } from "@/components/admin/business/users-tab"
import { OrdersTab } from "@/components/admin/business/orders-tab"
import { AnalyticsTab } from "@/components/admin/business/analytics-tab"

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

export default function BusinessManagePage() {
    const params = useParams()
    const businessId = params.id as string
    const [business, setBusiness] = useState<Business | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("info")

    useEffect(() => {
        if (businessId) {
            fetchBusiness()
        }
    }, [businessId])

    const fetchBusiness = async () => {
        try {
            const response = await fetch(`/api/businesses/${businessId}`)
            if (response.ok) {
                const data = await response.json()
                setBusiness(data.business)
            } else {
                console.error("Failed to fetch business")
            }
        } catch (error) {
            console.error("Error fetching business:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleBusinessUpdate = (updatedBusiness: Business) => {
        setBusiness(updatedBusiness)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="mx-auto max-w-7xl">
                    <p>Loading business...</p>
                </div>
            </div>
        )
    }

    if (!business) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="mx-auto max-w-7xl">
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
                            <p className="mb-4 text-muted-foreground">Business not found</p>
                            <Link href="/admin/businesses">
                                <Button>Back to Businesses</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Link href="/admin/businesses">
                            <Button variant="ghost" size="sm" className="hover:bg-accent/50 transition-colors">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Businesses
                            </Button>
                        </Link>
                    </div>

                    <div className="bg-gradient-to-r from-card via-card to-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
                                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                                        <Building2 className="h-6 w-6 text-white" />
                                    </div>
                                    {business.name}
                                </h1>
                                <p className="mt-3 text-muted-foreground font-medium">
                                    Comprehensive business management dashboard
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge 
                                    variant={business.status === "active" ? "default" : "secondary"}
                                    className={`px-3 py-1 font-semibold ${
                                        business.status === "active" 
                                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md" 
                                            : "bg-muted text-muted-foreground"
                                    }`}
                                >
                                    {business.status.toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Business Management Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-2 shadow-lg">
                        <TabsList className="grid w-full grid-cols-6 bg-transparent gap-1">
                            <TabsTrigger 
                                value="info" 
                                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-accent/50"
                            >
                                <Settings className="h-4 w-4" />
                                Info
                            </TabsTrigger>
                            <TabsTrigger 
                                value="stalls" 
                                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-accent/50"
                            >
                                <Store className="h-4 w-4" />
                                Stalls
                            </TabsTrigger>
                            <TabsTrigger 
                                value="products" 
                                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-accent/50"
                            >
                                <Package className="h-4 w-4" />
                                Products
                            </TabsTrigger>
                            <TabsTrigger 
                                value="users" 
                                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-accent/50"
                            >
                                <Users className="h-4 w-4" />
                                Users
                            </TabsTrigger>
                            <TabsTrigger 
                                value="orders" 
                                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-accent/50"
                            >
                                <ShoppingCart className="h-4 w-4" />
                                Orders
                            </TabsTrigger>
                            <TabsTrigger 
                                value="analytics" 
                                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-accent/50"
                            >
                                <BarChart3 className="h-4 w-4" />
                                Analytics
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="info">
                        <BusinessInfoTab
                            business={business}
                            onUpdate={handleBusinessUpdate}
                        />
                    </TabsContent>

                    <TabsContent value="stalls">
                        <StallsTab businessId={businessId} />
                    </TabsContent>

                    <TabsContent value="products">
                        <ProductsTab businessId={businessId} />
                    </TabsContent>

                    <TabsContent value="users">
                        <UsersTab businessId={businessId} />
                    </TabsContent>

                    <TabsContent value="orders">
                        <OrdersTab businessId={businessId} />
                    </TabsContent>

                    <TabsContent value="analytics">
                        <AnalyticsTab businessId={businessId} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}