#!/bin/bash

# XianFeast Production Deployment Script
# This script handles the complete deployment process for the customer ordering system

set -e  # Exit on any error

# Configuration
APP_NAME="xianfeast"
ENVIRONMENT="production"
BUILD_DIR="build"
BACKUP_DIR="backups"
LOG_FILE="deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Starting pre-deployment checks..."
    
    # Check if required environment variables are set
    required_vars=(
        "AWS_REGION"
        "AWS_ACCESS_KEY_ID" 
        "AWS_SECRET_ACCESS_KEY"
        "JWT_SECRET"
        "REFRESH_SECRET"
        "GOOGLE_SERVICE_ACCOUNT_EMAIL"
        "GOOGLE_PRIVATE_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    # Check Node.js version
    node_version=$(node --version | cut -d'v' -f2)
    required_version="18.0.0"
    if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]; then
        error "Node.js version $node_version is below required version $required_version"
    fi
    
    # Check if DynamoDB tables exist
    log "Checking DynamoDB tables..."
    npm run check-dynamodb-tables || error "DynamoDB tables check failed"
    
    success "Pre-deployment checks completed"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    mkdir -p $BACKUP_DIR
    backup_name="${APP_NAME}_backup_$(date +%Y%m%d_%H%M%S)"
    
    # Backup current deployment if it exists
    if [ -d "current" ]; then
        cp -r current "$BACKUP_DIR/$backup_name"
        log "Backup created: $BACKUP_DIR/$backup_name"
    fi
    
    # Backup database (export current data)
    npm run backup-dynamodb-data || warning "Database backup failed"
    
    success "Backup completed"
}

# Build application
build_application() {
    log "Building application..."
    
    # Install dependencies
    npm ci --production=false
    
    # Run tests
    log "Running tests..."
    npm run test || error "Tests failed"
    
    # Build Next.js application
    log "Building Next.js application..."
    npm run build || error "Build failed"
    
    # Optimize build
    log "Optimizing build..."
    npm run optimize-build || warning "Build optimization failed"
    
    success "Application built successfully"
}

# Deploy application
deploy_application() {
    log "Deploying application..."
    
    # Stop current application if running
    if pgrep -f "next start" > /dev/null; then
        log "Stopping current application..."
        pkill -f "next start" || warning "Failed to stop current application"
        sleep 5
    fi
    
    # Move current deployment to backup
    if [ -d "current" ]; then
        mv current "previous_$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Create new deployment directory
    mkdir -p current
    
    # Copy built application
    cp -r .next current/
    cp -r public current/
    cp -r node_modules current/
    cp package.json current/
    cp next.config.js current/
    
    # Set proper permissions
    chmod -R 755 current/
    
    success "Application deployed"
}

# Start application
start_application() {
    log "Starting application..."
    
    cd current
    
    # Start application with PM2 (process manager)
    if command -v pm2 &> /dev/null; then
        pm2 delete $APP_NAME 2>/dev/null || true
        pm2 start npm --name $APP_NAME -- start
        pm2 save
    else
        # Fallback to nohup if PM2 not available
        nohup npm start > ../app.log 2>&1 &
        echo $! > ../app.pid
    fi
    
    cd ..
    
    # Wait for application to start
    sleep 10
    
    success "Application started"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Check if application is responding
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            success "Health check passed"
            return 0
        fi
        
        log "Health check attempt $attempt/$max_attempts failed, retrying..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Post-deployment tasks
post_deployment_tasks() {
    log "Running post-deployment tasks..."
    
    # Warm up cache
    npm run warm-cache || warning "Cache warm-up failed"
    
    # Send deployment notification
    npm run send-deployment-notification || warning "Deployment notification failed"
    
    # Update monitoring dashboards
    npm run update-monitoring-dashboards || warning "Monitoring dashboard update failed"
    
    success "Post-deployment tasks completed"
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    # Stop current application
    if command -v pm2 &> /dev/null; then
        pm2 delete $APP_NAME 2>/dev/null || true
    else
        if [ -f app.pid ]; then
            kill $(cat app.pid) 2>/dev/null || true
            rm app.pid
        fi
    fi
    
    # Restore previous version
    if [ -d "previous_*" ]; then
        latest_backup=$(ls -t previous_* | head -n1)
        rm -rf current
        mv "$latest_backup" current
        start_application
        success "Rollback completed"
    else
        error "No previous version found for rollback"
    fi
}

# Main deployment function
main() {
    log "Starting deployment of $APP_NAME to $ENVIRONMENT environment"
    
    # Trap errors and rollback
    trap 'error "Deployment failed, initiating rollback..."; rollback' ERR
    
    pre_deployment_checks
    create_backup
    build_application
    deploy_application
    start_application
    health_check
    post_deployment_tasks
    
    success "Deployment completed successfully!"
    log "Application is running at http://localhost:3000"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "health-check")
        health_check
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health-check}"
        exit 1
        ;;
esac