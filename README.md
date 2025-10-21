# XianFeast (The Immortal Dining)

A Next.js meal ordering platform where organizations can plan and order meals by day/week/month, and merchants manage stalls with fine-grained role-based access control.

## Features

- **Multi-tenant**: Organizations, businesses, and stalls with hierarchical permissions
- **Magic Link Auth**: Secure invite-based onboarding with forced password setup
- **Email OTP MFA**: Optional two-factor authentication via email
- **Role-Based Access Control**: Fine-grained permissions per stall and business
- **DynamoDB Database**: Scalable NoSQL database with typed helpers
- **Webhook System**: Real-time event notifications for integrations
- **AI-Ready**: Stub endpoints for future AI features (product suggestions, menu optimization)

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes (TypeScript)
- **Database**: DynamoDB (via AWS SDK)
- **Auth**: JWT sessions, Argon2 password hashing
- **Testing**: Jest with ts-jest

## Getting Started

### Prerequisites

1. AWS Account with DynamoDB access
2. AWS Access Keys configured
3. Node.js 18+ installed

### Installation

1. Clone the repository
2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Copy `.env.example` to `.env` and fill in your credentials:

\`\`\`bash
cp .env.example .env
\`\`\`

Required environment variables:
- `AWS_ACCESS_KEY_ID` - Your AWS Access Key
- `AWS_SECRET_ACCESS_KEY` - Your AWS Secret Key
- `AWS_REGION` - Your AWS Region (e.g., us-east-1)
- `JWT_SECRET` - Secret for JWT token signing
- `SUPER_ADMIN_EMAIL` - Super admin email address
- `SUPER_ADMIN_PASSWORD` - Super admin password

4. Create DynamoDB tables:

\`\`\`bash
npm run create-dynamodb-tables
\`\`\`

5. Setup super admin:

\`\`\`bash
npm run setup-admin
\`\`\`

5. Run the development server:

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

\`\`\`
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── products/      # Product management
│   │   ├── orders/        # Order management
│   │   ├── webhooks/      # Webhook configuration
│   │   └── ai/            # AI stub endpoints
│   ├── login/             # Login page
│   ├── products/          # Product management UI
│   ├── orders/            # Order management UI
│   ├── team/              # Team & RBAC management
│   ├── admin/             # Super admin dashboard
│   └── webhooks/          # Webhook management UI
├── lib/
│   ├── google/            # Google Sheets & Drive integration
│   │   ├── auth.ts        # Service account authentication
│   │   ├── sheets.ts      # Typed sheet helpers (CRUD operations)
│   │   ├── drive.ts       # File upload/download helpers
│   │   ├── init.ts        # Sheet initialization
│   │   └── __tests__/     # Unit tests for Google helpers
│   ├── auth/              # Authentication utilities
│   │   ├── session.ts     # JWT session management
│   │   ├── password.ts    # Password hashing with Argon2
│   │   ├── otp.ts         # OTP generation and verification
│   │   ├── magic-link.ts  # Magic link generation
│   │   └── permissions.ts # RBAC permission checking
│   ├── webhooks/          # Webhook system
│   │   ├── dispatcher.ts  # Webhook event dispatcher
│   │   └── signature.ts   # Webhook signature verification
│   └── types/             # TypeScript interfaces
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── calendar-order-picker.tsx
│   ├── image-uploader.tsx
│   ├── permissions-matrix.tsx
│   └── analytics-card.tsx
├── scripts/               # Utility scripts
│   └── init-sheets.ts    # Initialize spreadsheet structure
└── README.md
\`\`\`

## DynamoDB Schema

The app uses the following DynamoDB tables:

- **users**: All users with email, password hash, roles, and status
- **user_roles**: User-to-role assignments per business
- **roles**: Custom roles with permission sets
- **businesses**: Organizations using the platform
- **stalls**: Merchant stalls within businesses
- **products**: Menu items with pricing and metadata
- **product_images**: Image references with approval workflow
- **orders**: Customer orders with scheduling
- **order_items**: Line items for each order
- **magic_links**: Magic link tokens for authentication
- **otp_codes**: OTP codes for MFA
- **Webhooks**: Webhook endpoint configuration
- **WebhookLogs**: Webhook delivery history

## API Endpoints

### Authentication
- `POST /api/auth/invite` - Send magic link invite to new user
- `POST /api/auth/magic` - Verify magic link token
- `POST /api/auth/set-password` - Set password after invite
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/send-otp` - Send OTP for MFA
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/logout` - Clear session

### Users & RBAC
- `GET /api/users` - List users
- `POST /api/users/[id]/roles` - Assign roles to user
- `POST /api/users/[id]/disable` - Disable user account
- `GET /api/roles` - List roles
- `POST /api/roles` - Create custom role

### Businesses & Stalls
- `GET /api/businesses` - List businesses
- `POST /api/businesses` - Create business
- `PATCH /api/businesses/[id]` - Update business
- `GET /api/stalls` - List stalls
- `POST /api/stalls` - Create stall

### Products
- `GET /api/products` - List products (with filters)
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product details
- `PATCH /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product
- `POST /api/products/[id]/publish` - Submit for approval
- `POST /api/products/[id]/approve` - Approve product
- `POST /api/products/[id]/images` - Attach image to product

### Orders
- `GET /api/orders` - List orders (with filters)
- `POST /api/orders` - Create order
- `GET /api/orders/[id]` - Get order details
- `POST /api/orders/[id]/confirm` - Confirm order
- `POST /api/orders/[id]/cancel` - Cancel order
- `POST /api/orders/[id]/fulfil` - Mark as fulfilled

### Drive & Media
- `POST /api/drive/upload` - Upload image to Google Drive

### Webhooks
- `GET /api/webhooks` - List webhooks
- `POST /api/webhooks` - Create webhook
- `PATCH /api/webhooks/[id]` - Update webhook
- `DELETE /api/webhooks/[id]` - Delete webhook
- `GET /api/webhooks/logs` - View webhook delivery logs

### AI Stubs (Future Integration)
- `POST /api/ai/suggest-products` - AI product recommendations
- `POST /api/ai/optimize-menu` - Menu optimization suggestions
- `POST /api/ai/generate-description` - Generate product descriptions

## Webhook Events

The platform emits the following webhook events:

- `order.created` - New order created
- `order.confirmed` - Order confirmed by customer
- `order.cancelled` - Order cancelled
- `order.fulfilled` - Order marked as fulfilled
- `product.created` - New product created
- `product.updated` - Product details updated
- `product.published` - Product submitted for approval

Webhooks include HMAC-SHA256 signatures for verification.

## Testing

Run unit tests:

\`\`\`bash
npm test
\`\`\`

Run tests in watch mode:

\`\`\`bash
npm run test:watch
\`\`\`

## Deployment

Deploy to Vercel:

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

**Important**: Store your Google Service Account JSON key in Vercel environment variables as `GOOGLE_PRIVATE_KEY` (with newlines as `\n`).

## Migration Path

While Google Sheets works well for MVP and small-scale deployments, you can migrate to:

- **PostgreSQL/MySQL**: For better performance and ACID guarantees
- **Supabase/Neon**: For managed PostgreSQL with real-time features
- **Google Cloud Storage**: For more robust file storage
- **Redis**: For caching and session management

The typed helper functions in `lib/google/sheets.ts` provide an abstraction layer that makes migration easier.

## License

MIT
