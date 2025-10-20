// Export all DynamoDB services
export * from './client'
export * from './service'
export * from './auth'
export * from './business'
export * from './users'
export * from './stalls'
export * from './products'
export * from './orders'
export * from './webhooks'
export * from './analytics'
export * from './magic-links'

// Re-export commonly used types
export type {
  User,
  Role,
  UserRole,
} from './users'

export type {
  Business,
  Stall,
  Product,
  MagicLink,
} from './business'

export type {
  Product as ProductType,
  ProductImage,
} from './products'

export type {
  Order,
  OrderItem,
} from './orders'

export type {
  Webhook,
  WebhookLog,
} from './webhooks'

export type {
  AnalyticsEvent,
} from './analytics'

export type {
  MagicLink as MagicLinkType,
  OTPCode,
} from './magic-links'