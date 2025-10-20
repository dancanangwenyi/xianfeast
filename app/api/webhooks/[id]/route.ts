import { type NextRequest, NextResponse } from "next/server"
import { getAllRowsFromSheet, updateRowInSheet } from "@/lib/dynamodb/api-service"
import { verifySession } from "@/lib/auth/session"
import { hasPermission } from "@/lib/auth/permissions"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await verifySession(request)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const canManage = await hasPermission(session.userId, "manage_webhooks")
  if (!canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const webhooks = await getRows("Webhooks")
  const webhook = webhooks.find((w) => w.id === params.id && w.businessId === session.businessId)

  if (!webhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
  }

  const body = await request.json()
  const { url, events, status } = body

  await updateRow("Webhooks", params.id, {
    url: url || webhook.url,
    events: events ? events.join(",") : webhook.events,
    status: status || webhook.status,
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await verifySession(request)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const canManage = await hasPermission(session.userId, "manage_webhooks")
  if (!canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const webhooks = await getRows("Webhooks")
  const webhook = webhooks.find((w) => w.id === params.id && w.businessId === session.businessId)

  if (!webhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
  }

  await updateRow("Webhooks", params.id, { status: "deleted" })

  return NextResponse.json({ success: true })
}
