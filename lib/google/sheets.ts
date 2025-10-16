import { getSheetsClient } from "./auth"
import { v4 as uuidv4 } from "uuid"

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID

if (!SPREADSHEET_ID) {
  throw new Error("GOOGLE_SPREADSHEET_ID is not set in environment variables")
}

// Write queue for batching operations
interface WriteOperation {
  sheetName: string
  operation: "append" | "update"
  data: any
  rowIndex?: number
}

let writeQueue: WriteOperation[] = []
let writeTimer: NodeJS.Timeout | null = null
const BATCH_DELAY_MS = 2000 // Batch writes every 2 seconds

/**
 * Convert object to array of values matching sheet column order
 */
function objectToRow(obj: Record<string, any>, columns: string[]): any[] {
  return columns.map((col) => obj[col] ?? "")
}

/**
 * Convert row array to object using column names
 */
function rowToObject(row: any[], columns: string[]): Record<string, any> {
  const obj: Record<string, any> = {}
  columns.forEach((col, idx) => {
    obj[col] = row[idx] ?? ""
  })
  return obj
}

/**
 * Get all rows from a sheet
 */
export async function getAllRows(sheetName: string, columns: string[]): Promise<Record<string, any>[]> {
  const sheets = getSheetsClient()
  const range = `${sheetName}!A2:ZZ` // Skip header row

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    })

    const rows = response.data.values || []
    return rows.map((row) => rowToObject(row, columns))
  } catch (error) {
    console.error(`Error reading sheet ${sheetName}:`, error)
    throw error
  }
}

export const getRows = getAllRows

/**
 * Get a single row by ID
 */
export async function getRow(sheetName: string, id: string, columns: string[]): Promise<Record<string, any> | null> {
  const rows = await getAllRows(sheetName, columns)
  return rows.find((row) => row.id === id) || null
}

/**
 * Query rows with a filter function
 */
export async function queryRows(
  sheetName: string,
  columns: string[],
  filterFn: (row: Record<string, any>) => boolean,
): Promise<Record<string, any>[]> {
  const rows = await getAllRows(sheetName, columns)
  return rows.filter(filterFn)
}

/**
 * Append a new row to a sheet
 */
export async function appendRow(sheetName: string, data: Record<string, any>, columns: string[]): Promise<void> {
  const sheets = getSheetsClient()
  const range = `${sheetName}!A:ZZ`

  // Ensure ID and created_at are set
  if (!data.id) {
    data.id = uuidv4()
  }
  if (!data.created_at) {
    data.created_at = new Date().toISOString()
  }

  const values = [objectToRow(data, columns)]

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      requestBody: { values },
    })
  } catch (error) {
    console.error(`Error appending to sheet ${sheetName}:`, error)
    throw error
  }
}

/**
 * Update an existing row by ID
 */
export async function updateRow(
  sheetName: string,
  id: string,
  patch: Record<string, any>,
  columns: string[],
): Promise<void> {
  const sheets = getSheetsClient()

  // Find the row index
  const rows = await getAllRows(sheetName, columns)
  const rowIndex = rows.findIndex((row) => row.id === id)

  if (rowIndex === -1) {
    throw new Error(`Row with id ${id} not found in sheet ${sheetName}`)
  }

  // Merge patch with existing data
  const existingRow = rows[rowIndex]
  const updatedRow = { ...existingRow, ...patch }
  const values = [objectToRow(updatedRow, columns)]

  // Row index + 2 (1 for header, 1 for 0-based to 1-based)
  const range = `${sheetName}!A${rowIndex + 2}:ZZ${rowIndex + 2}`

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      requestBody: { values },
    })
  } catch (error) {
    console.error(`Error updating sheet ${sheetName}:`, error)
    throw error
  }
}

/**
 * Delete a row by ID (marks as deleted or removes)
 */
export async function deleteRow(sheetName: string, id: string, columns: string[]): Promise<void> {
  // For now, we'll mark as deleted by updating status
  await updateRow(sheetName, id, { status: "deleted" }, columns)
}

/**
 * Add operation to write queue for batching
 */
function queueWrite(operation: WriteOperation) {
  writeQueue.push(operation)

  // Start batch timer if not already running
  if (!writeTimer) {
    writeTimer = setTimeout(flushWriteQueue, BATCH_DELAY_MS)
  }
}

/**
 * Flush the write queue and execute batched operations
 */
async function flushWriteQueue() {
  if (writeQueue.length === 0) {
    writeTimer = null
    return
  }

  const operations = [...writeQueue]
  writeQueue = []
  writeTimer = null

  // Group operations by sheet and type
  const grouped = operations.reduce(
    (acc, op) => {
      const key = `${op.sheetName}-${op.operation}`
      if (!acc[key]) acc[key] = []
      acc[key].push(op)
      return acc
    },
    {} as Record<string, WriteOperation[]>,
  )

  // Execute batched operations
  for (const [_key, ops] of Object.entries(grouped)) {
    try {
      // For now, execute sequentially
      // TODO: Implement true batch API calls
      for (const op of ops) {
        if (op.operation === "append") {
          // Already handled by appendRow
        } else if (op.operation === "update") {
          // Already handled by updateRow
        }
      }
    } catch (error) {
      console.error("Error flushing write queue:", error)
    }
  }
}

/**
 * Batch write helper - queues writes for later execution
 */
export function batchWrite(operation: WriteOperation) {
  queueWrite(operation)
}

/**
 * Force flush all pending writes immediately
 */
export async function flushWrites(): Promise<void> {
  if (writeTimer) {
    clearTimeout(writeTimer)
  }
  await flushWriteQueue()
}

// Sheet column definitions
export const SHEET_COLUMNS = {
  businesses: ["id", "name", "owner_user_id", "currency", "timezone", "created_at", "status", "settings_json"],
  stalls: [
    "id",
    "business_id",
    "name",
    "description",
    "pickup_address",
    "open_hours_json",
    "capacity_per_day",
    "created_at",
    "status",
  ],
  users: [
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
  ],
  products: [
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
  ],
  product_images: ["id", "product_id", "drive_file_id", "url_cached", "approved_by", "approved_at", "order_index"],
  orders: [
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
  ],
  order_items: ["id", "order_id", "product_id", "qty", "unit_price_cents", "total_price_cents", "notes"],
  roles_permissions: ["role_id", "business_id", "role_name", "permissions_csv"],
  analytics_events: ["id", "event_type", "payload_json", "created_at"],
  webhooks: ["id", "business_id", "event", "url", "secret", "active"],
}
