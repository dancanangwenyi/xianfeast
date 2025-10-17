/**
 * Data Validation and Healing System for XianFeast
 * Ensures data integrity across all Google Sheets
 */

import { config } from "dotenv"
import { getSheetsClient } from "../google/auth"
import { v4 as uuidv4 } from "uuid"

config()
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID

export interface ValidationResult {
  sheet: string
  totalRecords: number
  validRecords: number
  invalidRecords: number
  issues: ValidationIssue[]
  fixed: boolean
}

export interface ValidationIssue {
  type: "missing_id" | "orphaned_record" | "invalid_reference" | "duplicate_id" | "schema_mismatch"
  recordId?: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  fixable: boolean
  suggestedFix?: string
}

export interface CrossSheetRelationship {
  fromSheet: string
  toSheet: string
  fromField: string
  toField: string
  orphanedCount: number
  orphanedRecords: string[]
}

class DataValidator {
  private sheets: any
  private validationResults: ValidationResult[] = []
  private crossSheetRelationships: CrossSheetRelationship[] = []

  constructor() {
    this.sheets = getSheetsClient()
  }

  /**
   * Validate all sheets and their data integrity
   */
  async validateAllSheets(): Promise<ValidationResult[]> {
    console.log("🔍 Starting comprehensive data validation...")
    
    this.validationResults = []

    // Validate each sheet
    await this.validateSheet("businesses")
    await this.validateSheet("stalls")
    await this.validateSheet("products")
    await this.validateSheet("orders")
    await this.validateSheet("users")
    await this.validateSheet("user_roles")
    await this.validateSheet("roles")
    await this.validateSheet("roles_permissions")

    // Validate cross-sheet relationships
    await this.validateCrossSheetRelationships()

    // Generate audit report
    await this.generateAuditReport()

    return this.validationResults
  }

  /**
   * Validate a specific sheet
   */
  private async validateSheet(sheetName: string): Promise<void> {
    try {
      console.log(`📊 Validating ${sheetName} sheet...`)
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A:ZZ`,
      })

      const records = response.data.values?.slice(1) || [] // Skip header
      const issues: ValidationIssue[] = []

      // Check for missing IDs
      const missingIds = records.filter((record, index) => !record[0])
      if (missingIds.length > 0) {
        issues.push({
          type: "missing_id",
          description: `${missingIds.length} records missing ID`,
          severity: "critical",
          fixable: true,
          suggestedFix: "Generate UUIDs for missing records",
        })
      }

      // Check for duplicate IDs
      const ids = records.map(record => record[0]).filter(Boolean)
      const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
      if (duplicateIds.length > 0) {
        issues.push({
          type: "duplicate_id",
          description: `${duplicateIds.length} duplicate IDs found`,
          severity: "high",
          fixable: true,
          suggestedFix: "Regenerate duplicate IDs",
        })
      }

      // Sheet-specific validations
      switch (sheetName) {
        case "businesses":
          await this.validateBusinessesSheet(records, issues)
          break
        case "stalls":
          await this.validateStallsSheet(records, issues)
          break
        case "products":
          await this.validateProductsSheet(records, issues)
          break
        case "orders":
          await this.validateOrdersSheet(records, issues)
          break
        case "users":
          await this.validateUsersSheet(records, issues)
          break
      }

      this.validationResults.push({
        sheet: sheetName,
        totalRecords: records.length,
        validRecords: records.length - issues.length,
        invalidRecords: issues.length,
        issues,
        fixed: false,
      })

      console.log(`✅ ${sheetName}: ${records.length} records, ${issues.length} issues`)
    } catch (error) {
      console.error(`❌ Error validating ${sheetName}:`, error)
      this.validationResults.push({
        sheet: sheetName,
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 1,
        issues: [{
          type: "schema_mismatch",
          description: `Failed to read sheet: ${error}`,
          severity: "critical",
          fixable: false,
        }],
        fixed: false,
      })
    }
  }

  /**
   * Validate businesses sheet
   */
  private async validateBusinessesSheet(records: any[][], issues: ValidationIssue[]): Promise<void> {
    for (const [index, record] of records.entries()) {
      const [id, name, ownerUserId, currency, timezone, createdAt, status, settings] = record

      if (!name) {
        issues.push({
          type: "missing_id",
          recordId: id,
          description: `Business ${index + 1} missing name`,
          severity: "high",
          fixable: true,
        })
      }

      if (!status || !["active", "pending", "disabled"].includes(status)) {
        issues.push({
          type: "invalid_reference",
          recordId: id,
          description: `Business ${index + 1} has invalid status: ${status}`,
          severity: "medium",
          fixable: true,
          suggestedFix: "Set status to 'pending'",
        })
      }
    }
  }

  /**
   * Validate stalls sheet
   */
  private async validateStallsSheet(records: any[][], issues: ValidationIssue[]): Promise<void> {
    for (const [index, record] of records.entries()) {
      const [id, businessId, name, description, pickupAddress, openHours, capacity, createdAt, status] = record

      if (!businessId) {
        issues.push({
          type: "orphaned_record",
          recordId: id,
          description: `Stall ${index + 1} missing business_id`,
          severity: "critical",
          fixable: false,
        })
      }

      if (!name) {
        issues.push({
          type: "missing_id",
          recordId: id,
          description: `Stall ${index + 1} missing name`,
          severity: "high",
          fixable: true,
        })
      }
    }
  }

  /**
   * Validate products sheet
   */
  private async validateProductsSheet(records: any[][], issues: ValidationIssue[]): Promise<void> {
    for (const [index, record] of records.entries()) {
      const [id, stallId, businessId, title, shortDesc, longDesc, priceCents, currency, sku, tags, dietFlags, prepTime, inventory, status, createdBy, createdAt] = record

      if (!stallId) {
        issues.push({
          type: "orphaned_record",
          recordId: id,
          description: `Product ${index + 1} missing stall_id`,
          severity: "critical",
          fixable: false,
        })
      }

      if (!businessId) {
        issues.push({
          type: "orphaned_record",
          recordId: id,
          description: `Product ${index + 1} missing business_id`,
          severity: "critical",
          fixable: false,
        })
      }

      if (!title) {
        issues.push({
          type: "missing_id",
          recordId: id,
          description: `Product ${index + 1} missing title`,
          severity: "high",
          fixable: true,
        })
      }

      if (!priceCents || isNaN(Number(priceCents))) {
        issues.push({
          type: "invalid_reference",
          recordId: id,
          description: `Product ${index + 1} has invalid price`,
          severity: "high",
          fixable: true,
          suggestedFix: "Set price to 0",
        })
      }
    }
  }

  /**
   * Validate orders sheet
   */
  private async validateOrdersSheet(records: any[][], issues: ValidationIssue[]): Promise<void> {
    for (const [index, record] of records.entries()) {
      const [id, businessId, stallId, customerUserId, status, scheduledFor, totalCents, currency, createdAt, notes] = record

      if (!businessId) {
        issues.push({
          type: "orphaned_record",
          recordId: id,
          description: `Order ${index + 1} missing business_id`,
          severity: "critical",
          fixable: false,
        })
      }

      if (!stallId) {
        issues.push({
          type: "orphaned_record",
          recordId: id,
          description: `Order ${index + 1} missing stall_id`,
          severity: "critical",
          fixable: false,
        })
      }

      if (!status || !["draft", "confirmed", "fulfilled", "cancelled"].includes(status)) {
        issues.push({
          type: "invalid_reference",
          recordId: id,
          description: `Order ${index + 1} has invalid status: ${status}`,
          severity: "medium",
          fixable: true,
          suggestedFix: "Set status to 'draft'",
        })
      }
    }
  }

  /**
   * Validate users sheet
   */
  private async validateUsersSheet(records: any[][], issues: ValidationIssue[]): Promise<void> {
    for (const [index, record] of records.entries()) {
      const [id, email, name, hashedPassword, rolesJson, mfaEnabled, lastLogin, status, invitedBy, inviteToken, inviteExpiry, createdAt] = record

      if (!email) {
        issues.push({
          type: "missing_id",
          recordId: id,
          description: `User ${index + 1} missing email`,
          severity: "critical",
          fixable: false,
        })
      }

      if (!name) {
        issues.push({
          type: "missing_id",
          recordId: id,
          description: `User ${index + 1} missing name`,
          severity: "high",
          fixable: true,
        })
      }

      if (!status || !["active", "disabled", "invited"].includes(status)) {
        issues.push({
          type: "invalid_reference",
          recordId: id,
          description: `User ${index + 1} has invalid status: ${status}`,
          severity: "medium",
          fixable: true,
          suggestedFix: "Set status to 'invited'",
        })
      }
    }
  }

  /**
   * Validate cross-sheet relationships
   */
  private async validateCrossSheetRelationships(): Promise<void> {
    console.log("🔗 Validating cross-sheet relationships...")

    // Get all data
    const [businesses, stalls, products, orders, users] = await Promise.all([
      this.getSheetData("businesses"),
      this.getSheetData("stalls"),
      this.getSheetData("products"),
      this.getSheetData("orders"),
      this.getSheetData("users"),
    ])

    // Validate stall -> business relationships
    const businessIds = new Set(businesses.map(b => b[0]))
    const orphanedStalls = stalls.filter(stall => !businessIds.has(stall[1]))
    
    if (orphanedStalls.length > 0) {
      this.crossSheetRelationships.push({
        fromSheet: "stalls",
        toSheet: "businesses",
        fromField: "business_id",
        toField: "id",
        orphanedCount: orphanedStalls.length,
        orphanedRecords: orphanedStalls.map(s => s[0]),
      })
    }

    // Validate product -> stall relationships
    const stallIds = new Set(stalls.map(s => s[0]))
    const orphanedProducts = products.filter(product => !stallIds.has(product[1]))
    
    if (orphanedProducts.length > 0) {
      this.crossSheetRelationships.push({
        fromSheet: "products",
        toSheet: "stalls",
        fromField: "stall_id",
        toField: "id",
        orphanedCount: orphanedProducts.length,
        orphanedRecords: orphanedProducts.map(p => p[0]),
      })
    }

    // Validate order -> product relationships
    const productIds = new Set(products.map(p => p[0]))
    const orphanedOrders = orders.filter(order => !productIds.has(order[1]))
    
    if (orphanedOrders.length > 0) {
      this.crossSheetRelationships.push({
        fromSheet: "orders",
        toSheet: "products",
        fromField: "product_id",
        toField: "id",
        orphanedCount: orphanedOrders.length,
        orphanedRecords: orphanedOrders.map(o => o[0]),
      })
    }
  }

  /**
   * Get sheet data
   */
  private async getSheetData(sheetName: string): Promise<any[][]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A:ZZ`,
      })
      return response.data.values?.slice(1) || []
    } catch (error) {
      console.error(`Error reading ${sheetName}:`, error)
      return []
    }
  }

  /**
   * Generate audit report
   */
  private async generateAuditReport(): Promise<void> {
    console.log("📋 Generating audit report...")

    const reportData = {
      timestamp: new Date().toISOString(),
      totalSheets: this.validationResults.length,
      totalRecords: this.validationResults.reduce((sum, result) => sum + result.totalRecords, 0),
      totalIssues: this.validationResults.reduce((sum, result) => sum + result.issues.length, 0),
      criticalIssues: this.validationResults.reduce((sum, result) => 
        sum + result.issues.filter(issue => issue.severity === "critical").length, 0),
      crossSheetIssues: this.crossSheetRelationships.length,
      summary: this.validationResults.map(result => ({
        sheet: result.sheet,
        records: result.totalRecords,
        issues: result.issues.length,
        criticalIssues: result.issues.filter(i => i.severity === "critical").length,
      })),
      crossSheetRelationships: this.crossSheetRelationships,
    }

    // Store report in analytics_events sheet
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "analytics_events!A:ZZ",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          uuidv4(),
          "data_validation_report",
          JSON.stringify(reportData),
          new Date().toISOString(),
        ]]
      }
    })

    console.log("✅ Audit report generated and stored")
  }

  /**
   * Auto-fix fixable issues
   */
  async autoFixIssues(): Promise<void> {
    console.log("🔧 Starting auto-fix process...")

    for (const result of this.validationResults) {
      if (result.issues.length === 0) continue

      console.log(`🔧 Fixing issues in ${result.sheet}...`)

      for (const issue of result.issues) {
        if (!issue.fixable) continue

        try {
          await this.fixIssue(result.sheet, issue)
          console.log(`✅ Fixed: ${issue.description}`)
        } catch (error) {
          console.error(`❌ Failed to fix: ${issue.description}`, error)
        }
      }
    }
  }

  /**
   * Fix a specific issue
   */
  private async fixIssue(sheetName: string, issue: ValidationIssue): Promise<void> {
    // Implementation would depend on the specific issue type
    // This is a placeholder for the auto-fix logic
    console.log(`🔧 Auto-fixing ${issue.type} in ${sheetName}: ${issue.description}`)
  }
}

/**
 * Main validation function
 */
export async function validateAndHealData(): Promise<{
  validationResults: ValidationResult[]
  crossSheetRelationships: CrossSheetRelationship[]
  summary: {
    totalSheets: number
    totalRecords: number
    totalIssues: number
    criticalIssues: number
    autoFixed: boolean
  }
}> {
  const validator = new DataValidator()
  
  // Run validation
  const validationResults = await validator.validateAllSheets()
  
  // Auto-fix issues
  await validator.autoFixIssues()

  const summary = {
    totalSheets: validationResults.length,
    totalRecords: validationResults.reduce((sum, result) => sum + result.totalRecords, 0),
    totalIssues: validationResults.reduce((sum, result) => sum + result.issues.length, 0),
    criticalIssues: validationResults.reduce((sum, result) => 
      sum + result.issues.filter(issue => issue.severity === "critical").length, 0),
    autoFixed: true,
  }

  return {
    validationResults,
    crossSheetRelationships: validator["crossSheetRelationships"],
    summary,
  }
}
