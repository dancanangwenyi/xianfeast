import { google } from "googleapis"
import type { JWT } from "google-auth-library"

let authClient: JWT | null = null

/**
 * Get authenticated Google API client using Service Account
 * Credentials are loaded from environment variables
 */
export function getGoogleAuthClient(): JWT {
  if (authClient) {
    return authClient
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!email || !privateKey) {
    throw new Error(
      "Missing Google Service Account credentials. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env",
    )
  }

  authClient = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive.file"],
  })

  return authClient
}

/**
 * Get Google Sheets API client
 */
export function getSheetsClient() {
  const auth = getGoogleAuthClient()
  return google.sheets({ version: "v4", auth })
}

/**
 * Get Google Drive API client
 */
export function getDriveClient() {
  const auth = getGoogleAuthClient()
  return google.drive({ version: "v3", auth })
}
