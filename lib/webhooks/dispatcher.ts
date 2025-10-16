import { appendRow } from "../google/sheets"

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
    await appendRow("WebhookLogs", [
      crypto.randomUUID(),
      event.businessId,
      url,
      event.event,
      response.status.toString(),
      new Date().toISOString(),
      payload,
    ])

    return response.ok
  } catch (error) {
    // Log failed delivery
    await appendRow("WebhookLogs", [
      crypto.randomUUID(),
      event.businessId,
      url,
      event.event,
      "failed",
      new Date().toISOString(),
      JSON.stringify({ error: String(error) }),
    ])
    return false
  }
}

export async function triggerWebhooks(businessId: string, event: string, data: Record<string, unknown>): Promise<void> {
  const { getRows } = await import("../google/sheets")
  const webhooks = await getRows("Webhooks")

  const activeWebhooks = webhooks.filter(
    (w) => w.businessId === businessId && w.events.includes(event) && w.status === "active",
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
