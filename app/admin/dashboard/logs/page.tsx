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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Search,
  Download,
  RefreshCw,
  Filter,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Clock,
  Calendar,
  User,
  Building2,
  ShoppingCart,
  Brain,
  Settings,
  Eye,
  Trash2,
} from "lucide-react"
import { motion } from "framer-motion"

interface LogEntry {
  id: string
  timestamp: string
  level: "info" | "warning" | "error" | "success"
  eventType: string
  actor: string
  target: string
  message: string
  details?: any
  businessId?: string
  userId?: string
  ipAddress?: string
  userAgent?: string
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      try {
        // Mock data - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setLogs([
          {
            id: "LOG-001",
            timestamp: "2024-10-16T19:45:23Z",
            level: "info",
            eventType: "user.login",
            actor: "dancangwe@gmail.com",
            target: "Authentication System",
            message: "User successfully logged in",
            businessId: undefined,
            userId: "1",
            ipAddress: "192.168.1.100",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          {
            id: "LOG-002",
            timestamp: "2024-10-16T19:42:15Z",
            level: "success",
            eventType: "order.created",
            actor: "john@example.com",
            target: "Order System",
            message: "New order created successfully",
            businessId: "1",
            userId: "2",
            details: {
              orderId: "ORD-001",
              totalAmount: 2450,
              itemsCount: 3
            }
          },
          {
            id: "LOG-003",
            timestamp: "2024-10-16T19:38:42Z",
            level: "warning",
            eventType: "business.inactive",
            actor: "System",
            target: "Mediterranean Bistro",
            message: "Business has been inactive for 3 days",
            businessId: "4",
            details: {
              lastActivity: "2024-10-13T15:30:00Z",
              daysInactive: 3
            }
          },
          {
            id: "LOG-004",
            timestamp: "2024-10-16T19:35:18Z",
            level: "error",
            eventType: "api.error",
            actor: "System",
            target: "Google Sheets API",
            message: "Failed to update product inventory",
            businessId: "2",
            details: {
              error: "Rate limit exceeded",
              retryCount: 3,
              endpoint: "/api/products/update"
            }
          },
          {
            id: "LOG-005",
            timestamp: "2024-10-16T19:30:55Z",
            level: "info",
            eventType: "product.approved",
            actor: "Super Admin",
            target: "Spicy Tofu Bowl",
            message: "Product approved for listing",
            businessId: "2",
            details: {
              productId: "PROD-123",
              approvedBy: "Super Admin"
            }
          },
          {
            id: "LOG-006",
            timestamp: "2024-10-16T19:25:33Z",
            level: "success",
            eventType: "business.created",
            actor: "Super Admin",
            target: "Sushi Master",
            message: "New business registered",
            businessId: "5",
            details: {
              businessName: "Sushi Master",
              ownerEmail: "owner@sushimaster.com"
            }
          },
          {
            id: "LOG-007",
            timestamp: "2024-10-16T19:20:12Z",
            level: "info",
            eventType: "ai.insight.generated",
            actor: "AI System",
            target: "Analytics Engine",
            message: "New AI insight generated",
            details: {
              insightType: "prediction",
              confidence: 87,
              category: "revenue"
            }
          },
          {
            id: "LOG-008",
            timestamp: "2024-10-16T19:15:47Z",
            level: "warning",
            eventType: "user.mfa.failed",
            actor: "chef@spicegarden.com",
            target: "Authentication System",
            message: "MFA verification failed",
            businessId: "2",
            userId: "3",
            details: {
              attempts: 2,
              maxAttempts: 3
            }
          },
          {
            id: "LOG-009",
            timestamp: "2024-10-16T19:10:29Z",
            level: "error",
            eventType: "webhook.failed",
            actor: "System",
            target: "Webhook System",
            message: "Webhook delivery failed",
            businessId: "1",
            details: {
              webhookUrl: "https://example.com/webhook",
              statusCode: 500,
              retryCount: 2
            }
          },
          {
            id: "LOG-010",
            timestamp: "2024-10-16T19:05:14Z",
            level: "success",
            eventType: "user.invited",
            actor: "Super Admin",
            target: "User Management",
            message: "User invitation sent",
            details: {
              invitedEmail: "newuser@example.com",
              role: "stall_manager",
              businessId: "1"
            }
          }
        ])
      } catch (error) {
        console.error("Failed to fetch logs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.eventType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = levelFilter === "all" || log.level === levelFilter
    const matchesEventType = eventTypeFilter === "all" || log.eventType === eventTypeFilter
    const matchesDate = dateFilter === "all" || 
      (dateFilter === "today" && new Date(log.timestamp).toDateString() === new Date().toDateString()) ||
      (dateFilter === "week" && new Date(log.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    
    return matchesSearch && matchesLevel && matchesEventType && matchesDate
  })

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "info":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
      case "success":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
      case "warning":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
      case "error":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
    }
  }

  const getLevelIcon = (level: LogEntry["level"]) => {
    switch (level) {
      case "info":
        return <Info className="h-3 w-3" />
      case "success":
        return <CheckCircle className="h-3 w-3" />
      case "warning":
        return <AlertTriangle className="h-3 w-3" />
      case "error":
        return <XCircle className="h-3 w-3" />
      default:
        return <Info className="h-3 w-3" />
    }
  }

  const getEventTypeIcon = (eventType: string) => {
    if (eventType.includes("user")) return <User className="h-4 w-4" />
    if (eventType.includes("business")) return <Building2 className="h-4 w-4" />
    if (eventType.includes("order")) return <ShoppingCart className="h-4 w-4" />
    if (eventType.includes("ai")) return <Brain className="h-4 w-4" />
    if (eventType.includes("api")) return <Settings className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              System Logs
            </h1>
            <p className="text-slate-600 mt-1">Monitor system events and activities</p>
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
            System Logs
          </h1>
          <p className="text-slate-600 mt-1">Monitor system events and activities</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Log Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Logs</CardTitle>
              <FileText className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{logs.length}</div>
              <p className="text-xs text-slate-500 mt-1">All time</p>
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
              <CardTitle className="text-sm font-medium text-slate-600">Errors</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {logs.filter(l => l.level === "error").length}
              </div>
              <p className="text-xs text-red-600 mt-1">Need attention</p>
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
              <CardTitle className="text-sm font-medium text-slate-600">Warnings</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {logs.filter(l => l.level === "warning").length}
              </div>
              <p className="text-xs text-yellow-600 mt-1">Monitor closely</p>
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
              <CardTitle className="text-sm font-medium text-slate-600">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {Math.round((logs.filter(l => l.level === "success").length / logs.length) * 100)}%
              </div>
              <p className="text-xs text-green-600 mt-1">System health</p>
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
                  placeholder="Search logs by message, actor, target, or event type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-48">
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="user">User Events</SelectItem>
                  <SelectItem value="business">Business Events</SelectItem>
                  <SelectItem value="order">Order Events</SelectItem>
                  <SelectItem value="api">API Events</SelectItem>
                  <SelectItem value="ai">AI Events</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-48">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Logs</CardTitle>
          <CardDescription>
            {filteredLogs.length} log entries found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log, index) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-slate-50"
                >
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-mono">{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getLevelColor(log.level)}>
                      {getLevelIcon(log.level)}
                      <span className="ml-1 capitalize">{log.level}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getEventTypeIcon(log.eventType)}
                      <span className="text-sm">{log.eventType}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{log.actor}</div>
                    {log.ipAddress && (
                      <div className="text-xs text-slate-500">{log.ipAddress}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{log.target}</div>
                    {log.businessId && (
                      <div className="text-xs text-slate-500">Business: {log.businessId}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm max-w-xs truncate">{log.message}</div>
                    {log.details && (
                      <div className="text-xs text-slate-500">Has details</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Summary</CardTitle>
          <CardDescription>Key events from the last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-800 dark:text-green-300">Successful Events</span>
                </div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-200">
                  {logs.filter(l => l.level === "success" && new Date(l.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">In last 24h</div>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                <div className="flex items-center space-x-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="font-medium text-red-800 dark:text-red-300">Errors</span>
                </div>
                <div className="text-2xl font-bold text-red-900 dark:text-red-200">
                  {logs.filter(l => l.level === "error" && new Date(l.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">Need attention</div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-800 dark:text-blue-300">User Actions</span>
                </div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                  {logs.filter(l => l.eventType.includes("user") && new Date(l.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">User activities</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
              <h4 className="font-medium mb-2 text-slate-900 dark:text-slate-100">Most Frequent Events</h4>
              <div className="space-y-2">
                {logs.reduce((acc, log) => {
                  const event = log.eventType
                  acc[event] = (acc[event] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([event, count]) => (
                  <div key={event} className="flex items-center justify-between">
                    <span className="text-sm">{event}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
