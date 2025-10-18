import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

// DynamoDB client configuration
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  endpoint: process.env.DYNAMODB_ENDPOINT,
})

// Document client for easier operations
export const dynamoClient = DynamoDBDocumentClient.from(client)

// Table name constants
export const TABLE_NAMES = {
  USERS: process.env.DYNAMODB_TABLE_USERS || 'xianfeast_users',
  USER_ROLES: process.env.DYNAMODB_TABLE_USER_ROLES || 'xianfeast_user_roles',
  ROLES: process.env.DYNAMODB_TABLE_ROLES || 'xianfeast_roles',
  BUSINESSES: process.env.DYNAMODB_TABLE_BUSINESSES || 'xianfeast_businesses',
  STALLS: process.env.DYNAMODB_TABLE_STALLS || 'xianfeast_stalls',
  PRODUCTS: process.env.DYNAMODB_TABLE_PRODUCTS || 'xianfeast_products',
  PRODUCT_IMAGES: process.env.DYNAMODB_TABLE_PRODUCT_IMAGES || 'xianfeast_product_images',
  ORDERS: process.env.DYNAMODB_TABLE_ORDERS || 'xianfeast_orders',
  ORDER_ITEMS: process.env.DYNAMODB_TABLE_ORDER_ITEMS || 'xianfeast_order_items',
  MAGIC_LINKS: process.env.DYNAMODB_TABLE_MAGIC_LINKS || 'xianfeast_magic_links',
  OTP_CODES: process.env.DYNAMODB_TABLE_OTP_CODES || 'xianfeast_otp_codes',
  ANALYTICS_EVENTS: process.env.DYNAMODB_TABLE_ANALYTICS_EVENTS || 'xianfeast_analytics_events',
  WEBHOOKS: process.env.DYNAMODB_TABLE_WEBHOOKS || 'xianfeast_webhooks',
  WEBHOOK_LOGS: process.env.DYNAMODB_TABLE_WEBHOOK_LOGS || 'xianfeast_webhook_logs',
} as const

export default dynamoClient
