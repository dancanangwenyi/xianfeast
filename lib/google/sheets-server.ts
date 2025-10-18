// Server-only Google Sheets wrapper to avoid webpack issues
// This file should only be imported in API routes, not in client components

import { getSheetsClient } from "@/lib/google/auth"
import { v4 as uuidv4 } from "uuid"

function getSpreadsheetId(): string {
  const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SPREADSHEET_ID is not set in environment variables")
  }
  return SPREADSHEET_ID
}

// Sheet column definitions
export const SHEET_COLUMNS = {
  users: [
    "id", "email", "name", "hashed_password", "roles_json", "mfa_enabled",
    "last_login", "status", "invited_by", "invite_token", "invite_expiry", "created_at"
  ],
  businesses: [
    "id", "name", "description", "address", "phone", "email", "status", "created_at"
  ],
  stalls: [
    "id", "business_id", "name", "description", "status", "created_at"
  ],
  products: [
    "id", "business_id", "stall_id", "title", "short_desc", "long_desc", "price_cents",
    "currency", "sku", "category", "prep_time_minutes", "is_available", "created_by", "status", "created_at"
  ],
  orders: [
    "id", "business_id", "stall_id", "customer_user_id", "status", "scheduled_for",
    "total_cents", "currency", "notes", "created_at"
  ],
  roles: [
    "id", "business_id", "name", "permissions_csv", "created_at"
  ],
  user_roles: [
    "id", "user_id", "role_id", "business_id", "assigned_at"
  ],
  roles_permissions: [
    "role_id", "business_id", "role_name", "permissions_csv"
  ],
  magic_links: [
    "id", "user_id", "email", "token", "expires_at", "used_at", "created_at"
  ],
  otp_codes: [
    "id", "user_id", "code", "expires_at", "used_at"
  ]
}

/**
 * Get all rows from a sheet
 */
export async function getAllRows(sheetName: string): Promise<any[]> {
  const sheets = getSheetsClient()
  const SPREADSHEET_ID = getSpreadsheetId()
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:ZZ`,
  })

  const rows = response.data.values || []
  const headers = rows[0] || []
  
  return rows.slice(1).map(row => {
    const obj: any = {}
    headers.forEach((header: string, index: number) => {
      obj[header] = row[index] || ""
    })
    return obj
  })
}

/**
 * Get a single row by ID
 */
export async function getRow(sheetName: string, id: string): Promise<any | null> {
  const rows = await getAllRows(sheetName)
  return rows.find(row => row.id === id) || null
}

/**
 * Query rows with a filter function
 */
export async function queryRows(sheetName: string, columns: string[], filterFn: (row: any) => boolean): Promise<any[]> {
  const rows = await getAllRows(sheetName)
  return rows.filter(filterFn)
}

/**
 * Append a new row to a sheet
 */
export async function appendRow(sheetName: string, data: any): Promise<void> {
  const sheets = getSheetsClient()
  const SPREADSHEET_ID = getSpreadsheetId()
  const columns = SHEET_COLUMNS[sheetName as keyof typeof SHEET_COLUMNS]
  
  if (!columns) {
    throw new Error(`Unknown sheet: ${sheetName}`)
  }

  const values = columns.map(col => data[col] || "")
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:ZZ`,
    valueInputOption: "RAW",
    requestBody: {
      values: [values]
    }
  })
}

/**
 * Update an existing row
 */
export async function updateRow(sheetName: string, id: string, data: any, columns: string[]): Promise<void> {
  const sheets = getSheetsClient()
  const SPREADSHEET_ID = getSpreadsheetId()
  
  // Get all rows to find the index
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:ZZ`,
  })

  const rows = response.data.values || []
  const headers = rows[0] || []
  const idColumnIndex = headers.indexOf("id")
  
  if (idColumnIndex === -1) {
    throw new Error("ID column not found")
  }

  const rowIndex = rows.findIndex((row, index) => index > 0 && row[idColumnIndex] === id)
  
  if (rowIndex === -1) {
    throw new Error(`Row with ID ${id} not found`)
  }

  // Update the row
  const values = columns.map(col => data[col] || "")
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${rowIndex + 1}:${String.fromCharCode(65 + columns.length - 1)}${rowIndex + 1}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [values]
    }
  })
}

/**
 * Delete a row by ID
 */
export async function deleteRow(sheetName: string, id: string): Promise<void> {
  const sheets = getSheetsClient()
  const SPREADSHEET_ID = getSpreadsheetId()
  
  // Get all rows to find the index
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:ZZ`,
  })

  const rows = response.data.values || []
  const headers = rows[0] || []
  const idColumnIndex = headers.indexOf("id")
  
  if (idColumnIndex === -1) {
    throw new Error("ID column not found")
  }

  const rowIndex = rows.findIndex((row, index) => index > 0 && row[idColumnIndex] === id)
  
  if (rowIndex === -1) {
    throw new Error(`Row with ID ${id} not found`)
  }

  // Delete the row
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: 0, // Assuming first sheet
            dimension: "ROWS",
            startIndex: rowIndex,
            endIndex: rowIndex + 1
          }
        }
      }]
    }
  })
}
