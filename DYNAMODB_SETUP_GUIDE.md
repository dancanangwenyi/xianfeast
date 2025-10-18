# 🚀 **DYNAMODB SETUP GUIDE FOR XIANFEAST**

## 📋 **OVERVIEW**

This guide will help you set up DynamoDB as your database backend for XianFeast, replacing Google Sheets with a more scalable and production-ready solution.

## 🔧 **STEP 1: AWS CREDENTIALS SETUP**

### **Option A: AWS Access Keys (Recommended for Development)**

1. **Get your AWS Access Keys:**
   - Go to AWS Console → IAM → Users → Your User → Security Credentials
   - Create Access Key → Command Line Interface (CLI)
   - Download the CSV file with your credentials

2. **Update your `.env` file:**
   ```bash
   # Replace these with your actual AWS credentials
   AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   AWS_REGION=us-east-1
   ```

### **Option B: AWS Profile (Alternative)**

If you prefer using AWS profiles:
```bash
# Install AWS CLI if not already installed
npm install -g aws-cli

# Configure your profile
aws configure --profile xianfeast

# Then set in .env:
AWS_PROFILE=xianfeast
```

## 🗄️ **STEP 2: CREATE DYNAMODB TABLES**

Run the table creation script:

```bash
npm run create-dynamodb-tables
```

This will create all 14 required tables:
- `xianfeast_users`
- `xianfeast_user_roles`
- `xianfeast_roles`
- `xianfeast_businesses`
- `xianfeast_stalls`
- `xianfeast_products`
- `xianfeast_product_images`
- `xianfeast_orders`
- `xianfeast_order_items`
- `xianfeast_magic_links`
- `xianfeast_otp_codes`
- `xianfeast_analytics_events`
- `xianfeast_webhooks`
- `xianfeast_webhook_logs`

## 🔐 **STEP 3: IAM PERMISSIONS**

Ensure your AWS user/role has the following DynamoDB permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:DescribeTable",
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchWriteItem",
        "dynamodb:BatchGetItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/xianfeast_*"
    }
  ]
}
```

## 📊 **STEP 4: TABLE SCHEMA OVERVIEW**

### **Core Tables:**

1. **`xianfeast_users`** - User accounts and authentication
2. **`xianfeast_businesses`** - Business entities
3. **`xianfeast_stalls`** - Food stalls within businesses
4. **`xianfeast_products`** - Menu items and products
5. **`xianfeast_orders`** - Customer orders
6. **`xianfeast_order_items`** - Individual items within orders

### **Supporting Tables:**

7. **`xianfeast_roles`** - Role definitions
8. **`xianfeast_user_roles`** - User-role assignments
9. **`xianfeast_magic_links`** - Invitation links
10. **`xianfeast_otp_codes`** - MFA codes
11. **`xianfeast_product_images`** - Product photos
12. **`xianfeast_analytics_events`** - Event tracking
13. **`xianfeast_webhooks`** - Webhook configurations
14. **`xianfeast_webhook_logs`** - Webhook execution logs

## 🔄 **STEP 5: MIGRATION FROM GOOGLE SHEETS**

### **Data Migration Script (Coming Soon)**

A migration script will be created to:
1. Export data from Google Sheets
2. Transform data to DynamoDB format
3. Import data into DynamoDB tables
4. Verify data integrity

### **Manual Migration Steps:**

1. **Export from Google Sheets:**
   ```bash
   # Run existing scripts to export data
   npm run check-admin  # Get user data
   ```

2. **Import to DynamoDB:**
   ```typescript
   // Use the DynamoDB service
   import { putItem, TABLE_NAMES } from '@/lib/dynamodb/service'
   
   await putItem(TABLE_NAMES.USERS, {
     id: 'user-id',
     email: 'user@example.com',
     name: 'User Name',
     // ... other fields
   })
   ```

## 🧪 **STEP 6: TESTING**

### **Test DynamoDB Connection:**

```bash
# Create a test script
npx tsx -e "
import { dynamoClient, TABLE_NAMES } from './lib/dynamodb/client'
import { scanItems } from './lib/dynamodb/service'

async function test() {
  try {
    const users = await scanItems(TABLE_NAMES.USERS, 1)
    console.log('✅ DynamoDB connection successful')
    console.log('Users found:', users.length)
  } catch (error) {
    console.error('❌ DynamoDB connection failed:', error.message)
  }
}
test()
"
```

### **Test Table Creation:**

```bash
# Verify tables exist
aws dynamodb list-tables --query 'TableNames[?contains(@, `xianfeast`)]'
```

## 🚀 **STEP 7: UPDATE APPLICATION CODE**

### **Replace Google Sheets with DynamoDB:**

1. **Update imports:**
   ```typescript
   // Old
   import { getAllRows, updateRow } from '@/lib/google/sheets'
   
   // New
   import { scanItems, updateItem, TABLE_NAMES } from '@/lib/dynamodb/service'
   ```

2. **Update data operations:**
   ```typescript
   // Old
   const users = await getAllRows('users')
   
   // New
   const users = await scanItems(TABLE_NAMES.USERS)
   ```

3. **Update API routes:**
   ```typescript
   // Example: Update user API
   export async function PUT(request: NextRequest) {
     const { id, ...updates } = await request.json()
     
     await updateItem(TABLE_NAMES.USERS, { id }, updates)
     
     return NextResponse.json({ success: true })
   }
   ```

## 🔧 **STEP 8: ENVIRONMENT CONFIGURATION**

### **Complete `.env` Setup:**

```bash
# Existing Google Sheets config (keep for migration)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
GOOGLE_DRIVE_FOLDER_ID=your-drive-folder-id

# JWT Configuration
JWT_SECRET=your-jwt-secret
REFRESH_SECRET=your-refresh-secret

# DynamoDB Configuration
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
DYNAMODB_ENDPOINT=https://dynamodb.us-east-1.amazonaws.com
DYNAMODB_ENABLE_LOCAL=false

# Table Names (optional - defaults are provided)
DYNAMODB_TABLE_USERS=xianfeast_users
DYNAMODB_TABLE_BUSINESSES=xianfeast_businesses
# ... etc for all tables
```

## 📈 **STEP 9: PRODUCTION CONSIDERATIONS**

### **Performance Optimization:**

1. **Provisioned Throughput:**
   - Start with 5 read/write capacity units
   - Monitor usage and adjust as needed
   - Consider auto-scaling for production

2. **Indexing Strategy:**
   - All tables have Global Secondary Indexes for common queries
   - Monitor query patterns and add indexes as needed

3. **Data Modeling:**
   - Use single-table design for related data when possible
   - Denormalize data to reduce queries
   - Use composite keys for hierarchical data

### **Security:**

1. **IAM Roles:**
   - Use least-privilege access
   - Separate read/write permissions
   - Use IAM roles instead of access keys in production

2. **Encryption:**
   - Enable encryption at rest
   - Use AWS KMS for key management
   - Enable encryption in transit

## 🆘 **TROUBLESHOOTING**

### **Common Issues:**

1. **Access Denied:**
   ```bash
   # Check AWS credentials
   aws sts get-caller-identity
   ```

2. **Table Not Found:**
   ```bash
   # List tables
   aws dynamodb list-tables
   ```

3. **Connection Timeout:**
   ```bash
   # Check region and endpoint
   echo $AWS_REGION
   echo $DYNAMODB_ENDPOINT
   ```

### **Debug Mode:**

```typescript
// Enable debug logging
process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1'
```

## 📞 **SUPPORT**

If you encounter issues:

1. Check AWS CloudTrail for API errors
2. Verify IAM permissions
3. Test with AWS CLI commands
4. Check DynamoDB console for table status

## 🎯 **NEXT STEPS**

1. ✅ Set up AWS credentials
2. ✅ Create DynamoDB tables
3. ✅ Test connection
4. 🔄 Migrate data from Google Sheets
5. 🔄 Update application code
6. 🔄 Test all functionality
7. 🔄 Deploy to production

---

**Ready to get started? Run `npm run create-dynamodb-tables` to create your tables!** 🚀
