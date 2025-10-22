#!/usr/bin/env tsx

/**
 * Development Database Setup Script
 * Sets up DynamoDB tables for local development
 */

import { dynamoClient } from '../lib/dynamodb/client'

async function setupDevelopmentDatabase() {
  console.log('🚀 Setting up development database...')
  
  try {
    // Test connection first
    const { ListTablesCommand } = await import('@aws-sdk/client-dynamodb')
    await dynamoClient.send(new ListTablesCommand({}))
    console.log('✅ DynamoDB connection successful')
    
    // Run table creation
    console.log('📋 Creating DynamoDB tables...')
    const { execSync } = require('child_process')
    
    try {
      execSync('npm run create-dynamodb-tables', { stdio: 'inherit' })
      console.log('✅ DynamoDB tables created successfully')
    } catch (error) {
      console.error('❌ Failed to create DynamoDB tables:', error)
      console.log('\n💡 Make sure your AWS credentials are configured correctly:')
      console.log('   - AWS_ACCESS_KEY_ID')
      console.log('   - AWS_SECRET_ACCESS_KEY') 
      console.log('   - AWS_REGION')
      return false
    }
    
    // Test table access
    console.log('🔍 Testing table access...')
    try {
      const { DescribeTableCommand } = await import('@aws-sdk/client-dynamodb')
      await dynamoClient.send(new DescribeTableCommand({ TableName: 'xianfeast_users' }))
      console.log('✅ Tables are accessible')
    } catch (error) {
      console.warn('⚠️  Tables created but may not be ready yet')
    }
    
    console.log('\n🎉 Development database setup complete!')
    console.log('📝 You can now:')
    console.log('   - Create customer accounts')
    console.log('   - Add items to cart')
    console.log('   - Place orders')
    console.log('   - Use all database features')
    
    return true
    
  } catch (error: any) {
    console.error('❌ Database setup failed:', error.message)
    
    if (error.message?.includes('security token') || error.message?.includes('credentials')) {
      console.log('\n💡 AWS Credentials Issue:')
      console.log('   Please check your .env file and ensure these are set:')
      console.log('   - AWS_ACCESS_KEY_ID=your_access_key')
      console.log('   - AWS_SECRET_ACCESS_KEY=your_secret_key')
      console.log('   - AWS_REGION=your_region (e.g., us-east-1)')
    } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
      console.log('\n💡 Network Issue:')
      console.log('   - Check your internet connection')
      console.log('   - Verify AWS region is correct')
      console.log('   - Try again in a few moments')
    } else {
      console.log('\n💡 For now, the application will work with local storage only.')
      console.log('   - Cart items are saved in your browser')
      console.log('   - Data won\'t persist across devices')
      console.log('   - Some features may be limited')
    }
    
    return false
  }
}

async function main() {
  console.log('🔧 XianFeast Development Database Setup')
  console.log('=====================================\n')
  
  const success = await setupDevelopmentDatabase()
  
  if (success) {
    console.log('\n✨ Setup complete! Your development environment is ready.')
  } else {
    console.log('\n⚠️  Setup incomplete, but the application will still work with limited functionality.')
  }
  
  console.log('\n🌐 Access your application at: http://localhost:3000')
  console.log('📚 Check the documentation in docs/ for more information.')
}

if (require.main === module) {
  main().catch(console.error)
}