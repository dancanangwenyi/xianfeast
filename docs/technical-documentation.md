# XianFeast Technical Documentation

## Overview

This document provides comprehensive technical documentation for the XianFeast Customer Ordering System, including API endpoints, data models, integration points, and system architecture.

## System Architecture

### Technology Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes (TypeScript)
- **Database**: DynamoDB (primary), Google Sheets (legacy)
- **Authentication**: JWT sessions with Argon2 password hashing
- **Email**: Custom email service with HTML templates
- **Storage**: Google Drive for file uploads
- **Styling**: Tailwind CSS 4 with Radix UI components

### High-Level Architecture
```
Customer UI → API Layer → Service Layer → Data Layer → DynamoDB
     ↓           ↓           ↓            ↓          ↓
  React/Next  Next.js APIs  Business    DynamoDB   Tables
  Components   (TypeScript)  Logic      Client     Schema
```

## API Endpoints

### Customer Authentication APIs

#### POST /api/auth/customer/signup
Creates a new customer account and sends magic link email.

**Request Body:**
```typescript
{
  name: string;
  email: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  customerId?: string;
}
```

**Error Codes:**
- 400: Invalid input data
- 409: Email already exists
- 500: Server error

#### POST /api/auth/customer/verify-magic
Verifies magic link token and prepares for password setup.

**Request Body:**
```typescript
{
  token: string;
}
```**Re
sponse:**
```typescript
{
  valid: boolean;
  userId?: string;
  email?: string;
}
```

#### POST /api/auth/customer/set-password
Sets password for customer account after magic link verification.

**Request Body:**
```typescript
{
  userId: string;
  password: string;
  confirmPassword: string;
}
```

#### POST /api/auth/customer/login
Authenticates customer with email and password.

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  user?: CustomerUser;
  token?: string;
}
```

### Customer Data APIs

#### GET /api/customer/dashboard
Retrieves customer dashboard data including profile, recent orders, and statistics.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```typescript
{
  customer: CustomerProfile;
  recentOrders: Order[];
  upcomingOrders: Order[];
  statistics: CustomerStats;
}
```

#### GET /api/customer/stalls
Retrieves available stalls with filtering options.

**Query Parameters:**
- `cuisine`: Filter by cuisine type
- `priceRange`: Filter by price range (budget|mid|premium)
- `openNow`: Filter by current availability (boolean)

**Response:**
```typescript
{
  stalls: Stall[];
  totalCount: number;
  filters: FilterOptions;
}
```

#### GET /api/customer/stalls/[stallId]
Retrieves detailed stall information including products.

**Response:**
```typescript
{
  stall: StallDetails;
  products: Product[];
  operatingHours: OperatingHours;
}
```

### Cart Management APIs

#### GET /api/customer/cart
Retrieves current cart contents for authenticated customer.

**Response:**
```typescript
{
  cart: Cart;
  items: CartItem[];
  totals: CartTotals;
}
```

#### POST /api/customer/cart/add
Adds item to customer's cart.

**Request Body:**
```typescript
{
  productId: string;
  stallId: string;
  quantity: number;
  specialInstructions?: string;
}
```

#### PUT /api/customer/cart/update
Updates cart item quantity or instructions.

**Request Body:**
```typescript
{
  cartItemId: string;
  quantity?: number;
  specialInstructions?: string;
}
```

#### DELETE /api/customer/cart/remove
Removes item from cart.

**Request Body:**
```typescript
{
  cartItemId: string;
}
```

### Order Management APIs

#### POST /api/customer/orders
Creates a new order from cart contents.

**Request Body:**
```typescript
{
  scheduledFor: string; // ISO date string
  deliveryAddress?: string;
  deliveryInstructions?: string;
  paymentMethod: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  order: Order;
  orderId: string;
}
```

#### GET /api/customer/orders
Retrieves customer's order history with filtering.

**Query Parameters:**
- `status`: Filter by order status
- `dateFrom`: Start date for filtering
- `dateTo`: End date for filtering
- `stallId`: Filter by specific stall

**Response:**
```typescript
{
  orders: Order[];
  totalCount: number;
  pagination: PaginationInfo;
}
```

#### GET /api/customer/orders/[orderId]
Retrieves detailed information for specific order.

**Response:**
```typescript
{
  order: OrderDetails;
  items: OrderItem[];
  statusHistory: StatusUpdate[];
  stall: StallInfo;
}
```

#### PUT /api/customer/orders/[orderId]/cancel
Cancels an order if still in pending or confirmed status.

**Response:**
```typescript
{
  success: boolean;
  refundAmount?: number;
  message: string;
}
```

## Data Models

### Customer User Model
```typescript
interface CustomerUser extends User {
  customer_preferences?: {
    dietary_restrictions: string[];
    favorite_stalls: string[];
    default_delivery_address?: string;
    notification_preferences: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  customer_stats?: {
    total_orders: number;
    total_spent_cents: number;
    favorite_products: string[];
    last_order_date?: string;
  };
}
```

### Cart Model
```typescript
interface Cart {
  id: string;
  customer_id: string;
  items: CartItem[];
  created_at: string;
  updated_at: string;
  expires_at: string;
}

interface CartItem {
  id: string;
  product_id: string;
  stall_id: string;
  quantity: number;
  unit_price_cents: number;
  scheduled_for?: string;
  special_instructions?: string;
}
```

### Order Model
```typescript
interface CustomerOrder extends Order {
  customer_id: string;
  delivery_address?: string;
  delivery_instructions?: string;
  estimated_ready_time?: string;
  actual_ready_time?: string;
  customer_rating?: number;
  customer_review?: string;
  notification_sent: boolean;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
}
```

### Magic Link Model
```typescript
interface CustomerMagicLink {
  id: string;
  email: string;
  token: string;
  type: 'signup' | 'password_reset';
  expires_at: string;
  used: boolean;
  created_at: string;
  user_id?: string;
}
```

## Database Schema

### DynamoDB Tables

#### Users Table
- **Primary Key**: `id` (string)
- **Global Secondary Index**: `email-index` on `email`
- **Attributes**: `name`, `email`, `password_hash`, `role`, `customer_preferences`, `customer_stats`

#### Orders Table
- **Primary Key**: `id` (string)
- **Global Secondary Index**: `customer_id-index` on `customer_id`
- **Global Secondary Index**: `stall_id-index` on `stall_id`
- **Attributes**: `customer_id`, `stall_id`, `status`, `total_cents`, `scheduled_for`, `delivery_address`

#### Order Items Table
- **Primary Key**: `id` (string)
- **Global Secondary Index**: `order_id-index` on `order_id`
- **Attributes**: `order_id`, `product_id`, `quantity`, `unit_price_cents`, `special_instructions`

#### Carts Table
- **Primary Key**: `id` (string)
- **Global Secondary Index**: `customer_id-index` on `customer_id`
- **Attributes**: `customer_id`, `expires_at`, `created_at`, `updated_at`

#### Cart Items Table
- **Primary Key**: `id` (string)
- **Global Secondary Index**: `cart_id-index` on `cart_id`
- **Attributes**: `cart_id`, `product_id`, `stall_id`, `quantity`, `unit_price_cents`

#### Magic Links Table
- **Primary Key**: `id` (string)
- **Global Secondary Index**: `token-index` on `token`
- **Global Secondary Index**: `email-index` on `email`
- **Attributes**: `email`, `token`, `type`, `expires_at`, `used`, `user_id`

## Integration Points

### Email Service Integration
```typescript
interface EmailService {
  sendWelcomeEmail(customer: Customer, magicLink: string): Promise<boolean>;
  sendOrderConfirmation(order: Order, customer: Customer): Promise<boolean>;
  sendStatusUpdate(order: Order, newStatus: string): Promise<boolean>;
  sendBusinessNotification(order: Order, business: Business): Promise<boolean>;
}
```

### Authentication Integration
```typescript
interface AuthService {
  generateMagicLink(email: string): Promise<string>;
  verifyMagicLink(token: string): Promise<{ valid: boolean; userId?: string }>;
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  generateJWT(user: User): Promise<string>;
  verifyJWT(token: string): Promise<User | null>;
}
```

### Payment Integration (Future)
```typescript
interface PaymentService {
  processPayment(order: Order, paymentMethod: PaymentMethod): Promise<PaymentResult>;
  refundPayment(orderId: string, amount: number): Promise<RefundResult>;
  validatePaymentMethod(method: PaymentMethod): Promise<boolean>;
}
```

## Error Handling

### API Error Response Format
```typescript
interface APIError {
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
}
```

### Common Error Codes
- `AUTH_REQUIRED`: Authentication required
- `INVALID_TOKEN`: Invalid or expired token
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `PERMISSION_DENIED`: Insufficient permissions
- `RATE_LIMITED`: Too many requests
- `SERVER_ERROR`: Internal server error

## Security Considerations

### Authentication Security
- JWT tokens with 1-hour expiration
- Refresh tokens with 7-day expiration
- Argon2 password hashing with salt
- Magic links expire in 24 hours
- Single-use magic link tokens

### API Security
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS configuration for allowed origins
- CSRF protection for state-changing operations
- SQL injection prevention through parameterized queries

### Data Protection
- Encryption at rest for sensitive data
- TLS encryption for data in transit
- PII data minimization
- Audit logging for sensitive operations
- Regular security updates and patches

## Performance Considerations

### Database Optimization
- Proper indexing on frequently queried fields
- Connection pooling for database connections
- Query optimization and monitoring
- Caching for frequently accessed data
- Pagination for large result sets

### API Performance
- Response caching for static data
- Compression for API responses
- Async processing for heavy operations
- Load balancing for high availability
- CDN for static assets

## Monitoring and Logging

### Application Metrics
- API response times and error rates
- Database query performance
- User authentication success/failure rates
- Order processing metrics
- Email delivery success rates

### Business Metrics
- Customer signup and retention rates
- Order volume and revenue tracking
- Stall performance analytics
- Customer satisfaction scores
- System uptime and availability

### Logging Strategy
- Structured logging with JSON format
- Log levels: ERROR, WARN, INFO, DEBUG
- Correlation IDs for request tracking
- Sensitive data exclusion from logs
- Log retention and archival policies

## Deployment Architecture

### Environment Configuration
- Development: Local development with test data
- Staging: Production-like environment for testing
- Production: Live environment with real data

### Infrastructure Components
- Application servers (Next.js)
- Database servers (DynamoDB)
- Load balancers
- CDN for static assets
- Email service providers
- Monitoring and logging services

### Deployment Process
1. Code review and testing
2. Build and package application
3. Deploy to staging environment
4. Run automated tests
5. Deploy to production with blue-green deployment
6. Monitor deployment and rollback if needed

---

*This documentation is maintained by the development team and updated with each release.*