import { createSheetIfNotExists } from "./sheetUtils"

export async function initializeSpreadsheet() {
  // User management
  await createSheetIfNotExists("users", [
    "id",
    "email",
    "name",
    "hashed_password",
    "roles_json",
    "mfa_enabled",
    "last_login",
    "status",
    "invited_by",
    "invite_token",
    "invite_expiry",
    "created_at",
  ])

  await createSheetIfNotExists("user_roles", ["id", "user_id", "role_id", "business_id", "assigned_at"])

  await createSheetIfNotExists("roles", ["id", "business_id", "name", "permissions_csv", "created_at"])

  await createSheetIfNotExists("roles_permissions", [
    "role_id",
    "business_id", 
    "role_name",
    "permissions_csv",
  ])

  // Business and stalls
  await createSheetIfNotExists("businesses", [
    "id",
    "name",
    "owner_user_id",
    "currency",
    "timezone",
    "created_at",
    "status",
    "settings_json",
  ])

  await createSheetIfNotExists("stalls", [
    "id",
    "business_id",
    "name",
    "description",
    "pickup_address",
    "open_hours_json",
    "capacity_per_day",
    "created_at",
    "status",
  ])

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
    "created_at",
  ])

  await createSheetIfNotExists("product_images", [
    "id",
    "product_id",
    "drive_file_id",
    "url_cached",
    "approved_by",
    "approved_at",
    "order_index",
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
    "created_at",
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

  // Analytics and logging
  await createSheetIfNotExists("analytics_events", [
    "id",
    "event_type",
    "payload_json",
    "created_at",
  ])

  // Webhooks
  await createSheetIfNotExists("Webhooks", [
    "id",
    "business_id",
    "event",
    "url",
    "secret",
    "active",
  ])

  await createSheetIfNotExists("WebhookLogs", [
    "id",
    "businessId",
    "url",
    "event",
    "status",
    "timestamp",
    "payload",
  ])

  console.log("✅ All sheets initialized successfully")
}
