import { createSheetIfNotExists } from "./sheetUtils"

export async function initializeSpreadsheet() {
  // User management
  await createSheetIfNotExists("users", [
    "id",
    "email",
    "password_hash",
    "full_name",
    "phone",
    "status",
    "created_at",
    "last_login_at",
  ])

  await createSheetIfNotExists("user_roles", ["id", "user_id", "role_id", "business_id", "assigned_at"])

  await createSheetIfNotExists("roles", ["id", "business_id", "name", "permissions_csv", "created_at"])

  // Business and stalls
  await createSheetIfNotExists("businesses", ["id", "name", "owner_user_id", "status", "created_at"])

  await createSheetIfNotExists("stalls", ["id", "business_id", "name", "description", "status", "created_at"])

  // Products
  await createSheetIfNotExists("products", [
    "id",
    "stall_id",
    "business_id",
    "title",
    "short_desc",
    "long_desc",
    "price_cents",
    "currency",
    "sku",
    "tags_csv",
    "diet_flags_csv",
    "prep_time_minutes",
    "inventory_qty",
    "status",
    "created_by",
  ])

  await createSheetIfNotExists("product_images", [
    "id",
    "product_id",
    "drive_file_id",
    "url",
    "order_index",
    "status",
    "uploaded_by",
    "uploaded_at",
  ])

  // Orders
  await createSheetIfNotExists("orders", [
    "id",
    "business_id",
    "stall_id",
    "customer_user_id",
    "status",
    "scheduled_for",
    "total_cents",
    "currency",
    "notes",
  ])

  await createSheetIfNotExists("order_items", [
    "id",
    "order_id",
    "product_id",
    "qty",
    "unit_price_cents",
    "total_price_cents",
    "notes",
  ])

  // Auth tokens
  await createSheetIfNotExists("magic_links", ["id", "user_id", "token", "expires_at", "used_at"])

  await createSheetIfNotExists("otp_codes", ["id", "user_id", "code", "expires_at", "used_at"])

  // Webhooks
  await createSheetIfNotExists("Webhooks", [
    "id",
    "businessId",
    "url",
    "events",
    "secret",
    "status",
    "description",
    "createdAt",
  ])

  await createSheetIfNotExists("WebhookLogs", ["id", "businessId", "url", "event", "status", "timestamp", "payload"])

  console.log("✅ All sheets initialized successfully")
}
