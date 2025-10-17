"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  Users,
  ShoppingCart,
  CheckCircle,
  Brain,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Activity,
  Zap,
  Target,
  Calendar,
  DollarSign,
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

interface OverviewStats {
  totalBusinesses: number
  activeUsers: number
  totalOrders: number
  pendingApprovals: number
  aiInsightsGenerated: number
  systemHealth: number
  weeklyGrowth: number
  monthlyRevenue: number
}

interface ActivityEvent {
  id: string
  type: "business_created" | "user_invited" | "order_placed" | "approval_pending" | "ai_insight"
  message: string
  timestamp: string
  actor: string
}

export default function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats>({
    totalBusinesses: 0,
    activeUsers: 0,
    totalOrders: 0,
    pendingApprovals: 0,
    aiInsightsGenerated: 0,
    systemHealth: 0,
    weeklyGrowth: 0,
    monthlyRevenue: 0,
  })
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call - replace with actual API call
    const fetchOverviewData = async () => {
      setLoading(true)
      try {
        // Mock data - replace with actual API calls
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setStats({
          totalBusinesses: 24,
          activeUsers: 156,
          totalOrders: 1247,
          pendingApprovals: 8,
          aiInsightsGenerated: 12,
          systemHealth: 98,
          weeklyGrowth: 15.3,
          monthlyRevenue: 45680,
        })

        setActivities([
          {
            id: "1",
            type: "business_created",
            message: "New business 'Golden Dragon Restaurant' registered",
            timestamp: "2 minutes ago",
            actor: "System"
          },
          {
            id: "2",
            type: "user_invited",
            message: "Invited chef@dragon.com as Stall Manager",
            timestamp: "15 minutes ago",
            actor: "Super Admin"
          },
          {
            id: "3",
            type: "order_placed",
            message: "Large order placed at 'Spice Garden' - $89.50",
            timestamp: "1 hour ago",
            actor: "Customer"
          },
          {
            id: "4",
            type: "approval_pending",
            message: "5 new products awaiting approval",
            timestamp: "2 hours ago",
            actor: "System"
          },
          {
            id: "5",
            type: "ai_insight",
            message: "AI detected peak ordering time: 7-8 PM",
            timestamp: "3 hours ago",
            actor: "AI System"
          }
        ])
      } catch (error) {
        console.error("Failed to fetch overview data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOverviewData()
  }, [])

  const getActivityIcon = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "business_created":
        return <Building2 className="h-4 w-4 text-green-500" />
      case "user_invited":
        return <Users className="h-4 w-4 text-blue-500" />
      case "order_placed":
        return <ShoppingCart className="h-4 w-4 text-purple-500" />
      case "approval_pending":
        return <CheckCircle className="h-4 w-4 text-orange-500" />
      case "ai_insight":
        return <Brain className="h-4 w-4 text-indigo-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityColor = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "business_created":
        return "bg-green-50 border-green-200"
      case "user_invited":
        return "bg-blue-50 border-blue-200"
      case "order_placed":
        return "bg-purple-50 border-purple-200"
      case "approval_pending":
        return "bg-orange-50 border-orange-200"
      case "ai_insight":
        return "bg-indigo-50 border-indigo-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Super Admin Dashboard
            </h1>
            <p className="text-slate-600 mt-1">Welcome back! Here's what's happening across XianFeast.</p>
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
            Super Admin Dashboard
          </h1>
          <p className="text-slate-600 mt-1">Welcome back! Here's what's happening across XianFeast.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
            <Activity className="h-3 w-3 mr-1" />
            System Healthy
          </Badge>
          <Button asChild>
            <Link href="/admin/dashboard/businesses">
              <Building2 className="h-4 w-4 mr-2" />
              Manage Businesses
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Businesses</CardTitle>
              <Building2 className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalBusinesses}</div>
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{stats.weeklyGrowth}% this week
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Users</CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.activeUsers}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center mt-1">
                <Activity className="h-3 w-3 mr-1" />
                12 online now
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalOrders.toLocaleString()}</div>
              <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                This month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Pending Approvals</CardTitle>
              <CheckCircle className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.pendingApprovals}</div>
              <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center mt-1">
                <Clock className="h-3 w-3 mr-1" />
                Needs attention
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                <Brain className="h-4 w-4 mr-2 text-indigo-500" />
                AI Insights Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.aiInsightsGenerated}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">This week</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">${stats.monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.2% from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.systemHealth}%</div>
              <Progress value={stats.systemHealth} className="mt-2" />
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">All systems operational</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Activity Timeline and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-slate-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest system events and user actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-slate-500">{activity.timestamp}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{activity.actor}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-slate-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start">
                <Link href="/admin/dashboard/businesses">
                  <Building2 className="h-4 w-4 mr-2" />
                  Invite Business Owner
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/admin/dashboard/users">
                  <Users className="h-4 w-4 mr-2" />
                  Add New User
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/admin/dashboard/approvals">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Review Approvals
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/admin/dashboard/analytics">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </Link>
              </Button>
              <Separator className="my-4" />
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/admin/dashboard/ai">
                  <Brain className="h-4 w-4 mr-2" />
                  Generate AI Report
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
