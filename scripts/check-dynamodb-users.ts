#!/usr/bin/env tsx

/**
 * Check what users exist in DynamoDB
 */

import { config } from "dotenv"
import { getAllUsers } from "../lib/dynamodb/users"

config()

async function checkDynamoDBUsers() {
  console.log("🔍 Checking DynamoDB Users")
  console.log("=" .repeat(50))

  try {
    const users = await getAllUsers()
    
    console.log(`📊 Found ${users.length} users in DynamoDB:`)
    
    if (users.length === 0) {
      console.log("❌ No users found in DynamoDB!")
      console.log("   This explains why login is failing.")
      console.log("   You need to create the Super Admin user first.")
    } else {
      users.forEach((user, index) => {
        console.log(`\n👤 User ${index + 1}:`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Name: ${user.name}`)
        console.log(`   Status: ${user.status}`)
        console.log(`   Roles: ${user.roles_json}`)
        console.log(`   Has Password: ${user.hashed_password ? 'Yes' : 'No'}`)
        console.log(`   MFA Enabled: ${user.mfa_enabled}`)
      })
    }
    
  } catch (error) {
    console.error("❌ Error checking DynamoDB users:", error.message)
    
    if (error.message.includes('UnrecognizedClientException')) {
      console.log("\n🔧 AWS Credentials Issue:")
      console.log("   - Check your AWS_ACCESS_KEY_ID")
      console.log("   - Check your AWS_SECRET_ACCESS_KEY") 
      console.log("   - Check your AWS_REGION")
      console.log("   - Ensure the credentials have DynamoDB permissions")
    }
  }
}

if (require.main === module) {
  checkDynamoDBUsers().catch(console.error)
}

export { checkDynamoDBUsers }