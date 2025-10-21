import { type NextRequest, NextResponse } from "next/server"
import { getAllRowsFromSheet } from "@/lib/dynamodb/api-service"
import { verifySession } from "@/lib/auth/session"
import { hasPermission } from "@/lib/auth/permissions"

export async function GET(request: NextRequest) {
  const session = await verifySession(request)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const canManage = await hasPermission(session.userId, "manage_webhooks")
  if (!canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const logs = await getRows("WebhookLogs")
  const userLogs = logs
    .filter((log) => log.businessId === session.businessId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 100) // Last 100 logs

  return NextResponse.json({ logs: userLogs })
}
