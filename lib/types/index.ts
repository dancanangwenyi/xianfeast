// Core domain types for XianFeast

export interface Business {
  id: string
  name: string
  owner_user_id: string
  currency: string
  timezone: string
  created_at: string
  status: "active" | "disabled"
  settings_json?: string
}

export interface Stall {
  id: string
  business_id: string
  name: string
  description: string
  pickup_address: string
  open_hours_json: string
  capacity_per_day: number
  created_at: string
  status: "active" | "disabled"
}

export interface User {
  id: string
  email: string
  name: string
  hashed_password?: string
  roles_json: string // JSON array of role names
  mfa_enabled: boolean
  last_login?: string
  status: "active" | "disabled" | "invited"
  invited_by?: string
  invite_token?: string
  invite_expiry?: string
  created_at: string
}

export interface Product {
  id: string
  stall_id: string
  business_id: string
  title: string
  short_desc: string
  long_desc: string
  price_cents: number
  currency: string
  sku: string
  tags_csv: string
  diet_flags_csv: string
  prep_time_minutes: number
  inventory_qty?: number
  status: "draft" | "pending" | "active" | "archived"
  created_by: string
  created_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  drive_file_id: string
  url_cached: string
  approved_by?: string
  approved_at?: string
  order_index: number
}

export interface Order {
  id: string
  business_id: string
  stall_id: string
  customer_user_id: string
  status: "draft" | "confirmed" | "fulfilled" | "cancelled"
  scheduled_for: string
  total_cents: number
  currency: string
  created_at: string
  notes?: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  qty: number
  unit_price_cents: number
  total_price_cents: number
  notes?: string
}

export interface RolePermission {
  role_id: string
  business_id: string
  role_name: string
  permissions_csv: string
}

export interface AnalyticsEvent {
  id: string
  event_type: string
  payload_json: string
  created_at: string
}

export interface Webhook {
  id: string
  business_id: string
  event: string
  url: string
  secret: string
  active: boolean
}

// Permission types
export type Permission =
  | "business:read"
  | "business:update"
  | "business:disable"
  | "stall:create"
  | "stall:update"
  | "stall:delete"
  | "product:create"
  | "product:update"
  | "product:delete"
  | "product:approve"
  | "orders:create"
  | "orders:view"
  | "orders:fulfil"
  | "orders:export"
  | "users:invite"
  | "users:role:update"

export interface Role {
  name: string
  permissions: Permission[]
  stall_ids?: string[] // Optional: scope to specific stalls
}
