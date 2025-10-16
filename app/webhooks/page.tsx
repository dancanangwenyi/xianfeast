"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

interface Webhook {
  id: string
  url: string
  events: string[]
  status: string
  secret: string
  description: string
  createdAt: string
}

const AVAILABLE_EVENTS = [
  "order.created",
  "order.confirmed",
  "order.cancelled",
  "order.fulfilled",
  "product.created",
  "product.updated",
  "product.published",
]

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newWebhook, setNewWebhook] = useState({
    url: "",
    events: [] as string[],
    description: "",
  })

  useEffect(() => {
    fetchWebhooks()
  }, [])

  async function fetchWebhooks() {
    try {
      const res = await fetch("/api/webhooks")
      const data = await res.json()
      setWebhooks(data.webhooks || [])
    } catch (error) {
      console.error("Failed to fetch webhooks:", error)
    } finally {
      setLoading(false)
    }
  }

  async function createWebhook() {
    if (!newWebhook.url || newWebhook.events.length === 0) return

    setIsCreating(true)
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWebhook),
      })

      if (res.ok) {
        await fetchWebhooks()
        setNewWebhook({ url: "", events: [], description: "" })
      }
    } catch (error) {
      console.error("Failed to create webhook:", error)
    } finally {
      setIsCreating(false)
    }
  }

  async function toggleWebhook(id: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "inactive" : "active"
    try {
      await fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      await fetchWebhooks()
    } catch (error) {
      console.error("Failed to toggle webhook:", error)
    }
  }

  async function deleteWebhook(id: string) {
    if (!confirm("Are you sure you want to delete this webhook?")) return

    try {
      await fetch(`/api/webhooks/${id}`, { method: "DELETE" })
      await fetchWebhooks()
    } catch (error) {
      console.error("Failed to delete webhook:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading webhooks...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground mt-2">Configure webhooks to receive real-time event notifications</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>Create Webhook</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="url">Webhook URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://your-app.com/webhooks"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                />
              </div>

              <div>
                <Label>Events to Subscribe</Label>
                <div className="space-y-2 mt-2">
                  {AVAILABLE_EVENTS.map((event) => (
                    <div key={event} className="flex items-center gap-2">
                      <Checkbox
                        id={event}
                        checked={newWebhook.events.includes(event)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewWebhook({
                              ...newWebhook,
                              events: [...newWebhook.events, event],
                            })
                          } else {
                            setNewWebhook({
                              ...newWebhook,
                              events: newWebhook.events.filter((e) => e !== event),
                            })
                          }
                        }}
                      />
                      <Label htmlFor={event} className="font-mono text-sm">
                        {event}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Production webhook for order notifications"
                  value={newWebhook.description}
                  onChange={(e) =>
                    setNewWebhook({
                      ...newWebhook,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <Button onClick={createWebhook} disabled={isCreating || !newWebhook.url} className="w-full">
                {isCreating ? "Creating..." : "Create Webhook"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {webhooks.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            No webhooks configured yet. Create your first webhook to start receiving events.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{webhook.url}</h3>
                    <Badge variant={webhook.status === "active" ? "default" : "secondary"}>{webhook.status}</Badge>
                  </div>

                  {webhook.description && <p className="text-sm text-muted-foreground mb-3">{webhook.description}</p>}

                  <div className="flex flex-wrap gap-2 mb-3">
                    {webhook.events.map((event) => (
                      <Badge key={event} variant="outline">
                        {event}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <span className="font-mono">Secret: {webhook.secret}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleWebhook(webhook.id, webhook.status)}>
                    {webhook.status === "active" ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteWebhook(webhook.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
