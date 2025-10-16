"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Building2,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  Target,
  Zap,
} from "lucide-react"
import { motion } from "framer-motion"

// Mock data for charts
const ordersData = [
  { date: "2024-10-10", orders: 45, revenue: 1200 },
  { date: "2024-10-11", orders: 52, revenue: 1350 },
  { date: "2024-10-12", orders: 38, revenue: 980 },
  { date: "2024-10-13", orders: 67, revenue: 1680 },
  { date: "2024-10-14", orders: 73, revenue: 1850 },
  { date: "2024-10-15", orders: 58, revenue: 1420 },
  { date: "2024-10-16", orders: 62, revenue: 1560 },
]

const businessPerformanceData = [
  { name: "Golden Dragon", orders: 234, revenue: 15680, growth: 12.5 },
  { name: "Spice Garden", orders: 189, revenue: 12340, growth: 8.3 },
  { name: "Tokyo Sushi", orders: 67, revenue: 4560, growth: -2.1 },
  { name: "Med Bistro", orders: 0, revenue: 0, growth: -15.2 },
]

const businessStatusData = [
  { name: "Active", value: 3, color: "#10b981" },
  { name: "Pending", value: 1, color: "#f59e0b" },
  { name: "Disabled", value: 1, color: "#ef4444" },
]

const topProductsData = [
  { name: "Kung Pao Chicken", orders: 45, revenue: 5400 },
  { name: "Chicken Biryani", orders: 38, revenue: 5700 },
  { name: "Salmon Roll", orders: 32, revenue: 5760 },
  { name: "Butter Chicken", orders: 28, revenue: 4480 },
  { name: "Sweet & Sour Pork", orders: 25, revenue: 3500 },
]

const hourlyData = [
  { hour: "6AM", orders: 2 },
  { hour: "7AM", orders: 5 },
  { hour: "8AM", orders: 8 },
  { hour: "9AM", orders: 12 },
  { hour: "10AM", orders: 15 },
  { hour: "11AM", orders: 18 },
  { hour: "12PM", orders: 25 },
  { hour: "1PM", orders: 22 },
  { hour: "2PM", orders: 15 },
  { hour: "3PM", orders: 12 },
  { hour: "4PM", orders: 18 },
  { hour: "5PM", orders: 28 },
  { hour: "6PM", orders: 35 },
  { hour: "7PM", orders: 42 },
  { hour: "8PM", orders: 38 },
  { hour: "9PM", orders: 25 },
  { hour: "10PM", orders: 15 },
  { hour: "11PM", orders: 8 },
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        // Mock API call - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [timeRange])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-slate-600 mt-1">Comprehensive insights and performance metrics</p>
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
            Analytics Dashboard
          </h1>
          <p className="text-slate-600 mt-1">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">385</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5% from last period
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
              <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">$9,680</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.3% from last period
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
              <CardTitle className="text-sm font-medium text-slate-600">Active Businesses</CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">3</div>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <Users className="h-3 w-3 mr-1" />
                60% of total
              </p>
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
              <CardTitle className="text-sm font-medium text-slate-600">Avg Order Value</CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">$25.14</div>
              <p className="text-xs text-purple-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +2.1% from last period
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="business">Business Performance</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="timing">Peak Hours</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Orders & Revenue Trend</CardTitle>
                <CardDescription>Daily performance over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={ordersData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="orders" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="revenue" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Business Status */}
            <Card>
              <CardHeader>
                <CardTitle>Business Status Distribution</CardTitle>
                <CardDescription>Current status of all businesses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={businessStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {businessStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center space-x-4 mt-4">
                  {businessStatusData.map((item) => (
                    <div key={item.name} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Performance Ranking</CardTitle>
              <CardDescription>Top performing businesses by orders and revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={businessPerformanceData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Business</CardTitle>
                <CardDescription>Revenue distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {businessPerformanceData.map((business, index) => (
                    <div key={business.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{business.name}</div>
                          <div className="text-sm text-slate-500">${business.revenue.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${business.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {business.growth >= 0 ? '+' : ''}{business.growth}%
                        </div>
                        <div className="text-xs text-slate-500">Growth</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>Month-over-month growth</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={businessPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="growth" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Orders</CardTitle>
              <CardDescription>Most popular items across all businesses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topProductsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Performance</CardTitle>
                <CardDescription>Orders vs Revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProductsData.map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-slate-500">{product.orders} orders</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${product.revenue.toLocaleString()}</div>
                        <div className="text-sm text-slate-500">Revenue</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Product</CardTitle>
                <CardDescription>Revenue distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topProductsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Peak Order Hours</CardTitle>
              <CardDescription>Order volume by hour of day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Peak Hours</CardTitle>
                <CardDescription>Highest order volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">7PM</span>
                    <Badge className="bg-red-100 text-red-800">42 orders</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">8PM</span>
                    <Badge className="bg-orange-100 text-orange-800">38 orders</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">12PM</span>
                    <Badge className="bg-yellow-100 text-yellow-800">25 orders</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quiet Hours</CardTitle>
                <CardDescription>Lowest order volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">6AM</span>
                    <Badge className="bg-green-100 text-green-800">2 orders</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">7AM</span>
                    <Badge className="bg-green-100 text-green-800">5 orders</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">11PM</span>
                    <Badge className="bg-green-100 text-green-800">8 orders</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Insights</CardTitle>
                <CardDescription>Smart recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-800">Peak Time</div>
                    <div className="text-xs text-blue-600">7-8 PM is your busiest period</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-green-800">Opportunity</div>
                    <div className="text-xs text-green-600">Consider extending lunch hours</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm font-medium text-purple-800">Trend</div>
                    <div className="text-xs text-purple-600">Weekend orders increasing</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                  AI-Generated Insights
                </CardTitle>
                <CardDescription>Smart analysis of your data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">📈 Growth Opportunity</h4>
                    <p className="text-sm text-blue-700">
                      Your peak ordering time is 7-8 PM with 42 orders. Consider promoting early bird specials during 5-6 PM to spread demand.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">🍽️ Menu Optimization</h4>
                    <p className="text-sm text-green-700">
                      Kung Pao Chicken is your top seller. Consider creating variations or complementary dishes to increase average order value.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-orange-800 mb-2">⚠️ Attention Needed</h4>
                    <p className="text-sm text-orange-700">
                      Mediterranean Bistro has 0 orders this week. Consider reaching out to understand challenges or provide support.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-purple-500" />
                  Predictive Analytics
                </CardTitle>
                <CardDescription>Forecasted trends and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Next Week Forecast</span>
                      <Badge className="bg-green-100 text-green-800">+15%</Badge>
                    </div>
                    <div className="text-xs text-slate-600">Expected 443 orders (+58 from this week)</div>
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Revenue Projection</span>
                      <Badge className="bg-blue-100 text-blue-800">+12%</Badge>
                    </div>
                    <div className="text-xs text-slate-600">Expected $10,842 revenue (+$1,162)</div>
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Peak Day Prediction</span>
                      <Badge className="bg-red-100 text-red-800">Thursday</Badge>
                    </div>
                    <div className="text-xs text-slate-600">Historically highest volume day</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Actionable Recommendations</CardTitle>
              <CardDescription>AI-suggested improvements based on your data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-medium mb-2">📊 Inventory Management</h4>
                  <p className="text-sm text-slate-600 mb-3">Optimize stock levels based on peak hours</p>
                  <Button size="sm" variant="outline">View Details</Button>
                </div>
                
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-medium mb-2">🎯 Marketing Strategy</h4>
                  <p className="text-sm text-slate-600 mb-3">Target quiet hours with promotions</p>
                  <Button size="sm" variant="outline">View Details</Button>
                </div>
                
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-medium mb-2">⚡ Operational Efficiency</h4>
                  <p className="text-sm text-slate-600 mb-3">Staff scheduling for peak times</p>
                  <Button size="sm" variant="outline">View Details</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
