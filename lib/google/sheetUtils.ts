import { getSheetsClient } from "./auth"

/**
 * Create a sheet if it doesn't exist
 */
export async function createSheetIfNotExists(sheetName: string, headers: string[]): Promise<void> {
  const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID

  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SPREADSHEET_ID is not set in environment variables")
  }

  const sheets = getSheetsClient()

  try {
    // First, get the spreadsheet to check existing sheets
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })

    // Check if sheet already exists
    const existingSheet = spreadsheet.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetName
    )

    if (existingSheet) {
      console.log(`✅ Sheet "${sheetName}" already exists`)
      return
    }

    // Create the new sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    })

    // Add headers to the new sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [headers],
      },
    })

    console.log(`✅ Created sheet "${sheetName}" with headers: ${headers.join(", ")}`)
  } catch (error) {
    console.error(`❌ Error creating sheet "${sheetName}":`, error)
    throw error
  }
}
