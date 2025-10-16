"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
  Brain,
  Zap,
  Download,
  RefreshCw,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  FileText,
  Sparkles,
  Lightbulb,
  Search,
  Send,
  Loader2,
  Eye,
  Calendar,
  DollarSign,
  Users,
  Building2,
} from "lucide-react"
import { motion } from "framer-motion"

interface AIInsight {
  id: string
  type: "prediction" | "recommendation" | "anomaly" | "trend"
  title: string
  description: string
  confidence: number
  impact: "high" | "medium" | "low"
  category: "revenue" | "operations" | "marketing" | "inventory"
  generatedAt: string
  actionable: boolean
  metadata?: any
}

interface AIReport {
  id: string
  title: string
  summary: string
  insights: AIInsight[]
  generatedAt: string
  status: "generating" | "completed" | "failed"
}

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [reports, setReports] = useState<AIReport[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false)
  const [chatQuery, setChatQuery] = useState("")
  const [chatResponse, setChatResponse] = useState("")
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    const fetchAIInsights = async () => {
      setLoading(true)
      try {
        // Mock data - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setInsights([
          {
            id: "1",
            type: "prediction",
            title: "Revenue Growth Forecast",
            description: "Based on current trends, revenue is expected to increase by 15% next week, reaching $11,200. Peak day will be Thursday with 65 orders.",
            confidence: 87,
            impact: "high",
            category: "revenue",
            generatedAt: "2024-10-16T19:30:00Z",
            actionable: true,
            metadata: {
              predictedRevenue: 11200,
              peakDay: "Thursday",
              peakOrders: 65
            }
          },
          {
            id: "2",
            type: "recommendation",
            title: "Menu Optimization Opportunity",
            description: "Kung Pao Chicken shows 23% higher order frequency during peak hours. Consider promoting complementary dishes to increase average order value.",
            confidence: 92,
            impact: "medium",
            category: "marketing",
            generatedAt: "2024-10-16T18:45:00Z",
            actionable: true,
            metadata: {
              product: "Kung Pao Chicken",
              orderIncrease: 23,
              suggestedAction: "promote_complementary"
            }
          },
          {
            id: "3",
            type: "anomaly",
            title: "Unusual Order Pattern Detected",
            description: "Mediterranean Bistro shows 0 orders for 3 consecutive days, which is 85% below historical average. This requires immediate attention.",
            confidence: 95,
            impact: "high",
            category: "operations",
            generatedAt: "2024-10-16T17:20:00Z",
            actionable: true,
            metadata: {
              business: "Mediterranean Bistro",
              daysWithoutOrders: 3,
              deviationFromAverage: -85
            }
          },
          {
            id: "4",
            type: "trend",
            title: "Peak Hour Shift Detected",
            description: "Order patterns show a gradual shift from 8PM to 7PM as the busiest hour. This trend has been consistent over the past 2 weeks.",
            confidence: 78,
            impact: "medium",
            category: "operations",
            generatedAt: "2024-10-16T16:10:00Z",
            actionable: true,
            metadata: {
              oldPeakHour: "8PM",
              newPeakHour: "7PM",
              trendDuration: "2 weeks"
            }
          },
          {
            id: "5",
            type: "recommendation",
            title: "Inventory Optimization",
            description: "Current inventory levels for Spice Garden are 40% above optimal. Consider reducing stock for low-demand items to improve cash flow.",
            confidence: 84,
            impact: "medium",
            category: "inventory",
            generatedAt: "2024-10-16T15:30:00Z",
            actionable: true,
            metadata: {
              business: "Spice Garden",
              excessInventory: 40,
              suggestedAction: "reduce_stock"
            }
          }
        ])

        setReports([
          {
            id: "RPT-001",
            title: "Weekly Performance Analysis",
            summary: "Comprehensive analysis of business performance, identifying growth opportunities and operational improvements.",
            insights: [],
            generatedAt: "2024-10-16T19:00:00Z",
            status: "completed"
          },
          {
            id: "RPT-002",
            title: "Demand Forecasting Report",
            summary: "AI-powered demand prediction for the next 30 days with actionable recommendations.",
            insights: [],
            generatedAt: "2024-10-15T14:30:00Z",
            status: "completed"
          }
        ])
      } catch (error) {
        console.error("Failed to fetch AI insights:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAIInsights()
  }, [])

  const handleGenerateReport = async () => {
    setGeneratingReport(true)
    try {
      // Mock API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const newReport: AIReport = {
        id: `RPT-${Date.now()}`,
        title: "AI-Generated System Report",
        summary: "Comprehensive analysis of platform performance with actionable insights.",
        insights: [],
        generatedAt: new Date().toISOString(),
        status: "completed"
      }
      
      setReports(prev => [newReport, ...prev])
    } catch (error) {
      console.error("Failed to generate report:", error)
    } finally {
      setGeneratingReport(false)
    }
  }

  const handleChatQuery = async () => {
    if (!chatQuery.trim()) return
    
    setChatLoading(true)
    try {
      // Mock API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setChatResponse(`Based on your query "${chatQuery}", here's what I found:

1. **Current Performance**: Your platform is showing strong growth with 15% increase in orders this week.

2. **Key Insights**: 
   - Peak ordering time is 7-8 PM
   - Golden Dragon Restaurant is your top performer
   - Mediterranean Bistro needs attention (0 orders)

3. **Recommendations**:
   - Consider promoting early bird specials during 5-6 PM
   - Reach out to Mediterranean Bistro for support
   - Optimize inventory for Spice Garden

Would you like me to dive deeper into any of these areas?`)
    } catch (error) {
      console.error("Failed to process chat query:", error)
      setChatResponse("Sorry, I encountered an error processing your query. Please try again.")
    } finally {
      setChatLoading(false)
    }
  }

  const getTypeColor = (type: AIInsight["type"]) => {
    switch (type) {
      case "prediction":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "recommendation":
        return "bg-green-100 text-green-800 border-green-200"
      case "anomaly":
        return "bg-red-100 text-red-800 border-red-200"
      case "trend":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeIcon = (type: AIInsight["type"]) => {
    switch (type) {
      case "prediction":
        return <TrendingUp className="h-4 w-4" />
      case "recommendation":
        return <Lightbulb className="h-4 w-4" />
      case "anomaly":
        return <AlertTriangle className="h-4 w-4" />
      case "trend":
        return <BarChart3 className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  const getImpactColor = (impact: AIInsight["impact"]) => {
    switch (impact) {
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

  const getCategoryIcon = (category: AIInsight["category"]) => {
    switch (category) {
      case "revenue":
        return <DollarSign className="h-4 w-4" />
      case "operations":
        return <Building2 className="h-4 w-4" />
      case "marketing":
        return <Target className="h-4 w-4" />
      case "inventory":
        return <BarChart3 className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              AI Insights
            </h1>
            <p className="text-slate-600 mt-1">AI-powered analytics and intelligent recommendations</p>
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
            AI Insights
          </h1>
          <p className="text-slate-600 mt-1">AI-powered analytics and intelligent recommendations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isChatDialogOpen} onOpenChange={setIsChatDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Ask AI
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-purple-500" />
                  AI Assistant
                </DialogTitle>
                <DialogDescription>
                  Ask questions about your data and get intelligent insights
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Question</label>
                  <Textarea
                    placeholder="e.g., What are the top performing businesses this week?"
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                {chatResponse && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">AI Response</span>
                    </div>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap">
                      {chatResponse}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsChatDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={handleChatQuery} disabled={chatLoading || !chatQuery.trim()}>
                  {chatLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Ask AI
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={handleGenerateReport} disabled={generatingReport}>
            {generatingReport ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </div>

      {/* AI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Insights</CardTitle>
              <Brain className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{insights.length}</div>
              <p className="text-xs text-purple-600 mt-1">AI-generated insights</p>
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
              <CardTitle className="text-sm font-medium text-slate-600">High Impact</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {insights.filter(i => i.impact === "high").length}
              </div>
              <p className="text-xs text-red-600 mt-1">Critical insights</p>
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
              <CardTitle className="text-sm font-medium text-slate-600">Actionable</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {insights.filter(i => i.actionable).length}
              </div>
              <p className="text-xs text-green-600 mt-1">Ready to act</p>
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
              <CardTitle className="text-sm font-medium text-slate-600">Avg Confidence</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length)}%
              </div>
              <p className="text-xs text-blue-600 mt-1">AI confidence</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Recent AI Reports
          </CardTitle>
          <CardDescription>Generated reports and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">{report.title}</div>
                    <div className="text-sm text-slate-500">{report.summary}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Generated: {new Date(report.generatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={report.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {report.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            AI-Generated Insights
          </CardTitle>
          <CardDescription>Intelligent analysis and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      {getTypeIcon(insight.type)}
                    </div>
                    <div>
                      <h4 className="font-medium">{insight.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getTypeColor(insight.type)}>
                          {insight.type}
                        </Badge>
                        <Badge className={getImpactColor(insight.impact)}>
                          {insight.impact} impact
                        </Badge>
                        <Badge variant="outline">
                          {insight.confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-slate-100 rounded">
                      {getCategoryIcon(insight.category)}
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 mb-3">{insight.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(insight.generatedAt).toLocaleString()}</span>
                    </div>
                    {insight.actionable && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Actionable</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                    {insight.actionable && (
                      <Button size="sm">
                        <Zap className="h-3 w-3 mr-1" />
                        Take Action
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
              Demand Forecast
            </CardTitle>
            <CardDescription>Predict future order patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Get AI-powered predictions for order volume, peak times, and revenue trends.
            </p>
            <Button className="w-full">
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Forecast
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Anomaly Detection
            </CardTitle>
            <CardDescription>Identify unusual patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Detect unusual patterns in orders, revenue, or business performance.
            </p>
            <Button className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Scan for Anomalies
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
              Smart Recommendations
            </CardTitle>
            <CardDescription>Get personalized suggestions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Receive AI-generated recommendations for improving performance.
            </p>
            <Button className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Get Recommendations
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
