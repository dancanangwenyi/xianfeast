import { type NextRequest, NextResponse } from "next/server"
import { getRows, appendRow } from "@/lib/google/sheets"
import { verifySession } from "@/lib/auth/session"
import { hasPermission } from "@/lib/auth/permissions"
import { generateWebhookSecret } from "@/lib/webhooks/signature"

export async function GET(request: NextRequest) {
  const session = await verifySession(request)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const canManage = await hasPermission(session.userId, "manage_webhooks")
  if (!canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const webhooks = await getRows("Webhooks")
  const userWebhooks = webhooks.filter((w) => w.businessId === session.businessId)

  return NextResponse.json({ webhooks: userWebhooks })
}

export async function POST(request: NextRequest) {
  const session = await verifySession(request)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const canManage = await hasPermission(session.userId, "manage_webhooks")
  if (!canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { url, events, description } = body

  if (!url || !events || !Array.isArray(events)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const webhookId = crypto.randomUUID()
  const secret = generateWebhookSecret()

  await appendRow("Webhooks", [
    webhookId,
    session.businessId,
    url,
    events.join(","),
    secret,
    "active",
    description || "",
    new Date().toISOString(),
  ])

  return NextResponse.json({
    webhook: {
      id: webhookId,
      url,
      events,
      secret,
      status: "active",
    },
  })
}
