import { config } from "dotenv"
import { initializeSpreadsheet } from "../lib/google/init"

// Load environment variables
config()

async function main() {
  console.log("🚀 Initializing Google Sheets structure...")

  try {
    await initializeSpreadsheet()
    console.log("✅ Spreadsheet initialized successfully!")
    console.log("\nNext steps:")
    console.log("1. Verify sheets were created in your Google Spreadsheet")
    console.log("2. Run the development server: npm run dev")
    console.log("3. Create your first user via the invite API")
  } catch (error) {
    console.error("❌ Failed to initialize spreadsheet:", error)
    process.exit(1)
  }
}

main()
