# Customer Ordering System Test Suite

This directory contains a comprehensive test suite for the XianFeast customer ordering system, covering all aspects from unit tests to accessibility compliance.

## Test Structure

```
__tests__/
├── README.md                           # This documentation
├── test-runner.ts                      # Test orchestration and CLI
├── e2e/
│   └── customer-journey.test.ts        # End-to-end customer lifecycle tests
├── performance/
│   └── concurrent-users.test.ts        # Load and performance tests
└── accessibility/
    └── wcag-compliance.test.ts         # WCAG accessibility compliance tests

lib/
├── auth/__tests__/
│   └── customer-auth.test.ts           # Authentication flow unit tests
├── dynamodb/__tests__/
│   ├── cart-operations.test.ts         # Cart management unit tests
│   └── order-processing.test.ts        # Order processing unit tests
└── error-handling/__tests__/
    └── error-handling.test.ts          # Form validation and error handling tests

app/api/__tests__/
├── customer-auth-integration.test.ts   # Authentication API integration tests
└── customer-orders-integration.test.ts # Order management API integration tests
```

## Test Categories

### 1. Unit Tests
**Location**: `lib/**/__tests__/`
**Purpose**: Test individual functions and components in isolation
**Coverage**:
- Customer authentication flows (signup, magic link, login)
- Shopping cart operations (add, remove, update, persistence)
- Order processing (creation, status updates, validation)
- Form validation and error handling
- Input sanitization and security

### 2. Integration Tests
**Location**: `app/api/__tests__/`
**Purpose**: Test API endpoints and service interactions
**Coverage**:
- Customer authentication API endpoints
- Order management API flows
- Database operations with DynamoDB
- Email service integration
- Session management and JWT handling

### 3. End-to-End Tests
**Location**: `__tests__/e2e/`
**Purpose**: Test complete user journeys from start to finish
**Coverage**:
- Full customer lifecycle: signup → browse → order → track
- Error scenarios and recovery flows
- Cross-component integration
- Data consistency across the system

### 4. Performance Tests
**Location**: `__tests__/performance/`
**Purpose**: Validate system performance under load
**Coverage**:
- Concurrent user scenarios (50+ simultaneous users)
- Database query performance and optimization
- Email service throughput
- Memory usage and resource management
- Rate limiting and backpressure handling

### 5. Accessibility Tests
**Location**: `__tests__/accessibility/`
**Purpose**: Ensure WCAG compliance and inclusive design
**Coverage**:
- Form accessibility (labels, ARIA attributes, error handling)
- Keyboard navigation support
- Screen reader compatibility
- Color contrast requirements (WCAG AA/AAA)
- Focus management and visual indicators

## Running Tests

### Quick Start
```bash
# Run all tests
npm run test:customer

# Run specific test categories
npm run test:customer:unit
npm run test:customer:integration
npm run test:customer:e2e
npm run test:customer:performance
npm run test:customer:accessibility

# Run with coverage report
npm run test:customer:coverage

# List available test suites
npm run test:customer list
```

### Advanced Usage
```bash
# Run specific test suite
npm run test:customer suite "auth"

# Run individual test file
npm test -- lib/error-handling/__tests__/error-handling.test.ts

# Watch mode for development
npm run test:watch
```

## Test Configuration

### Jest Configuration
- **File**: `jest.config.js`
- **Environment**: Node.js with TypeScript support
- **Timeout**: 15 seconds (configurable per test suite)
- **Coverage**: Comprehensive coverage reporting for lib/, app/api/, and components/

### Test Setup
- **File**: `jest.setup.js`
- **Features**:
  - Mock environment variables
  - Global test utilities for creating mock data
  - Console log filtering for cleaner output
  - Common test helpers and fixtures

## Test Data and Mocking

### Mock Data Factories
The test suite includes factories for creating consistent test data:

```typescript
// Available in all tests via global.testUtils
global.testUtils.createMockCustomer()
global.testUtils.createMockOrder()
global.testUtils.createMockCart()
global.testUtils.createMockProduct()
global.testUtils.createMockStall()
```

### Mocking Strategy
- **External Services**: All AWS, email, and third-party services are mocked
- **Database Operations**: DynamoDB operations are mocked with realistic responses
- **Authentication**: JWT and session management are mocked for consistent testing
- **Time-sensitive Operations**: Date/time operations use controlled mock values

## Test Requirements Coverage

### Authentication Requirements (1.1-1.5)
✅ **Covered by**: `customer-auth.test.ts`, `customer-auth-integration.test.ts`
- Magic link generation and verification
- Password setup and validation
- Customer account creation and activation
- Session management and JWT handling

### Dashboard and Navigation (2.1-2.5)
✅ **Covered by**: `customer-journey.test.ts`, `wcag-compliance.test.ts`
- Customer dashboard functionality
- Stall browsing and product discovery
- Navigation accessibility and usability

### Cart Management (3.1-3.5)
✅ **Covered by**: `cart-operations.test.ts`, `customer-journey.test.ts`
- Add/remove/update cart operations
- Cart persistence and expiration
- Real-time total calculations
- Cart validation and error handling

### Order Processing (4.1-4.5)
✅ **Covered by**: `order-processing.test.ts`, `customer-orders-integration.test.ts`
- Order creation and scheduling
- Status tracking and updates
- Email notifications
- Business integration

### Order Tracking (5.1-5.5)
✅ **Covered by**: `customer-journey.test.ts`, `wcag-compliance.test.ts`
- Order history and filtering
- Status timeline display
- Real-time updates
- Accessibility compliance

### Email Notifications (6.1-6.4)
✅ **Covered by**: `customer-auth.test.ts`, `order-processing.test.ts`
- Branded HTML email templates
- Customer and business notifications
- Email delivery tracking
- Template rendering system

### Data Integration (7.1-7.4)
✅ **Covered by**: `cart-operations.test.ts`, `order-processing.test.ts`
- DynamoDB data consistency
- Referential integrity
- Performance optimization
- Transaction handling

### User Experience (8.1-8.5)
✅ **Covered by**: `wcag-compliance.test.ts`, `error-handling.test.ts`
- Responsive design testing
- Theme support validation
- Error handling and recovery
- Accessibility compliance

## Performance Benchmarks

### Expected Performance Metrics
- **Authentication**: < 500ms per operation
- **Cart Operations**: < 200ms per item
- **Order Creation**: < 1000ms end-to-end
- **Database Queries**: < 500ms for standard operations
- **Concurrent Users**: Support 50+ simultaneous users
- **Email Delivery**: < 60 seconds for notifications

### Load Testing Scenarios
- 50 concurrent customer signups
- 100 simultaneous cart operations
- 30 concurrent order placements
- 1000+ order history queries
- Bulk email notifications (100+ emails)

## Accessibility Standards

### WCAG 2.1 Compliance
- **Level AA**: All customer interfaces meet AA standards
- **Color Contrast**: 4.5:1 minimum ratio for normal text
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Compatible with NVDA, JAWS, VoiceOver
- **Focus Management**: Visible focus indicators and logical tab order

### Tested Components
- Customer signup and login forms
- Product browsing and filtering
- Shopping cart interface
- Order tracking and history
- Error messages and notifications

## Continuous Integration

### Pre-commit Hooks
```bash
# Run before each commit
npm run test:customer:unit
npm run test:customer:accessibility
```

### CI/CD Pipeline
```bash
# Full test suite for deployment
npm run test:customer
npm run test:customer:coverage
```

### Quality Gates
- **Unit Test Coverage**: > 80%
- **Integration Test Coverage**: > 70%
- **Accessibility Compliance**: 100% WCAG AA
- **Performance Benchmarks**: All tests must pass
- **Zero Critical Security Issues**: Input validation and sanitization

## Troubleshooting

### Common Issues

#### Module Import Errors
```bash
# If you see "Unexpected token 'export'" errors
npm install --save-dev @babel/preset-env
# Update jest.config.js with proper ES module handling
```

#### Test Timeouts
```bash
# Increase timeout for slow tests
jest.setTimeout(30000)
# Or use --testTimeout flag
```

#### Mock Issues
```bash
# Clear all mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})
```

### Debug Mode
```bash
# Run tests with debug output
DEBUG=true npm run test:customer

# Run specific test with verbose output
npm test -- --verbose lib/error-handling/__tests__/error-handling.test.ts
```

## Contributing

### Adding New Tests
1. Follow the existing test structure and naming conventions
2. Use the provided mock data factories
3. Include both positive and negative test cases
4. Add accessibility tests for new UI components
5. Update this documentation with new test coverage

### Test Guidelines
- **Descriptive Names**: Test names should clearly describe what is being tested
- **Arrange-Act-Assert**: Follow the AAA pattern for test structure
- **Isolation**: Each test should be independent and not rely on others
- **Mocking**: Mock external dependencies to ensure test reliability
- **Coverage**: Aim for comprehensive coverage of business logic

## Reporting

### Coverage Reports
Coverage reports are generated in the `coverage/` directory:
- **HTML Report**: `coverage/lcov-report/index.html`
- **Text Summary**: Displayed in console after test runs
- **LCOV Format**: `coverage/lcov.info` for CI integration

### Test Results
Test results include:
- Pass/fail status for each test suite
- Execution time and performance metrics
- Coverage percentages by file and function
- Accessibility compliance scores
- Performance benchmark results

---

## Summary

This comprehensive test suite ensures the XianFeast customer ordering system meets all functional, performance, and accessibility requirements. The tests provide confidence in system reliability, user experience quality, and compliance with web standards.

For questions or issues with the test suite, refer to the troubleshooting section or check the individual test files for specific implementation details.