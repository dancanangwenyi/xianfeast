/**
 * Comprehensive Test Suite Runner
 * Orchestrates all customer ordering system tests
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'

interface TestSuite {
  name: string
  path: string
  description: string
  timeout?: number
}

interface TestResults {
  suite: string
  passed: boolean
  duration: number
  error?: string
}

class CustomerOrderingTestRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'Unit Tests - Authentication',
      path: 'lib/auth/__tests__/customer-auth.test.ts',
      description: 'Customer authentication flow unit tests'
    },
    {
      name: 'Unit Tests - Cart Operations',
      path: 'lib/dynamodb/__tests__/cart-operations.test.ts',
      description: 'Shopping cart management unit tests'
    },
    {
      name: 'Unit Tests - Order Processing',
      path: 'lib/dynamodb/__tests__/order-processing.test.ts',
      description: 'Order creation and management unit tests'
    },
    {
      name: 'Unit Tests - Error Handling',
      path: 'lib/error-handling/__tests__/error-handling.test.ts',
      description: 'Form validation and error handling unit tests'
    },
    {
      name: 'Integration Tests - Auth APIs',
      path: 'app/api/__tests__/customer-auth-integration.test.ts',
      description: 'Customer authentication API integration tests'
    },
    {
      name: 'Integration Tests - Order APIs',
      path: 'app/api/__tests__/customer-orders-integration.test.ts',
      description: 'Customer order management API integration tests'
    },
    {
      name: 'E2E Tests - Customer Journey',
      path: '__tests__/e2e/customer-journey.test.ts',
      description: 'Complete customer lifecycle end-to-end tests',
      timeout: 30000
    },
    {
      name: 'Performance Tests - Concurrent Users',
      path: '__tests__/performance/concurrent-users.test.ts',
      description: 'System performance under concurrent load tests',
      timeout: 60000
    },
    {
      name: 'Accessibility Tests - WCAG Compliance',
      path: '__tests__/accessibility/wcag-compliance.test.ts',
      description: 'Web accessibility compliance tests'
    }
  ]

  private results: TestResults[] = []

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Customer Ordering System Test Suite')
    console.log('=' .repeat(60))

    const startTime = Date.now()

    for (const suite of this.testSuites) {
      await this.runTestSuite(suite)
    }

    const totalTime = Date.now() - startTime
    this.printSummary(totalTime)
  }

  async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`\n📋 Running: ${suite.name}`)
    console.log(`📝 ${suite.description}`)
    
    if (!existsSync(suite.path)) {
      console.log(`❌ Test file not found: ${suite.path}`)
      this.results.push({
        suite: suite.name,
        passed: false,
        duration: 0,
        error: 'Test file not found'
      })
      return
    }

    const startTime = Date.now()

    try {
      const timeout = suite.timeout || 15000
      const command = `npx jest ${suite.path} --verbose --testTimeout=${timeout}`
      
      execSync(command, { 
        stdio: 'inherit',
        timeout: timeout + 5000 // Add buffer to Jest timeout
      })

      const duration = Date.now() - startTime
      console.log(`✅ ${suite.name} completed in ${duration}ms`)
      
      this.results.push({
        suite: suite.name,
        passed: true,
        duration
      })

    } catch (error) {
      const duration = Date.now() - startTime
      console.log(`❌ ${suite.name} failed after ${duration}ms`)
      
      this.results.push({
        suite: suite.name,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  async runSpecificSuite(suiteName: string): Promise<void> {
    const suite = this.testSuites.find(s => 
      s.name.toLowerCase().includes(suiteName.toLowerCase())
    )

    if (!suite) {
      console.log(`❌ Test suite not found: ${suiteName}`)
      console.log('Available suites:')
      this.testSuites.forEach(s => console.log(`  - ${s.name}`))
      return
    }

    console.log(`🎯 Running specific test suite: ${suite.name}`)
    await this.runTestSuite(suite)
    this.printSummary(this.results[0]?.duration || 0)
  }

  async runByCategory(category: 'unit' | 'integration' | 'e2e' | 'performance' | 'accessibility'): Promise<void> {
    const categoryMap = {
      unit: ['Unit Tests'],
      integration: ['Integration Tests'],
      e2e: ['E2E Tests'],
      performance: ['Performance Tests'],
      accessibility: ['Accessibility Tests']
    }

    const suitesToRun = this.testSuites.filter(suite =>
      categoryMap[category].some(cat => suite.name.includes(cat))
    )

    if (suitesToRun.length === 0) {
      console.log(`❌ No test suites found for category: ${category}`)
      return
    }

    console.log(`🎯 Running ${category} tests (${suitesToRun.length} suites)`)
    
    const startTime = Date.now()
    for (const suite of suitesToRun) {
      await this.runTestSuite(suite)
    }
    const totalTime = Date.now() - startTime

    this.printSummary(totalTime)
  }

  private printSummary(totalTime: number): void {
    console.log('\n' + '=' .repeat(60))
    console.log('📊 TEST SUITE SUMMARY')
    console.log('=' .repeat(60))

    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    const total = this.results.length

    console.log(`Total Suites: ${total}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏱️  Total Time: ${totalTime}ms`)

    if (failed > 0) {
      console.log('\n❌ FAILED SUITES:')
      this.results
        .filter(r => !r.passed)
        .forEach(result => {
          console.log(`  - ${result.suite}: ${result.error}`)
        })
    }

    console.log('\n📋 DETAILED RESULTS:')
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌'
      const duration = `${result.duration}ms`
      console.log(`  ${status} ${result.suite.padEnd(35)} ${duration}`)
    })

    const successRate = total > 0 ? (passed / total * 100).toFixed(1) : '0'
    console.log(`\n🎯 Success Rate: ${successRate}%`)

    if (passed === total) {
      console.log('\n🎉 All tests passed! Customer ordering system is ready for production.')
    } else {
      console.log('\n⚠️  Some tests failed. Please review and fix issues before deployment.')
    }
  }

  listAvailableTests(): void {
    console.log('📋 Available Test Suites:')
    console.log('=' .repeat(50))
    
    this.testSuites.forEach((suite, index) => {
      console.log(`${index + 1}. ${suite.name}`)
      console.log(`   📝 ${suite.description}`)
      console.log(`   📁 ${suite.path}`)
      if (suite.timeout) {
        console.log(`   ⏱️  Timeout: ${suite.timeout}ms`)
      }
      console.log()
    })
  }
}

// CLI Interface
async function main() {
  const runner = new CustomerOrderingTestRunner()
  const args = process.argv.slice(2)

  if (args.length === 0) {
    // Run all tests by default
    await runner.runAllTests()
    return
  }

  const command = args[0].toLowerCase()

  switch (command) {
    case 'list':
      runner.listAvailableTests()
      break

    case 'unit':
      await runner.runByCategory('unit')
      break

    case 'integration':
      await runner.runByCategory('integration')
      break

    case 'e2e':
      await runner.runByCategory('e2e')
      break

    case 'performance':
      await runner.runByCategory('performance')
      break

    case 'accessibility':
      await runner.runByCategory('accessibility')
      break

    case 'suite':
      if (args[1]) {
        await runner.runSpecificSuite(args[1])
      } else {
        console.log('❌ Please specify a suite name')
        console.log('Usage: npm run test:customer suite "auth"')
      }
      break

    default:
      console.log('❌ Unknown command:', command)
      console.log('Available commands:')
      console.log('  npm run test:customer           # Run all tests')
      console.log('  npm run test:customer list      # List available tests')
      console.log('  npm run test:customer unit      # Run unit tests only')
      console.log('  npm run test:customer integration # Run integration tests only')
      console.log('  npm run test:customer e2e       # Run E2E tests only')
      console.log('  npm run test:customer performance # Run performance tests only')
      console.log('  npm run test:customer accessibility # Run accessibility tests only')
      console.log('  npm run test:customer suite "auth" # Run specific suite')
  }
}

// Export for programmatic use
export { CustomerOrderingTestRunner }

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error)
    process.exit(1)
  })
}