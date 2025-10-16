import { getDriveClient } from "./auth"
import { Readable } from "stream"

const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID

/**
 * Upload a file to Google Drive
 * @param fileName - Name of the file
 * @param mimeType - MIME type of the file
 * @param fileBuffer - File content as Buffer
 * @param businessId - Business ID for folder organization
 * @returns Object with drive_file_id and public URL
 */
export async function uploadFile(
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer,
  businessId: string,
): Promise<{ drive_file_id: string; url: string }> {
  const drive = getDriveClient()

  // Create business folder if it doesn't exist
  const businessFolderId = await getOrCreateBusinessFolder(businessId)

  // Create products subfolder
  const productsFolderId = await getOrCreateFolder("products", businessFolderId)

  // Upload file
  const fileMetadata = {
    name: fileName,
    parents: [productsFolderId],
  }

  const media = {
    mimeType,
    body: Readable.from(fileBuffer),
  }

  try {
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, webViewLink, webContentLink",
    })

    const fileId = response.data.id!

    // Make file publicly readable (optional - adjust based on security requirements)
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    })

    // Get public URL
    const url = `https://drive.google.com/uc?id=${fileId}&export=view`

    return {
      drive_file_id: fileId,
      url,
    }
  } catch (error) {
    console.error("Error uploading file to Drive:", error)
    throw error
  }
}

/**
 * Get or create a business folder in Drive
 */
async function getOrCreateBusinessFolder(businessId: string): Promise<string> {
  const drive = getDriveClient()
  const folderName = `XianFeast/${businessId}`

  if (!DRIVE_FOLDER_ID) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID is not set in environment variables")
  }

  // Check if folder exists
  const response = await drive.files.list({
    q: `name='${businessId}' and '${DRIVE_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
  })

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!
  }

  // Create folder
  const folderMetadata = {
    name: businessId,
    mimeType: "application/vnd.google-apps.folder",
    parents: [DRIVE_FOLDER_ID],
  }

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: "id",
  })

  return folder.data.id!
}

/**
 * Get or create a subfolder
 */
async function getOrCreateFolder(folderName: string, parentId: string): Promise<string> {
  const drive = getDriveClient()

  // Check if folder exists
  const response = await drive.files.list({
    q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
  })

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!
  }

  // Create folder
  const folderMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: [parentId],
  }

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: "id",
  })

  return folder.data.id!
}

/**
 * Delete a file from Drive
 */
export async function deleteFile(fileId: string): Promise<void> {
  const drive = getDriveClient()

  try {
    await drive.files.delete({ fileId })
  } catch (error) {
    console.error("Error deleting file from Drive:", error)
    throw error
  }
}
