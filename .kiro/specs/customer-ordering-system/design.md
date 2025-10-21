# Customer Ordering System Design

## Overview

The Customer Ordering System is a comprehensive solution that enables end-users to discover, order, and track meals from various stalls within businesses. The system integrates seamlessly with the existing XianFeast platform, utilizing DynamoDB for data persistence, magic link authentication for security, and a modern React-based interface for optimal user experience.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Customer UI   │    │   Business UI   │    │   Admin UI      │
│   (React/Next)  │    │   (React/Next)  │    │   (React/Next)  │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     API Layer (Next.js)   │
                    │   - Authentication APIs   │
                    │   - Customer APIs         │
                    │   - Order APIs           │
                    │   - Email Service APIs   │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     Service Layer        │
                    │   - Auth Service         │
                    │   - Order Service        │
                    │   - Email Service        │
                    │   - Cart Service         │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     Data Layer           │
                    │   - DynamoDB Client      │
                    │   - User Operations      │
                    │   - Order Operations     │
                    │   - Product Operations   │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │       DynamoDB           │
                    │   - Users Table          │
                    │   - Orders Table         │
                    │   - Order Items Table    │
                    │   - Magic Links Table    │
                    └─────────────────────────────┘
```

### Authentication Flow

```
Customer Signup → Email Magic Link → Password Setup → Login → Dashboard
     │                   │               │            │         │
     ├─ Validate Email    ├─ Send HTML    ├─ Hash     ├─ JWT    ├─ Session
     ├─ Create User       ├─ Store Token  ├─ Store    ├─ Cookie ├─ Redirect
     └─ Send Email        └─ Set Expiry   └─ Activate └─ Auth   └─ Browse
```

## Components and Interfaces

### 1. Customer Authentication Components

#### Customer Signup Page (`/customer/signup`)
- **Purpose**: Collect customer information and initiate magic link flow
- **Components**: 
  - `CustomerSignupForm`: Email/name input with validation
  - `SignupSuccessMessage`: Confirmation of email sent
- **API Integration**: `POST /api/auth/customer/signup`

#### Magic Link Handler (`/auth/customer/magic`)
- **Purpose**: Process magic link clicks and redirect to password setup
- **Components**:
  - `MagicLinkValidator`: Verify token and user status
  - `PasswordSetupForm`: Secure password creation interface
- **API Integration**: `POST /api/auth/customer/verify-magic`, `POST /api/auth/customer/set-password`

#### Customer Login Page (`/customer/login`)
- **Purpose**: Standard email/password authentication for returning customers
- **Components**:
  - `CustomerLoginForm`: Credentials input with "Forgot Password" option
  - `LoginErrorHandler`: User-friendly error messaging
- **API Integration**: `POST /api/auth/customer/login`

### 2. Customer Dashboard Components

#### Main Dashboard (`/customer/dashboard`)
- **Purpose**: Central hub for customer activities and quick actions
- **Components**:
  - `DashboardHeader`: Welcome message, account info, theme toggle
  - `QuickActions`: Browse stalls, view orders, account settings
  - `UpcomingOrders`: Next scheduled meals with countdown timers
  - `RecentActivity`: Order history and status updates
- **Data Sources**: Customer profile, recent orders, upcoming schedules

#### Stall Browser (`/customer/stalls`)
- **Purpose**: Discover and explore available food stalls
- **Components**:
  - `StallGrid`: Responsive grid of stall cards with images and info
  - `StallFilters`: Filter by cuisine, price range, availability
  - `StallCard`: Individual stall preview with ratings and specialties
- **API Integration**: `GET /api/customer/stalls`

#### Product Catalog (`/customer/stalls/[stallId]`)
- **Purpose**: Browse products within a specific stall
- **Components**:
  - `StallHeader`: Stall information, hours, contact details
  - `ProductGrid`: Available products with images, descriptions, prices
  - `ProductCard`: Individual product with add-to-cart functionality
  - `CartSidebar`: Real-time cart updates and checkout preview
- **API Integration**: `GET /api/customer/stalls/[stallId]/products`

### 3. Cart and Ordering Components

#### Shopping Cart (`/customer/cart`)
- **Purpose**: Review and modify selected items before ordering
- **Components**:
  - `CartItemList`: Editable list of selected products with quantities
  - `OrderScheduling`: Date/time picker for meal scheduling
  - `OrderSummary`: Pricing breakdown, taxes, total cost
  - `CheckoutButton`: Proceed to order placement
- **State Management**: Persistent cart using localStorage and API sync

#### Order Placement (`/customer/checkout`)
- **Purpose**: Finalize order details and process payment
- **Components**:
  - `OrderReview`: Final confirmation of items, schedule, pricing
  - `DeliveryOptions`: Pickup vs delivery preferences
  - `PaymentMethod`: Payment selection (future: integrate payment gateway)
  - `PlaceOrderButton`: Submit order and trigger confirmations
- **API Integration**: `POST /api/customer/orders`

### 4. Order Management Components

#### Order History (`/customer/orders`)
- **Purpose**: View all past and current orders with status tracking
- **Components**:
  - `OrderList`: Chronological list of orders with status badges
  - `OrderFilters`: Filter by date range, status, stall
  - `OrderCard`: Summary view with expand option for details
- **API Integration**: `GET /api/customer/orders`

#### Order Details (`/customer/orders/[orderId]`)
- **Purpose**: Detailed view of specific order with tracking
- **Components**:
  - `OrderHeader`: Order ID, date, status, total cost
  - `OrderItems`: Detailed list of products ordered
  - `StatusTimeline`: Visual progress tracking with timestamps
  - `OrderActions`: Cancel, modify, reorder options (where applicable)
- **API Integration**: `GET /api/customer/orders/[orderId]`

## Data Models

### Extended User Model (Customer)
```typescript
interface Customer extends User {
  customer_preferences?: {
    dietary_restrictions: string[]
    favorite_stalls: string[]
    default_delivery_address?: string
    notification_preferences: {
      email: boolean
      sms: boolean
      push: boolean
    }
  }
  customer_stats?: {
    total_orders: number
    total_spent_cents: number
    favorite_products: string[]
    last_order_date?: string
  }
}
```

### Cart Model
```typescript
interface Cart {
  id: string
  customer_id: string
  items: CartItem[]
  created_at: string
  updated_at: string
  expires_at: string
}

interface CartItem {
  product_id: string
  stall_id: string
  quantity: number
  unit_price_cents: number
  scheduled_for?: string
  special_instructions?: string
}
```

### Enhanced Order Model
```typescript
interface CustomerOrder extends Order {
  delivery_address?: string
  delivery_instructions?: string
  estimated_ready_time?: string
  actual_ready_time?: string
  customer_rating?: number
  customer_review?: string
  notification_sent: boolean
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
}
```

### Magic Link Model
```typescript
interface CustomerMagicLink {
  id: string
  email: string
  token: string
  type: 'signup' | 'password_reset'
  expires_at: string
  used: boolean
  created_at: string
  user_id?: string
}
```

## Error Handling

### Authentication Errors
- **Invalid Magic Link**: Clear message with option to request new link
- **Expired Token**: Automatic redirect to signup/login with explanation
- **Account Already Exists**: Redirect to login with "Welcome back" message
- **Password Requirements**: Real-time validation with helpful hints

### Ordering Errors
- **Product Unavailable**: Remove from cart with notification and alternatives
- **Stall Closed**: Display hours and suggest similar stalls
- **Scheduling Conflicts**: Highlight available time slots
- **Payment Failures**: Clear error messages with retry options

### Data Errors
- **Network Issues**: Offline mode with cached data and sync on reconnect
- **Server Errors**: Graceful degradation with retry mechanisms
- **Validation Errors**: Field-level feedback with correction suggestions

## Testing Strategy

### Unit Tests
- **Authentication Flow**: Magic link generation, token validation, password hashing
- **Cart Operations**: Add/remove items, quantity updates, persistence
- **Order Processing**: Order creation, status updates, email triggers
- **Data Validation**: Input sanitization, business rule enforcement

### Integration Tests
- **API Endpoints**: Full request/response cycle testing
- **Database Operations**: CRUD operations with relationship integrity
- **Email Service**: Template rendering and delivery confirmation
- **Authentication Flow**: End-to-end signup and login processes

### End-to-End Tests
- **Customer Journey**: Signup → Browse → Order → Track → Complete
- **Cross-Platform**: Desktop, tablet, mobile responsiveness
- **Theme Switching**: Dark/light mode consistency
- **Error Scenarios**: Network failures, invalid inputs, edge cases

### Performance Tests
- **Load Testing**: Concurrent users browsing and ordering
- **Database Performance**: Query optimization and indexing validation
- **Email Delivery**: Bulk email sending under load
- **Cart Persistence**: Session management and data sync

## Security Considerations

### Authentication Security
- **Magic Links**: Time-limited tokens with single-use validation
- **Password Storage**: Argon2 hashing with proper salt generation
- **Session Management**: Secure JWT tokens with refresh mechanism
- **CSRF Protection**: Token-based protection for state-changing operations

### Data Protection
- **Input Validation**: Comprehensive sanitization and validation
- **SQL Injection Prevention**: Parameterized queries and ORM usage
- **XSS Protection**: Content Security Policy and output encoding
- **Rate Limiting**: API endpoint protection against abuse

### Privacy Compliance
- **Data Minimization**: Collect only necessary customer information
- **Consent Management**: Clear opt-in for marketing communications
- **Data Retention**: Automatic cleanup of expired sessions and tokens
- **Access Controls**: Role-based permissions for customer data access

## Email Templates

### Customer Signup Welcome Email
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to XianFeast</title>
    <style>
        /* Professional styling matching brand guidelines */
        .container { max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: bold; }
        .content { padding: 40px; background: white; }
        .button { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🍜 XianFeast</div>
            <h1 style="color: white; margin: 20px 0 0 0;">Welcome to The Immortal Dining Experience</h1>
        </div>
        <div class="content">
            <h2>Hello {{customerName}},</h2>
            <p>Welcome to XianFeast! We're excited to have you join our community of food lovers.</p>
            <p>To complete your account setup and start exploring amazing meals from local stalls, please click the button below:</p>
            <a href="{{magicLinkUrl}}" class="button">Set Up My Account</a>
            <p>This link will expire in 24 hours for your security.</p>
            <p>Once your account is set up, you'll be able to:</p>
            <ul>
                <li>Browse delicious meals from verified stalls</li>
                <li>Schedule orders for today, tomorrow, or the whole week</li>
                <li>Track your orders in real-time</li>
                <li>Discover new flavors and cuisines</li>
            </ul>
            <p>If you have any questions, our support team is here to help.</p>
            <p>Happy dining!<br>The XianFeast Team</p>
        </div>
    </div>
</body>
</html>
```

### Order Confirmation Email
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order Confirmation - XianFeast</title>
    <!-- Similar styling as signup email -->
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🍜 XianFeast</div>
            <h1 style="color: white;">Order Confirmed!</h1>
        </div>
        <div class="content">
            <h2>Thank you, {{customerName}}!</h2>
            <p>Your order has been confirmed and sent to the stall. Here are the details:</p>
            
            <div class="order-summary">
                <h3>Order #{{orderNumber}}</h3>
                <p><strong>Stall:</strong> {{stallName}}</p>
                <p><strong>Scheduled for:</strong> {{scheduledDate}} at {{scheduledTime}}</p>
                
                <h4>Items Ordered:</h4>
                <ul>
                    {{#each items}}
                    <li>{{quantity}}x {{productName}} - ${{price}}</li>
                    {{/each}}
                </ul>
                
                <p><strong>Total:</strong> ${{totalAmount}}</p>
            </div>
            
            <p>You'll receive updates as your order progresses. Track your order anytime in your dashboard.</p>
            <a href="{{orderTrackingUrl}}" class="button">Track My Order</a>
        </div>
    </div>
</body>
</html>
```

## Implementation Phases

### Phase 1: Foundation (Authentication & Basic UI)
- Customer authentication system with magic links
- Basic customer dashboard and navigation
- Email service integration with branded templates
- DynamoDB schema updates for customer data

### Phase 2: Product Discovery (Browse & Search)
- Stall browsing interface with filtering
- Product catalog with detailed views
- Cart functionality with persistence
- Responsive design implementation

### Phase 3: Ordering System (Cart to Completion)
- Order placement and scheduling
- Order status tracking and updates
- Email notifications for all parties
- Integration with existing business dashboards

### Phase 4: Enhancement & Polish (UX & Performance)
- Advanced filtering and search
- Order history and analytics
- Performance optimization
- Comprehensive testing and bug fixes

This design provides a solid foundation for implementing a production-grade customer ordering system that integrates seamlessly with the existing XianFeast platform while maintaining high standards for user experience, security, and performance.