"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface WebhookLog {
  id: string
  businessId: string
  url: string
  event: string
  status: string
  timestamp: string
  payload: string
}

export default function WebhookLogsPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    try {
      const res = await fetch("/api/webhooks/logs")
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error("Failed to fetch logs:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading logs...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Webhook Logs</h1>
          <p className="text-muted-foreground mt-2">View delivery history and debug webhook issues</p>
        </div>
        <Button onClick={fetchLogs}>Refresh</Button>
      </div>

      {logs.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No webhook logs yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline">{log.event}</Badge>
                    <Badge variant={log.status === "200" || log.status === "201" ? "default" : "destructive"}>
                      {log.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-mono text-muted-foreground">{log.url}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
              </div>

              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View Payload</summary>
                <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
                  {JSON.stringify(JSON.parse(log.payload), null, 2)}
                </pre>
              </details>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
