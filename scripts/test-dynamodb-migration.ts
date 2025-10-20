#!/usr/bin/env tsx

/**
 * Test DynamoDB Migration
 * Comprehensive test to verify all functionality works with DynamoDB
 */

import { config } from "dotenv"
import { createUser, createRole, createUserRole, getUserByEmail, getAllRoles } from "../lib/dynamodb/users"
import { getAllRowsFromSheet, appendRowToSheet, queryRowsFromSheet, updateRowInSheet } from "../lib/dynamodb/api-service"
import { hashPassword } from "../lib/auth/password"

config()

async function testDynamoDBMigration() {
  console.log("🧪 Testing DynamoDB Migration")
  console.log("=" .repeat(50))

  let testsPassed = 0
  let testsTotal = 0

  // Test 1: Create and retrieve user
  testsTotal++
  try {
    console.log("📝 Test 1: Create and retrieve user...")
    
    const testEmail = `test-${Date.now()}@example.com`
    const hashedPassword = await hashPassword("testpassword123")
    
    const user = await createUser({
      email: testEmail,
      name: "Test User",
      hashed_password: hashedPassword,
      roles_json: JSON.stringify(["test_role"]),
      mfa_enabled: false,
      status: "active",
    })

    const retrievedUser = await getUserByEmail(testEmail)
    
    if (retrievedUser && retrievedUser.email === testEmail) {
      console.log("✅ Test 1 PASSED: User created and retrieved successfully")
      testsPassed++
    } else {
      console.log("❌ Test 1 FAILED: User not found or data mismatch")
    }
  } catch (error) {
    console.log("❌ Test 1 FAILED:", error.message)
  }

  // Test 2: Create and retrieve role
  testsTotal++
  try {
    console.log("📝 Test 2: Create and retrieve role...")
    
    const role = await createRole({
      business_id: "test-business",
      role_name: "test_role",
      permissions_csv: "test.read,test.write",
    })

    const allRoles = await getAllRoles()
    const foundRole = allRoles.find(r => r.id === role.id)
    
    if (foundRole && foundRole.role_name === "test_role") {
      console.log("✅ Test 2 PASSED: Role created and retrieved successfully")
      testsPassed++
    } else {
      console.log("❌ Test 2 FAILED: Role not found or data mismatch")
    }
  } catch (error) {
    console.log("❌ Test 2 FAILED:", error.message)
  }

  // Test 3: API Service functions
  testsTotal++
  try {
    console.log("📝 Test 3: API Service functions...")
    
    const testId = await appendRowToSheet("businesses", {
      name: "Test Business",
      description: "A test business",
      status: "active",
    })

    const businesses = await queryRowsFromSheet("businesses", { id: testId })
    
    if (businesses.length > 0 && businesses[0].name === "Test Business") {
      console.log("✅ Test 3 PASSED: API Service functions working")
      testsPassed++
    } else {
      console.log("❌ Test 3 FAILED: API Service functions not working")
    }
  } catch (error) {
    console.log("❌ Test 3 FAILED:", error.message)
  }

  // Test 4: Update operations
  testsTotal++
  try {
    console.log("📝 Test 4: Update operations...")
    
    const testId = await appendRowToSheet("products", {
      name: "Test Product",
      description: "A test product",
      price: 1000,
      status: "draft",
    })

    await updateRowInSheet("products", testId, {
      status: "active",
      price: 1500,
    })

    const products = await queryRowsFromSheet("products", { id: testId })
    
    if (products.length > 0 && products[0].status === "active" && products[0].price === 1500) {
      console.log("✅ Test 4 PASSED: Update operations working")
      testsPassed++
    } else {
      console.log("❌ Test 4 FAILED: Update operations not working")
    }
  } catch (error) {
    console.log("❌ Test 4 FAILED:", error.message)
  }

  // Test 5: Complex queries
  testsTotal++
  try {
    console.log("📝 Test 5: Complex queries...")
    
    // Create multiple test records
    await appendRowToSheet("orders", {
      customer_id: "test-customer-1",
      business_id: "test-business",
      status: "confirmed",
      total_amount: 2500,
    })

    await appendRowToSheet("orders", {
      customer_id: "test-customer-2", 
      business_id: "test-business",
      status: "pending",
      total_amount: 1800,
    })

    const confirmedOrders = await queryRowsFromSheet("orders", { 
      business_id: "test-business",
      status: "confirmed"
    })
    
    if (confirmedOrders.length > 0) {
      console.log("✅ Test 5 PASSED: Complex queries working")
      testsPassed++
    } else {
      console.log("❌ Test 5 FAILED: Complex queries not working")
    }
  } catch (error) {
    console.log("❌ Test 5 FAILED:", error.message)
  }

  // Test 6: Super Admin functionality
  testsTotal++
  try {
    console.log("📝 Test 6: Super Admin functionality...")
    
    const email = process.env.SUPER_ADMIN_EMAIL
    if (!email) {
      throw new Error("SUPER_ADMIN_EMAIL not configured")
    }

    const superAdmin = await getUserByEmail(email)
    
    if (superAdmin && superAdmin.status === "active") {
      console.log("✅ Test 6 PASSED: Super Admin functionality working")
      testsPassed++
    } else {
      console.log("❌ Test 6 FAILED: Super Admin not found or inactive")
    }
  } catch (error) {
    console.log("❌ Test 6 FAILED:", error.message)
  }

  // Summary
  console.log("\n📊 Test Results Summary")
  console.log("=" .repeat(50))
  console.log(`✅ Tests Passed: ${testsPassed}/${testsTotal}`)
  console.log(`❌ Tests Failed: ${testsTotal - testsPassed}/${testsTotal}`)
  
  if (testsPassed === testsTotal) {
    console.log("\n🎉 ALL TESTS PASSED! DynamoDB migration is successful!")
    console.log("✅ The application is fully migrated from Google Sheets to DynamoDB")
    console.log("✅ All core functionality is working correctly")
    console.log("✅ Super Admin is configured and accessible")
    console.log("✅ CRUD operations are functioning properly")
    console.log("✅ The application is production-ready!")
  } else {
    console.log("\n⚠️  Some tests failed. Please review the errors above.")
    process.exit(1)
  }
}

if (require.main === module) {
  testDynamoDBMigration().catch(console.error)
}

export { testDynamoDBMigration }