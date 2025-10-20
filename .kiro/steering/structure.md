# Project Structure & Conventions

## Directory Organization

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes (TypeScript)
│   │   ├── auth/          # Authentication endpoints
│   │   ├── admin/         # Super admin APIs
│   │   ├── businesses/    # Business management
│   │   ├── products/      # Product CRUD
│   │   ├── orders/        # Order management
│   │   ├── users/         # User management
│   │   ├── webhooks/      # Webhook configuration
│   │   └── ai/            # AI stub endpoints
│   ├── admin/             # Super admin dashboard pages
│   ├── dashboard/         # User dashboard
│   ├── login/             # Authentication pages
│   ├── products/          # Product management UI
│   ├── orders/            # Order management UI
│   ├── team/              # RBAC management
│   └── webhooks/          # Webhook management UI
├── lib/                   # Shared utilities
│   ├── auth/              # Authentication utilities
│   ├── google/            # Google Sheets/Drive integration
│   ├── dynamodb/          # DynamoDB helpers (migration)
│   ├── webhooks/          # Webhook system
│   └── types/             # TypeScript interfaces
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── [feature-components] # Feature-specific components
├── hooks/                 # Custom React hooks
├── scripts/               # Utility scripts
└── styles/               # Global styles
```

## Naming Conventions

### Files & Directories
- **Pages**: `kebab-case` (e.g., `business-creation/page.tsx`)
- **Components**: `kebab-case` files, `PascalCase` exports
- **API Routes**: `route.ts` in feature directories
- **Utilities**: `camelCase` (e.g., `sessionManager.ts`)
- **Types**: `index.ts` for type definitions

### Code Conventions
- **Functions**: `camelCase` for regular functions, `PascalCase` for components
- **Constants**: `UPPER_SNAKE_CASE` for environment variables, `camelCase` for others
- **Database Fields**: `snake_case` to match Google Sheets columns
- **API Responses**: `camelCase` for JSON responses

## Architecture Patterns

### API Routes Structure
```typescript
// Standard API route pattern
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    // Business logic
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Operation failed" }, { status: 500 })
  }
}
```

### Database Layer
- **Google Sheets**: Use typed helpers from `lib/google/sheets.ts`
- **DynamoDB**: Use service layer from `lib/dynamodb/`
- **Schema**: Column definitions in `SHEET_COLUMNS` constant
- **Operations**: `getAllRows`, `queryRows`, `appendRow`, `updateRow`

### Authentication Flow
- **Session Management**: JWT with refresh tokens
- **Middleware**: Route protection in `middleware.ts`
- **Permissions**: Role-based access control
- **MFA**: Email OTP for enhanced security

### Component Patterns
- **UI Components**: Radix UI + Tailwind with CVA variants
- **Form Handling**: Controlled components with validation
- **State Management**: React hooks + context providers
- **Styling**: Tailwind classes with CSS custom properties

## File Naming Rules

### Pages (App Router)
- `page.tsx` - Route pages
- `layout.tsx` - Layout components
- `loading.tsx` - Loading states
- `error.tsx` - Error boundaries
- `not-found.tsx` - 404 pages

### API Routes
- `route.ts` - API endpoints
- `[id]/route.ts` - Dynamic routes
- `[...slug]/route.ts` - Catch-all routes

### Components
- `component-name.tsx` - React components
- `use-hook-name.ts` - Custom hooks
- `utils.ts` - Utility functions
- `types.ts` - Type definitions

## Import Conventions

```typescript
// External libraries first
import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

// Internal imports with @ alias
import { getSession } from "@/lib/auth/session"
import { queryRows, SHEET_COLUMNS } from "@/lib/google/sheets"
import { Button } from "@/components/ui/button"

// Relative imports last
import "./styles.css"
```

## Error Handling

- **API Routes**: Consistent error responses with status codes
- **Client Side**: Error boundaries and toast notifications
- **Logging**: Console.error for debugging, structured logging for production
- **Validation**: Input validation at API boundaries

## Testing Structure

- **Unit Tests**: `__tests__/` directories alongside source files
- **Integration Tests**: `scripts/test-*.ts` for end-to-end flows
- **Mocking**: Jest mocks for external services
- **Coverage**: Focus on business logic and API routes