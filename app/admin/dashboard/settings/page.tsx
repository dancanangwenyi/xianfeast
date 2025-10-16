"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
  Settings,
  Save,
  RefreshCw,
  Shield,
  Globe,
  Brain,
  Zap,
  Database,
  Server,
  Clock,
  DollarSign,
  Users,
  Bell,
  Key,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react"
import { getCurrencyOptions } from "@/lib/currency"

interface SystemConfig {
  general: {
    defaultCurrency: string
    defaultTimezone: string
    defaultLanguage: string
    maintenanceMode: boolean
    registrationEnabled: boolean
  }
  security: {
    sessionTimeout: number
    mfaRequired: boolean
    passwordMinLength: number
    inviteTokenExpiry: number
    maxLoginAttempts: number
  }
  ai: {
    enabled: boolean
    model: string
    temperature: number
    maxTokens: number
    apiKey: string
  }
  webhooks: {
    enabled: boolean
    maxRetries: number
    timeout: number
    secretKey: string
  }
  notifications: {
    emailEnabled: boolean
    smsEnabled: boolean
    pushEnabled: boolean
    adminEmail: string
  }
}

export default function SettingsPage() {
  const [config, setConfig] = useState<SystemConfig>({
    general: {
      defaultCurrency: "KES",
      defaultTimezone: "Africa/Nairobi",
      defaultLanguage: "en",
      maintenanceMode: false,
      registrationEnabled: true,
    },
    security: {
      sessionTimeout: 24,
      mfaRequired: false,
      passwordMinLength: 8,
      inviteTokenExpiry: 7,
      maxLoginAttempts: 5,
    },
    ai: {
      enabled: true,
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      maxTokens: 1000,
      apiKey: "sk-***",
    },
    webhooks: {
      enabled: true,
      maxRetries: 3,
      timeout: 30,
      secretKey: "whsec_***",
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      adminEmail: "admin@xianfeast.com",
    },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [systemInfo, setSystemInfo] = useState({
    version: "1.0.0",
    uptime: "7 days, 12 hours",
    lastBackup: "2024-10-16T10:30:00Z",
    googleApiQuota: "85%",
    databaseSize: "2.3 GB",
    activeUsers: 156,
    totalOrders: 1247,
  })

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      try {
        // Mock API call - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error("Failed to fetch settings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Mock API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log("Saving configuration:", config)
    } catch (error) {
      console.error("Failed to save settings:", error)
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (section: keyof SystemConfig, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              System Settings
            </h1>
            <p className="text-slate-600 mt-1">Configure system-wide settings and preferences</p>
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
            System Settings
          </h1>
          <p className="text-slate-600 mt-1">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">System Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">Healthy</div>
              <p className="text-xs text-green-600 mt-1">All systems operational</p>
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
              <CardTitle className="text-sm font-medium text-slate-600">Uptime</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{systemInfo.uptime}</div>
              <p className="text-xs text-blue-600 mt-1">System uptime</p>
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
              <CardTitle className="text-sm font-medium text-slate-600">API Quota</CardTitle>
              <Database className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{systemInfo.googleApiQuota}</div>
              <p className="text-xs text-orange-600 mt-1">Google API usage</p>
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
              <CardTitle className="text-sm font-medium text-slate-600">Version</CardTitle>
              <Server className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">v{systemInfo.version}</div>
              <p className="text-xs text-purple-600 mt-1">Current version</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System Info</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                General Configuration
              </CardTitle>
              <CardDescription>Basic system settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select value={config.general.defaultCurrency} onValueChange={(value) => updateConfig("general", "defaultCurrency", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getCurrencyOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Select value={config.general.defaultTimezone} onValueChange={(value) => updateConfig("general", "defaultTimezone", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select value={config.general.defaultLanguage} onValueChange={(value) => updateConfig("general", "defaultLanguage", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-slate-500">Enable maintenance mode to restrict access</p>
                  </div>
                  <Switch
                    checked={config.general.maintenanceMode}
                    onCheckedChange={(checked) => updateConfig("general", "maintenanceMode", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Registration Enabled</Label>
                    <p className="text-sm text-slate-500">Allow new user registrations</p>
                  </div>
                  <Switch
                    checked={config.general.registrationEnabled}
                    onCheckedChange={(checked) => updateConfig("general", "registrationEnabled", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure security policies and authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={config.security.sessionTimeout}
                    onChange={(e) => updateConfig("security", "sessionTimeout", parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={config.security.passwordMinLength}
                    onChange={(e) => updateConfig("security", "passwordMinLength", parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inviteTokenExpiry">Invite Token Expiry (days)</Label>
                  <Input
                    id="inviteTokenExpiry"
                    type="number"
                    value={config.security.inviteTokenExpiry}
                    onChange={(e) => updateConfig("security", "inviteTokenExpiry", parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={config.security.maxLoginAttempts}
                    onChange={(e) => updateConfig("security", "maxLoginAttempts", parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require MFA</Label>
                    <p className="text-sm text-slate-500">Force multi-factor authentication for all users</p>
                  </div>
                  <Switch
                    checked={config.security.mfaRequired}
                    onCheckedChange={(checked) => updateConfig("security", "mfaRequired", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                AI Configuration
              </CardTitle>
              <CardDescription>Configure AI models and parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>AI Features Enabled</Label>
                  <p className="text-sm text-slate-500">Enable AI-powered insights and recommendations</p>
                </div>
                <Switch
                  checked={config.ai.enabled}
                  onCheckedChange={(checked) => updateConfig("ai", "enabled", checked)}
                />
              </div>

              {config.ai.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="aiModel">AI Model</Label>
                    <Select value={config.ai.model} onValueChange={(value) => updateConfig("ai", "model", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={config.ai.temperature}
                      onChange={(e) => updateConfig("ai", "temperature", parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      value={config.ai.maxTokens}
                      onChange={(e) => updateConfig("ai", "maxTokens", parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={config.ai.apiKey}
                      onChange={(e) => updateConfig("ai", "apiKey", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Webhook Configuration
              </CardTitle>
              <CardDescription>Configure webhook settings for integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Webhooks Enabled</Label>
                  <p className="text-sm text-slate-500">Enable webhook notifications for events</p>
                </div>
                <Switch
                  checked={config.webhooks.enabled}
                  onCheckedChange={(checked) => updateConfig("webhooks", "enabled", checked)}
                />
              </div>

              {config.webhooks.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="maxRetries">Max Retries</Label>
                    <Input
                      id="maxRetries"
                      type="number"
                      value={config.webhooks.maxRetries}
                      onChange={(e) => updateConfig("webhooks", "maxRetries", parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeout">Timeout (seconds)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={config.webhooks.timeout}
                      onChange={(e) => updateConfig("webhooks", "timeout", parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="secretKey">Secret Key</Label>
                    <Input
                      id="secretKey"
                      type="password"
                      value={config.webhooks.secretKey}
                      onChange={(e) => updateConfig("webhooks", "secretKey", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Settings
              </CardTitle>
              <CardDescription>Configure notification channels and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-slate-500">Send notifications via email</p>
                  </div>
                  <Switch
                    checked={config.notifications.emailEnabled}
                    onCheckedChange={(checked) => updateConfig("notifications", "emailEnabled", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-slate-500">Send notifications via SMS</p>
                  </div>
                  <Switch
                    checked={config.notifications.smsEnabled}
                    onCheckedChange={(checked) => updateConfig("notifications", "smsEnabled", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-slate-500">Send push notifications to mobile apps</p>
                  </div>
                  <Switch
                    checked={config.notifications.pushEnabled}
                    onCheckedChange={(checked) => updateConfig("notifications", "pushEnabled", checked)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={config.notifications.adminEmail}
                  onChange={(e) => updateConfig("notifications", "adminEmail", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="h-5 w-5 mr-2" />
                System Information
              </CardTitle>
              <CardDescription>System status and resource usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">System Version</Label>
                    <div className="text-lg font-mono">{systemInfo.version}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Uptime</Label>
                    <div className="text-lg">{systemInfo.uptime}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Backup</Label>
                    <div className="text-lg">{new Date(systemInfo.lastBackup).toLocaleString()}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Google API Quota</Label>
                    <div className="text-lg">{systemInfo.googleApiQuota}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Database Size</Label>
                    <div className="text-lg">{systemInfo.databaseSize}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Active Users</Label>
                    <div className="text-lg">{systemInfo.activeUsers}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Monitor system performance and health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Database Connection</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Google Sheets API</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Google Drive API</span>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">85% Quota Used</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">AI Services</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Operational</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
