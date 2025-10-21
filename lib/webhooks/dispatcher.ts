import { appendRowToSheet, getAllRowsFromSheet } from "../dynamodb/api-service"

export interface WebhookEvent {
  event: string
  data: Record<string, unknown>
  timestamp: string
  businessId: string
}

export async function dispatchWebhook(url: string, event: WebhookEvent, secret: string): Promise<boolean> {
  try {
    const payload = JSON.stringify(event)
    const signature = await import("./signature").then((mod) => mod.generateWebhookSignature(payload, secret))

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": event.event,
      },
      body: payload,
    })

    // Log webhook delivery
    await appendRowToSheet("webhook_logs", {
      id: crypto.randomUUID(),
      business_id: event.businessId,
      webhook_url: url,
      event_type: event.event,
      response_status: response.status.toString(),
      payload,
    })

    return response.ok
  } catch (error) {
    // Log failed delivery
    await appendRowToSheet("webhook_logs", {
      id: crypto.randomUUID(),
      business_id: event.businessId,
      webhook_url: url,
      event_type: event.event,
      response_status: "failed",
      payload: JSON.stringify({ error: String(error) }),
    })
    return false
  }
}

export async function triggerWebhooks(businessId: string, event: string, data: Record<string, unknown>): Promise<void> {
  const webhooks = await getAllRowsFromSheet("webhooks")

  const activeWebhooks = webhooks.filter(
    (w) => w.business_id === businessId && w.events.includes(event) && w.status === "active",
  )

  await Promise.allSettled(
    activeWebhooks.map((webhook) =>
      dispatchWebhook(
        webhook.url,
        {
          event,
          data,
          timestamp: new Date().toISOString(),
          businessId,
        },
        webhook.secret,
      ),
    ),
  )
}
