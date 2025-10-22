// Add custom jest matchers or global test setup here

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key'
process.env.REFRESH_SECRET = 'test-refresh-secret-key'
process.env.AWS_REGION = 'us-east-1'

// Global test utilities
global.testUtils = {
  // Mock customer data
  createMockCustomer: (overrides = {}) => ({
    id: 'cust_test_123',
    email: 'test@example.com',
    name: 'Test Customer',
    role: 'customer',
    status: 'active',
    created_at: new Date().toISOString(),
    ...overrides
  }),

  // Mock order data
  createMockOrder: (overrides = {}) => ({
    id: 'order_test_123',
    customer_id: 'cust_test_123',
    stall_id: 'stall_test_123',
    status: 'pending',
    items: [
      {
        product_id: 'prod_test_123',
        quantity: 1,
        unit_price_cents: 1000,
        total_price_cents: 1000
      }
    ],
    subtotal_cents: 1000,
    tax_cents: 80,
    total_cents: 1080,
    created_at: new Date().toISOString(),
    ...overrides
  }),

  // Mock cart data
  createMockCart: (overrides = {}) => ({
    id: 'cart_test_123',
    customer_id: 'cust_test_123',
    items: [],
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides
  }),

  // Mock product data
  createMockProduct: (overrides = {}) => ({
    id: 'prod_test_123',
    name: 'Test Product',
    description: 'A test product for unit testing',
    price_cents: 1000,
    status: 'active',
    stall_id: 'stall_test_123',
    ...overrides
  }),

  // Mock stall data
  createMockStall: (overrides = {}) => ({
    id: 'stall_test_123',
    name: 'Test Stall',
    description: 'A test stall for unit testing',
    status: 'active',
    operating_hours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' }
    },
    ...overrides
  })
}

// Console log suppression for cleaner test output
const originalConsoleLog = console.log
const originalConsoleError = console.error

console.log = (...args) => {
  // Only show logs that contain test markers or are from test utilities
  if (args.some(arg => 
    typeof arg === 'string' && 
    (arg.includes('✅') || arg.includes('❌') || arg.includes('Test'))
  )) {
    originalConsoleLog(...args)
  }
}

console.error = (...args) => {
  // Always show errors unless they're expected test errors
  if (!args.some(arg => 
    typeof arg === 'string' && 
    arg.includes('Expected test error')
  )) {
    originalConsoleError(...args)
  }
}
