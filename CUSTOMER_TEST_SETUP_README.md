# Customer Ordering System - Test Setup Documentation

## Overview

This document describes the comprehensive test customer and validation setup for the XianFeast Customer Ordering System. The test setup implements **Task 12** from the customer ordering system specification, providing a complete testing environment with sample data, automated test scripts, and validation tools.

## Test Customer Details

### Primary Test Account
- **Name**: Willie Macharia
- **Email**: dangwenyi@emtechhouse.co.ke
- **Password**: TestCustomer123!
- **Role**: Customer
- **Status**: Active

### Customer Features Configured
- ✅ Customer preferences (dietary restrictions, favorite stalls, notifications)
- ✅ Order statistics (total orders, spending, favorite products)
- ✅ Shopping cart with persistent items
- ✅ Order history with various statuses
- ✅ Default delivery address

## Test Data Structure

### Businesses (2)
1. **Nairobi Food Court**
   - Address: 123 Kimathi Street, Nairobi CBD
   - Phone: +254700123456
   - Email: manager@nairobifoodcourt.co.ke
   - Stalls: Mama Njeri's Kitchen, Spice Route Indian

2. **Westlands Eatery Hub**
   - Address: 456 Waiyaki Way, Westlands
   - Phone: +254700789012
   - Email: info@westlandseatery.co.ke
   - Stalls: Fresh Salad Bar, Burger Junction

### Stalls (4)
1. **Mama Njeri's Kitchen** (Kenyan Traditional)
   - Capacity: 50 orders/day
   - Hours: Mon-Fri 8:00-18:00, Sat 9:00-16:00, Sun closed
   - Location: Stall 1A, Nairobi Food Court

2. **Spice Route Indian** (Indian Cuisine)
   - Capacity: 40 orders/day
   - Hours: Mon-Thu 11:00-21:00, Fri-Sat 11:00-22:00, Sun 12:00-20:00
   - Location: Stall 2B, Nairobi Food Court

3. **Fresh Salad Bar** (Healthy/Salads)
   - Capacity: 60 orders/day
   - Hours: Mon-Fri 7:00-17:00, Sat 8:00-15:00, Sun closed
   - Location: Counter 1, Westlands Eatery Hub

4. **Burger Junction** (Fast Food)
   - Capacity: 80 orders/day
   - Hours: Mon-Thu 10:00-22:00, Fri-Sat 10:00-23:00, Sun 11:00-21:00
   - Location: Counter 2, Westlands Eatery Hub

### Products (8)
| Product | Stall | Price (KES) | Prep Time | Dietary |
|---------|-------|-------------|-----------|---------|
| Nyama Choma with Ugali | Mama Njeri's | 850.00 | 25 min | Gluten-free option |
| Githeri Special | Mama Njeri's | 450.00 | 15 min | Vegetarian, Vegan option |
| Chicken Biryani | Spice Route | 750.00 | 30 min | Halal |
| Paneer Butter Masala | Spice Route | 650.00 | 20 min | Vegetarian |
| Mediterranean Quinoa Bowl | Fresh Salad | 550.00 | 10 min | Vegetarian, Gluten-free |
| Green Detox Smoothie | Fresh Salad | 350.00 | 5 min | Vegan, Gluten-free, Dairy-free |
| Classic Beef Burger | Burger Junction | 600.00 | 12 min | - |
| Crispy Chicken Wings | Burger Junction | 500.00 | 15 min | Halal option |

### Sample Orders (3)
1. **Completed Order** - Nyama Choma (850 KES) - 2 days ago
2. **Confirmed Order** - Quinoa Bowl + Smoothie (900 KES) - Tomorrow
3. **Pending Order** - Biryani + Paneer (1,400 KES) - In 3 days

### Shopping Cart Items (2)
- 2x Classic Beef Burger (600 KES each) - No pickles, extra cheese
- 1x Crispy Chicken Wings (500 KES) - Extra spicy sauce

## Available Test Scripts

### 1. Setup Scripts
```bash
# Demo test setup (no AWS required)
npm run demo-test-customer

# Full test setup (requires AWS credentials)
npm run create-test-customer
```

### 2. Test Execution Scripts
```bash
# End-to-end customer journey tests
npm run test-customer-journey

# Data consistency validation
npm run validate-data-consistency

# Complete test suite (setup + tests + validation)
npm run test-customer-suite
```

### 3. Individual Test Components
- **Authentication Tests**: Login, session management, password security
- **Stall Browsing Tests**: Product discovery, filtering, search
- **Cart Operations Tests**: Add/remove items, quantity updates, persistence
- **Order Placement Tests**: Order creation, scheduling, validation
- **Order Tracking Tests**: Status updates, history, details retrieval
- **Data Consistency Tests**: Cross-view validation, referential integrity

## Test Scenarios Covered

### 1. Customer Authentication Flow
- ✅ Customer signup with magic link
- ✅ Email verification and password setup
- ✅ Login with email/password
- ✅ Session management and validation
- ✅ Password security checks

### 2. Stall Browsing and Product Discovery
- ✅ Fetch available stalls with filtering
- ✅ View stall details and operating hours
- ✅ Browse products by stall
- ✅ Filter products by price, dietary restrictions
- ✅ Search functionality

### 3. Shopping Cart Functionality
- ✅ Add products to cart with quantities
- ✅ Update item quantities
- ✅ Remove items from cart
- ✅ Cart persistence across sessions
- ✅ Scheduling items for specific dates
- ✅ Special instructions handling

### 4. Order Placement and Scheduling
- ✅ Place orders from cart
- ✅ Schedule orders for future dates
- ✅ Order validation (availability, business rules)
- ✅ Payment method selection
- ✅ Order confirmation emails

### 5. Order Tracking and Management
- ✅ View order history with filtering
- ✅ Track order status updates
- ✅ View detailed order information
- ✅ Order modification (where applicable)
- ✅ Real-time status notifications

### 6. Customer Profile Management
- ✅ Update personal information
- ✅ Manage dietary preferences
- ✅ Set favorite stalls
- ✅ Configure notification preferences
- ✅ View order statistics and insights

## Data Consistency Validation

### Referential Integrity Checks
- ✅ Business owner references
- ✅ Stall business references
- ✅ Product stall and business references
- ✅ Order customer, business, and stall references

### Business Rules Validation
- ✅ Product pricing rules (positive prices, valid inventory)
- ✅ Order amount validation (matches item totals)
- ✅ Stall capacity and operating hours
- ✅ Customer role and permission validation

### Cross-View Consistency
- ✅ Customer insights match database records
- ✅ Order counts consistent across views
- ✅ Cart data synchronized
- ✅ Statistics accuracy validation

### Security Constraints
- ✅ Customer role validation
- ✅ Data access boundaries (customers can only access their own data)
- ✅ Password hashing and authentication security
- ✅ Session management security

## Manual Testing Guide

### Prerequisites
1. Start the development server: `npm run dev`
2. Ensure test data is created: `npm run create-test-customer` (with AWS) or `npm run demo-test-customer` (demo)

### Test Scenarios

#### 1. Customer Login and Dashboard
1. Navigate to: `http://localhost:3000/customer/login`
2. Login with: `dangwenyi@emtechhouse.co.ke` / `TestCustomer123!`
3. Verify dashboard loads with:
   - Welcome message with customer name
   - Quick action buttons
   - Upcoming orders section
   - Recent activity

#### 2. Stall Browsing
1. From dashboard, click "Browse Stalls"
2. Verify stall grid displays 4 stalls
3. Test filtering by cuisine type
4. Click on a stall to view details
5. Verify products are displayed with prices and descriptions

#### 3. Shopping Cart Operations
1. Add products to cart from stall pages
2. Verify cart sidebar updates with item count
3. Navigate to cart page
4. Test quantity updates
5. Test item removal
6. Verify total calculations

#### 4. Order Placement
1. From cart, proceed to checkout
2. Select delivery method (pickup/delivery)
3. Choose scheduling date/time
4. Add special instructions
5. Place order and verify confirmation

#### 5. Order History and Tracking
1. Navigate to "My Orders"
2. Verify order history displays with correct statuses
3. Click on an order to view details
4. Verify order items, totals, and timeline

#### 6. Customer Profile
1. Navigate to profile/settings
2. Update personal information
3. Modify dietary preferences
4. Update notification settings
5. Verify changes are saved

### Mobile Testing
- Test all scenarios on mobile devices
- Verify responsive design
- Test touch interactions
- Verify mobile navigation

### Theme Testing
- Switch between light and dark themes
- Verify consistent styling
- Test theme persistence across sessions

## Performance Testing

### Load Testing Scenarios
- Concurrent user browsing
- Multiple cart operations
- Simultaneous order placement
- Database query performance

### Performance Metrics
- Page load times < 2 seconds
- API response times < 500ms
- Cart operations < 200ms
- Search results < 1 second

## Troubleshooting

### Common Issues

#### AWS Credentials Error
```
UnrecognizedClientException: The security token included in the request is invalid
```
**Solution**: Configure AWS credentials in `.env` file:
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

#### DynamoDB Table Not Found
**Solution**: Create DynamoDB tables first:
```bash
npm run create-dynamodb-tables
```

#### Test Customer Already Exists
**Solution**: The script will update existing customer data automatically.

#### Email Service Errors
**Solution**: Email errors are expected in test environment. Check console for template generation confirmation.

### Debug Mode
Enable debug logging by setting:
```
DEBUG=true
```

## Production Readiness Checklist

### ✅ Completed Features
- [x] Customer authentication system
- [x] Stall browsing and product discovery
- [x] Shopping cart functionality
- [x] Order placement and scheduling
- [x] Order tracking and management
- [x] Customer profile management
- [x] Data consistency validation
- [x] Security implementation
- [x] Responsive design
- [x] Theme support
- [x] Error handling
- [x] Performance optimization

### 🔄 Ongoing Monitoring
- [ ] Performance metrics in production
- [ ] Error rate monitoring
- [ ] User behavior analytics
- [ ] Database performance optimization
- [ ] Security audit logs

## Support and Maintenance

### Regular Testing
- Run test suite after major changes
- Validate data consistency weekly
- Performance testing under load
- Security vulnerability scanning

### Data Backup
- Regular DynamoDB backups
- Customer data export capabilities
- Order history preservation
- Cart data recovery procedures

### Monitoring
- Application performance monitoring
- Database query optimization
- Error tracking and alerting
- User experience metrics

## Contact Information

For questions about the test setup or customer ordering system:

- **Test Customer**: Willie Macharia (dangwenyi@emtechhouse.co.ke)
- **System**: XianFeast Customer Ordering System
- **Environment**: Development/Testing
- **Database**: DynamoDB with comprehensive test data
- **Documentation**: This README and inline code comments

---

**Last Updated**: October 21, 2025
**Version**: 1.0.0
**Status**: Ready for Production Testing