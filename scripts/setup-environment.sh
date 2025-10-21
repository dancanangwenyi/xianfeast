#!/bin/bash

# XianFeast Environment Setup Script
# Sets up the environment for different deployment stages

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Setup development environment
setup_development() {
    log "Setting up development environment..."
    
    # Create .env.local for development
    cat > "$PROJECT_ROOT/.env.local" << EOF
# Development Environment Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_dev_access_key
AWS_SECRET_ACCESS_KEY=your_dev_secret_key

# Authentication
JWT_SECRET=dev_jwt_secret_change_in_production
REFRESH_SECRET=dev_refresh_secret_change_in_production

# Google Services (Development)
GOOGLE_SERVICE_ACCOUNT_EMAIL=dev-service@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_DEV_PRIVATE_KEY\n-----END PRIVATE KEY-----"
GOOGLE_SPREADSHEET_ID=your_dev_spreadsheet_id
GOOGLE_DRIVE_FOLDER_ID=your_dev_drive_folder_id

# Email Configuration (Development)
EMAIL_FROM=noreply@localhost
EMAIL_SMTP_HOST=localhost
EMAIL_SMTP_PORT=1025
EMAIL_SMTP_USER=
EMAIL_SMTP_PASS=

# Feature Flags
ENABLE_CUSTOMER_ORDERING=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_PERFORMANCE_MONITORING=true

# Debug Settings
DEBUG_MODE=true
LOG_LEVEL=debug
EOF

    success "Development environment configured"
}

# Setup staging environment
setup_staging() {
    log "Setting up staging environment..."
    
    cat > "$PROJECT_ROOT/.env.staging" << EOF
# Staging Environment Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://staging.xianfeast.com

# Database Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=\${STAGING_AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=\${STAGING_AWS_SECRET_ACCESS_KEY}

# Authentication
JWT_SECRET=\${STAGING_JWT_SECRET}
REFRESH_SECRET=\${STAGING_REFRESH_SECRET}

# Google Services (Staging)
GOOGLE_SERVICE_ACCOUNT_EMAIL=\${STAGING_GOOGLE_SERVICE_ACCOUNT_EMAIL}
GOOGLE_PRIVATE_KEY=\${STAGING_GOOGLE_PRIVATE_KEY}
GOOGLE_SPREADSHEET_ID=\${STAGING_GOOGLE_SPREADSHEET_ID}
GOOGLE_DRIVE_FOLDER_ID=\${STAGING_GOOGLE_DRIVE_FOLDER_ID}

# Email Configuration (Staging)
EMAIL_FROM=noreply@staging.xianfeast.com
EMAIL_SMTP_HOST=\${STAGING_EMAIL_SMTP_HOST}
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=\${STAGING_EMAIL_SMTP_USER}
EMAIL_SMTP_PASS=\${STAGING_EMAIL_SMTP_PASS}

# Feature Flags
ENABLE_CUSTOMER_ORDERING=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_PERFORMANCE_MONITORING=true

# Debug Settings
DEBUG_MODE=false
LOG_LEVEL=info
EOF

    success "Staging environment configured"
}

# Setup production environment
setup_production() {
    log "Setting up production environment..."
    
    cat > "$PROJECT_ROOT/.env.production" << EOF
# Production Environment Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://xianfeast.com

# Database Configuration
AWS_REGION=\${PROD_AWS_REGION}
AWS_ACCESS_KEY_ID=\${PROD_AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=\${PROD_AWS_SECRET_ACCESS_KEY}

# Authentication
JWT_SECRET=\${PROD_JWT_SECRET}
REFRESH_SECRET=\${PROD_REFRESH_SECRET}

# Google Services (Production)
GOOGLE_SERVICE_ACCOUNT_EMAIL=\${PROD_GOOGLE_SERVICE_ACCOUNT_EMAIL}
GOOGLE_PRIVATE_KEY=\${PROD_GOOGLE_PRIVATE_KEY}
GOOGLE_SPREADSHEET_ID=\${PROD_GOOGLE_SPREADSHEET_ID}
GOOGLE_DRIVE_FOLDER_ID=\${PROD_GOOGLE_DRIVE_FOLDER_ID}

# Email Configuration (Production)
EMAIL_FROM=noreply@xianfeast.com
EMAIL_SMTP_HOST=\${PROD_EMAIL_SMTP_HOST}
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=\${PROD_EMAIL_SMTP_USER}
EMAIL_SMTP_PASS=\${PROD_EMAIL_SMTP_PASS}

# Feature Flags
ENABLE_CUSTOMER_ORDERING=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_PERFORMANCE_MONITORING=true

# Debug Settings
DEBUG_MODE=false
LOG_LEVEL=warn
EOF

    success "Production environment configured"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Install Node.js dependencies
    npm ci
    
    # Install PM2 globally for production process management
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    fi
    
    success "Dependencies installed"
}

# Setup DynamoDB tables
setup_dynamodb() {
    log "Setting up DynamoDB tables..."
    
    cd "$PROJECT_ROOT"
    
    # Create DynamoDB tables
    npm run create-dynamodb-tables || warning "DynamoDB table creation failed"
    
    success "DynamoDB setup completed"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create monitoring configuration
    cat > "$PROJECT_ROOT/monitoring.config.js" << EOF
module.exports = {
  metrics: {
    enabled: true,
    interval: 60000, // 1 minute
    endpoints: [
      '/api/health',
      '/api/customer/dashboard',
      '/api/customer/orders',
      '/api/customer/stalls'
    ]
  },
  alerts: {
    enabled: true,
    thresholds: {
      responseTime: 5000, // 5 seconds
      errorRate: 0.05, // 5%
      cpuUsage: 0.8, // 80%
      memoryUsage: 0.8 // 80%
    }
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    destination: './logs/app.log'
  }
};
EOF

    # Create logs directory
    mkdir -p "$PROJECT_ROOT/logs"
    
    success "Monitoring setup completed"
}

# Validate environment
validate_environment() {
    log "Validating environment setup..."
    
    cd "$PROJECT_ROOT"
    
    # Check if required files exist
    required_files=(
        "package.json"
        "next.config.js"
        "tsconfig.json"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            error "Required file $file not found"
        fi
    done
    
    # Test database connection
    npm run test-dynamodb-connection || error "Database connection test failed"
    
    # Test build process
    npm run build || error "Build test failed"
    
    success "Environment validation completed"
}

# Main setup function
main() {
    local environment=${1:-development}
    
    log "Setting up XianFeast environment: $environment"
    
    case $environment in
        "development"|"dev")
            setup_development
            ;;
        "staging"|"stage")
            setup_staging
            ;;
        "production"|"prod")
            setup_production
            ;;
        *)
            error "Invalid environment: $environment. Use: development, staging, or production"
            ;;
    esac
    
    install_dependencies
    setup_dynamodb
    setup_monitoring
    validate_environment
    
    success "Environment setup completed for: $environment"
    
    # Display next steps
    log "Next steps:"
    echo "1. Update environment variables with actual values"
    echo "2. Run 'npm run dev' for development"
    echo "3. Run './scripts/deploy-production.sh' for production deployment"
}

# Handle command line arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 {development|staging|production}"
    echo "Example: $0 development"
    exit 1
fi

main "$1"