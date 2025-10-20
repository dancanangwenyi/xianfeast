# XianFeast Product Overview

XianFeast (The Immortal Dining) is a Next.js meal ordering platform designed for organizations to plan and order meals by day/week/month, with merchants managing stalls through fine-grained role-based access control.

## Core Features

- **Multi-tenant Architecture**: Organizations, businesses, and stalls with hierarchical permissions
- **Magic Link Authentication**: Secure invite-based onboarding with forced password setup
- **Email OTP MFA**: Optional two-factor authentication via email
- **Role-Based Access Control**: Fine-grained permissions per stall and business
- **Google Sheets Database**: Canonical data store with typed helpers (migrating to DynamoDB)
- **Google Drive Storage**: Image and file uploads with approval workflow
- **Webhook System**: Real-time event notifications for integrations
- **AI-Ready**: Stub endpoints for future AI features (product suggestions, menu optimization)

## Key User Types

- **Super Admin**: Platform-wide management and oversight
- **Business Owners**: Manage their organization's stalls and users
- **Stall Managers**: Manage products, orders, and day-to-day operations
- **Customers**: Browse menus and place orders

## Business Model

B2B SaaS platform serving organizations that need meal ordering and management capabilities, with a focus on workplace dining and institutional food services.