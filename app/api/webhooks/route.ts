import { type NextRequest, NextResponse } from "next/server"
import { getAllRowsFromSheet, appendRowToSheet } from "@/lib/dynamodb/api-service"
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

  const webhooks = await getAllRowsFromSheet("webhooks")
  const userWebhooks = webhooks.filter((w) => w.business_id === session.businessId)

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

  await appendRowToSheet("webhooks", {
    id: webhookId,
    business_id: session.businessId,
    url,
    events: events.join(","),
    secret,
    status: "active",
    description: description || "",
  })

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
