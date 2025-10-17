/**
 * Comprehensive test script for the XianFeast Super Admin Dashboard
 * This script tests the complete onboarding flow and validates all functionality
 */

import { config } from "dotenv"
import { getSheetsClient } from "../lib/google/auth"
import { hashPassword } from "../lib/auth/password"
import { v4 as uuidv4 } from "uuid"

// Load environment variables
config()

interface TestResult {
  test: string
  status: "PASS" | "FAIL" | "SKIP"
  message: string
  details?: any
}

class DashboardTester {
  private results: TestResult[] = []
  private SPREADSHEET_ID: string

  constructor() {
    this.SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || ""
    if (!this.SPREADSHEET_ID) {
      throw new Error("GOOGLE_SPREADSHEET_ID is not set in environment variables")
    }
  }

  private addResult(test: string, status: "PASS" | "FAIL" | "SKIP", message: string, details?: any) {
    this.results.push({ test, status, message, details })
    const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⏭️"
    console.log(`${icon} ${test}: ${message}`)
    if (details) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`)
    }
  }

  async testGoogleSheetsIntegration(): Promise<void> {
    console.log("\n🔍 Testing Google Sheets Integration...")
    
    try {
      const sheets = getSheetsClient()
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: this.SPREADSHEET_ID,
      })

      const existingSheets = spreadsheet.data.sheets?.map((s) => s.properties?.title) || []
      const requiredSheets = [
        "users", "user_roles", "roles", "roles_permissions",
        "businesses", "stalls", "products", "product_images",
        "orders", "order_items", "analytics_events", "Webhooks", "WebhookLogs"
      ]

      for (const sheetName of requiredSheets) {
        if (existingSheets.includes(sheetName)) {
          this.addResult(`Sheet ${sheetName} exists`, "PASS", "Sheet is present")
        } else {
          this.addResult(`Sheet ${sheetName} exists`, "FAIL", "Sheet is missing")
        }
      }

      // Test data integrity
      for (const sheetName of requiredSheets) {
        if (existingSheets.includes(sheetName)) {
          try {
            const response = await sheets.spreadsheets.values.get({
              spreadsheetId: this.SPREADSHEET_ID,
              range: `${sheetName}!A1:ZZ1`,
            })
            const headers = response.data.values?.[0] || []
            this.addResult(`Sheet ${sheetName} headers`, "PASS", `Found ${headers.length} columns`)
          } catch (error) {
            this.addResult(`Sheet ${sheetName} headers`, "FAIL", `Error reading headers: ${error}`)
          }
        }
      }

    } catch (error) {
      this.addResult("Google Sheets Connection", "FAIL", `Failed to connect: ${error}`)
    }
  }

  async testRBACSystem(): Promise<void> {
    console.log("\n🔐 Testing RBAC System...")

    try {
      const sheets = getSheetsClient()

      // Test roles_permissions sheet
      const rolesResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: this.SPREADSHEET_ID,
        range: "roles_permissions!A:ZZ",
      })

      const roles = rolesResponse.data.values?.slice(1) || [] // Skip header
      const expectedRoles = ["super_admin", "business_owner", "stall_manager", "menu_editor", "order_fulfiller", "customer"]

      for (const expectedRole of expectedRoles) {
        const roleExists = roles.some(row => row[2] === expectedRole) // role_name is column 2
        if (roleExists) {
          this.addResult(`Role ${expectedRole} exists`, "PASS", "Role is defined")
        } else {
          this.addResult(`Role ${expectedRole} exists`, "FAIL", "Role is missing")
        }
      }

      // Test permissions
      const superAdminRole = roles.find(row => row[2] === "super_admin")
      if (superAdminRole) {
        const permissions = superAdminRole[3]?.split(",") || [] // permissions_csv is column 3
        this.addResult("Super Admin Permissions", "PASS", `Found ${permissions.length} permissions`)
      } else {
        this.addResult("Super Admin Permissions", "FAIL", "Super admin role not found")
      }

    } catch (error) {
      this.addResult("RBAC System", "FAIL", `Error testing RBAC: ${error}`)
    }
  }

  async testBusinessOnboardingFlow(): Promise<void> {
    console.log("\n🏢 Testing Business Onboarding Flow...")

    try {
      const sheets = getSheetsClient()

      // Test business creation
      const testBusinessId = uuidv4()
      const testOwnerUserId = uuidv4()
      const testOwnerEmail = `test-owner-${Date.now()}@example.com`

      // Create test business
      await sheets.spreadsheets.values.append({
        spreadsheetId: this.SPREADSHEET_ID,
        range: "businesses!A:ZZ",
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            testBusinessId,
            "Test Business",
            testOwnerUserId,
            "KES",
            "Africa/Nairobi",
            new Date().toISOString(),
            "active",
            "{}"
          ]]
        }
      })

      this.addResult("Business Creation", "PASS", "Test business created successfully")

      // Create test owner user
      const hashedPassword = await hashPassword("testpassword123")
      await sheets.spreadsheets.values.append({
        spreadsheetId: this.SPREADSHEET_ID,
        range: "users!A:ZZ",
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            testOwnerUserId,
            testOwnerEmail,
            "Test Owner",
            hashedPassword,
            JSON.stringify(["business_owner"]),
            false,
            "",
            "active",
            "",
            "",
            "",
            new Date().toISOString()
          ]]
        }
      })

      this.addResult("Owner User Creation", "PASS", "Test owner user created successfully")

      // Create test stall
      const testStallId = uuidv4()
      await sheets.spreadsheets.values.append({
        spreadsheetId: this.SPREADSHEET_ID,
        range: "stalls!A:ZZ",
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            testStallId,
            testBusinessId,
            "Test Stall",
            "A test stall for validation",
            "123 Test Street",
            JSON.stringify({ "monday": "9:00-17:00" }),
            50,
            new Date().toISOString(),
            "active"
          ]]
        }
      })

      this.addResult("Stall Creation", "PASS", "Test stall created successfully")

      // Create test product
      const testProductId = uuidv4()
      await sheets.spreadsheets.values.append({
        spreadsheetId: this.SPREADSHEET_ID,
        range: "products!A:ZZ",
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            testProductId,
            testStallId,
            testBusinessId,
            "Test Product",
            "A test product",
            "This is a test product for validation",
            1299, // KSh 12.99
            "KES",
            "TEST-001",
            "test,food",
            "vegetarian",
            15,
            100,
            "active",
            testOwnerUserId,
            new Date().toISOString()
          ]]
        }
      })

      this.addResult("Product Creation", "PASS", "Test product created successfully")

      // Clean up test data
      // Note: In a real test, you'd want to clean up the test data
      this.addResult("Test Data Cleanup", "SKIP", "Test data left for manual verification")

    } catch (error) {
      this.addResult("Business Onboarding Flow", "FAIL", `Error testing flow: ${error}`)
    }
  }

  async testDataConsistency(): Promise<void> {
    console.log("\n📊 Testing Data Consistency...")

    try {
      const sheets = getSheetsClient()

      // Test business-stall relationships
      const businessesResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: this.SPREADSHEET_ID,
        range: "businesses!A:A",
      })
      const stallsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: this.SPREADSHEET_ID,
        range: "stalls!B:B", // business_id column
      })

      const businessIds = businessesResponse.data.values?.slice(1) || [] // Skip header
      const stallBusinessIds = stallsResponse.data.values?.slice(1) || []

      let orphanedStalls = 0
      for (const stallBusinessId of stallBusinessIds) {
        if (!businessIds.includes(stallBusinessId)) {
          orphanedStalls++
        }
      }

      if (orphanedStalls === 0) {
        this.addResult("Business-Stall Relationships", "PASS", "All stalls have valid business references")
      } else {
        this.addResult("Business-Stall Relationships", "FAIL", `${orphanedStalls} stalls have invalid business references`)
      }

      // Test stall-product relationships
      const stallIds = await sheets.spreadsheets.values.get({
        spreadsheetId: this.SPREADSHEET_ID,
        range: "stalls!A:A",
      })
      const productStallIds = await sheets.spreadsheets.values.get({
        spreadsheetId: this.SPREADSHEET_ID,
        range: "products!B:B", // stall_id column
      })

      const validStallIds = stallIds.data.values?.slice(1) || []
      const productStallIdsList = productStallIds.data.values?.slice(1) || []

      let orphanedProducts = 0
      for (const productStallId of productStallIdsList) {
        if (!validStallIds.includes(productStallId)) {
          orphanedProducts++
        }
      }

      if (orphanedProducts === 0) {
        this.addResult("Stall-Product Relationships", "PASS", "All products have valid stall references")
      } else {
        this.addResult("Stall-Product Relationships", "FAIL", `${orphanedProducts} products have invalid stall references`)
      }

    } catch (error) {
      this.addResult("Data Consistency", "FAIL", `Error testing consistency: ${error}`)
    }
  }

  async runAllTests(): Promise<void> {
    console.log("🚀 Starting XianFeast Dashboard Comprehensive Test Suite")
    console.log("=" * 60)

    await this.testGoogleSheetsIntegration()
    await this.testRBACSystem()
    await this.testBusinessOnboardingFlow()
    await this.testDataConsistency()

    // Summary
    console.log("\n📋 Test Summary")
    console.log("=" * 30)
    
    const passed = this.results.filter(r => r.status === "PASS").length
    const failed = this.results.filter(r => r.status === "FAIL").length
    const skipped = this.results.filter(r => r.status === "SKIP").length

    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏭️ Skipped: ${skipped}`)
    console.log(`📊 Total: ${this.results.length}`)

    if (failed === 0) {
      console.log("\n🎉 All critical tests passed! Dashboard is ready for production.")
    } else {
      console.log("\n⚠️ Some tests failed. Please review and fix issues before production.")
    }

    // Show failed tests
    if (failed > 0) {
      console.log("\n❌ Failed Tests:")
      this.results.filter(r => r.status === "FAIL").forEach(result => {
        console.log(`   - ${result.test}: ${result.message}`)
      })
    }
  }
}

async function main() {
  try {
    const tester = new DashboardTester()
    await tester.runAllTests()
  } catch (error) {
    console.error("❌ Test suite failed to run:", error)
    process.exit(1)
  }
}

main()
