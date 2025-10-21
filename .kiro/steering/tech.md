# Tech Stack & Development

## Core Technologies

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes (TypeScript)
- **Database**: Google Sheets (via googleapis) + DynamoDB migration in progress
- **Storage**: Google Drive for file uploads
- **Styling**: Tailwind CSS 4 with custom CSS variables
- **UI Components**: Radix UI primitives with shadcn/ui patterns
- **Authentication**: JWT sessions with Argon2 password hashing
- **Testing**: Jest with ts-jest

## Key Libraries

- `@aws-sdk/client-dynamodb` - DynamoDB client for migration
- `googleapis` - Google Sheets and Drive integration
- `argon2` - Password hashing
- `jsonwebtoken` - JWT session management
- `framer-motion` - Animations
- `recharts` - Data visualization
- `class-variance-authority` - Component variants
- `lucide-react` - Icons

## Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # ESLint
npm run format          # Prettier formatting

# Testing
npm test                # Run Jest tests
npm run test:watch      # Jest in watch mode

# Database & Setup
npm run init-sheets     # Initialize Google Sheets structure
npm run create-dynamodb-tables  # Create DynamoDB tables
npm run migrate-sheets  # Migrate from Sheets to DynamoDB

# Admin Management
npm run setup-admin     # Setup super admin
npm run check-admin     # Check admin status
npm run reset-admin     # Reset super admin

# Testing Scripts
npm run test-auth-system     # Test authentication
npm run test-business-flow   # Test business creation
npm run test-e2e            # End-to-end tests
```

## Environment Variables

Required for development:
- `GOOGLE_SPREADSHEET_ID` - Google Sheets database ID
- `GOOGLE_DRIVE_FOLDER_ID` - Google Drive storage folder
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - Service account email
- `GOOGLE_PRIVATE_KEY` - Service account private key
- `JWT_SECRET` - JWT signing secret
- `REFRESH_SECRET` - Refresh token secret
- `AWS_REGION` - DynamoDB region
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_SECRET_ACCESS_KEY` - AWS credentials

## Build Configuration

- **Next.js Config**: Webpack fallbacks for Node.js modules in browser
- **TypeScript**: Strict mode enabled with path aliases (`@/*`)
- **PostCSS**: Tailwind CSS 4 with custom plugins
- **ESLint**: Next.js config with build error ignoring (legacy)
- **Jest**: ts-jest for TypeScript testing