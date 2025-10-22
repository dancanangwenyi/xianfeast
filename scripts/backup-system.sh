#!/bin/bash

# XianFeast Backup and Recovery System
# Handles automated backups of customer data and order information

set -e

# Configuration
BACKUP_DIR="/var/backups/xianfeast"
S3_BUCKET="xianfeast-backups"
RETENTION_DAYS=30
LOG_FILE="/var/log/xianfeast-backup.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
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

# Create backup directory structure
setup_backup_directories() {
    log "Setting up backup directories..."
    
    mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly}
    mkdir -p "$BACKUP_DIR"/logs
    
    success "Backup directories created"
}

# Backup DynamoDB tables
backup_dynamodb() {
    local backup_type=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="dynamodb_${backup_type}_${timestamp}"
    
    log "Starting DynamoDB backup: $backup_name"
    
    # List of tables to backup
    tables=(
        "Users"
        "Orders" 
        "OrderItems"
        "Carts"
        "CartItems"
        "MagicLinks"
        "Products"
        "Stalls"
        "Businesses"
    )
    
    local backup_dir="$BACKUP_DIR/$backup_type/$backup_name"
    mkdir -p "$backup_dir"
    
    for table in "${tables[@]}"; do
        log "Backing up table: $table"
        
        # Export table data to JSON
        aws dynamodb scan \
            --table-name "$table" \
            --output json \
            > "$backup_dir/${table}.json" || warning "Failed to backup table $table"
        
        # Create table schema backup
        aws dynamodb describe-table \
            --table-name "$table" \
            --output json \
            > "$backup_dir/${table}_schema.json" || warning "Failed to backup schema for $table"
    done
    
    # Create backup manifest
    cat > "$backup_dir/manifest.json" << EOF
{
  "backup_type": "$backup_type",
  "timestamp": "$timestamp",
  "tables": $(printf '%s\n' "${tables[@]}" | jq -R . | jq -s .),
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "1.0"
}
EOF
    
    # Compress backup
    log "Compressing backup..."
    tar -czf "$backup_dir.tar.gz" -C "$BACKUP_DIR/$backup_type" "$backup_name"
    rm -rf "$backup_dir"
    
    success "DynamoDB backup completed: $backup_name.tar.gz"
    echo "$backup_dir.tar.gz"
}

# Backup application files
backup_application() {
    local backup_type=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="application_${backup_type}_${timestamp}"
    
    log "Starting application backup: $backup_name"
    
    local backup_dir="$BACKUP_DIR/$backup_type/$backup_name"
    mkdir -p "$backup_dir"
    
    # Backup configuration files
    cp -r /app/.env* "$backup_dir/" 2>/dev/null || true
    cp -r /app/next.config.js "$backup_dir/" 2>/dev/null || true
    cp -r /app/package.json "$backup_dir/" 2>/dev/null || true
    
    # Backup logs
    cp -r /app/logs "$backup_dir/" 2>/dev/null || true
    
    # Backup uploaded files (if any)
    cp -r /app/uploads "$backup_dir/" 2>/dev/null || true
    
    # Create application manifest
    cat > "$backup_dir/manifest.json" << EOF
{
  "backup_type": "$backup_type",
  "timestamp": "$timestamp",
  "app_version": "$(cat /app/package.json | jq -r .version)",
  "node_version": "$(node --version)",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    
    # Compress backup
    tar -czf "$backup_dir.tar.gz" -C "$BACKUP_DIR/$backup_type" "$backup_name"
    rm -rf "$backup_dir"
    
    success "Application backup completed: $backup_name.tar.gz"
    echo "$backup_dir.tar.gz"
}

# Upload backup to S3
upload_to_s3() {
    local backup_file=$1
    local backup_type=$2
    
    log "Uploading backup to S3: $(basename $backup_file)"
    
    aws s3 cp "$backup_file" "s3://$S3_BUCKET/$backup_type/" || warning "Failed to upload to S3"
    
    success "Backup uploaded to S3"
}

# Cleanup old backups
cleanup_old_backups() {
    local backup_type=$1
    
    log "Cleaning up old $backup_type backups..."
    
    # Remove local backups older than retention period
    find "$BACKUP_DIR/$backup_type" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    # Remove old S3 backups
    aws s3 ls "s3://$S3_BUCKET/$backup_type/" | while read -r line; do
        backup_date=$(echo $line | awk '{print $1}')
        backup_file=$(echo $line | awk '{print $4}')
        
        if [ -n "$backup_date" ] && [ -n "$backup_file" ]; then
            days_old=$(( ($(date +%s) - $(date -d "$backup_date" +%s)) / 86400 ))
            
            if [ $days_old -gt $RETENTION_DAYS ]; then
                aws s3 rm "s3://$S3_BUCKET/$backup_type/$backup_file"
                log "Removed old backup: $backup_file"
            fi
        fi
    done
    
    success "Cleanup completed"
}

# Verify backup integrity
verify_backup() {
    local backup_file=$1
    
    log "Verifying backup integrity: $(basename $backup_file)"
    
    # Test if backup can be extracted
    if tar -tzf "$backup_file" > /dev/null 2>&1; then
        success "Backup integrity verified"
        return 0
    else
        error "Backup integrity check failed"
        return 1
    fi
}

# Restore from backup
restore_backup() {
    local backup_file=$1
    local restore_type=${2:-"full"}
    
    log "Starting restore from backup: $(basename $backup_file)"
    
    # Create restore directory
    local restore_dir="/tmp/xianfeast_restore_$(date +%s)"
    mkdir -p "$restore_dir"
    
    # Extract backup
    tar -xzf "$backup_file" -C "$restore_dir"
    
    # Find the backup directory
    local backup_content=$(find "$restore_dir" -maxdepth 1 -type d | tail -n 1)
    
    if [ "$restore_type" = "full" ] || [ "$restore_type" = "database" ]; then
        log "Restoring DynamoDB tables..."
        restore_dynamodb_tables "$backup_content"
    fi
    
    if [ "$restore_type" = "full" ] || [ "$restore_type" = "application" ]; then
        log "Restoring application files..."
        restore_application_files "$backup_content"
    fi
    
    # Cleanup
    rm -rf "$restore_dir"
    
    success "Restore completed"
}

# Restore DynamoDB tables
restore_dynamodb_tables() {
    local backup_dir=$1
    
    # Read manifest to get table list
    local tables=$(cat "$backup_dir/manifest.json" | jq -r '.tables[]')
    
    for table in $tables; do
        log "Restoring table: $table"
        
        # Check if table exists
        if aws dynamodb describe-table --table-name "$table" > /dev/null 2>&1; then
            warning "Table $table already exists, skipping creation"
        else
            # Create table from schema
            aws dynamodb create-table \
                --cli-input-json "file://$backup_dir/${table}_schema.json" || warning "Failed to create table $table"
            
            # Wait for table to be active
            aws dynamodb wait table-exists --table-name "$table"
        fi
        
        # Restore data
        if [ -f "$backup_dir/${table}.json" ]; then
            # Convert scan output to batch-write format and restore
            node -e "
                const fs = require('fs');
                const data = JSON.parse(fs.readFileSync('$backup_dir/${table}.json'));
                const items = data.Items.map(item => ({
                    PutRequest: { Item: item }
                }));
                
                // Batch write in chunks of 25 (DynamoDB limit)
                for (let i = 0; i < items.length; i += 25) {
                    const batch = items.slice(i, i + 25);
                    const params = {
                        RequestItems: {
                            '$table': batch
                        }
                    };
                    fs.writeFileSync('/tmp/${table}_batch_' + Math.floor(i/25) + '.json', JSON.stringify(params));
                }
            "
            
            # Execute batch writes
            for batch_file in /tmp/${table}_batch_*.json; do
                if [ -f "$batch_file" ]; then
                    aws dynamodb batch-write-item --cli-input-json "file://$batch_file"
                    rm "$batch_file"
                fi
            done
        fi
    done
}

# Restore application files
restore_application_files() {
    local backup_dir=$1
    
    # Restore configuration files
    if [ -d "$backup_dir" ]; then
        cp -r "$backup_dir"/.env* /app/ 2>/dev/null || true
        cp -r "$backup_dir"/next.config.js /app/ 2>/dev/null || true
        
        # Restore logs
        cp -r "$backup_dir"/logs /app/ 2>/dev/null || true
        
        # Restore uploads
        cp -r "$backup_dir"/uploads /app/ 2>/dev/null || true
    fi
}

# Health check after restore
post_restore_health_check() {
    log "Performing post-restore health check..."
    
    # Check if application starts
    timeout 60 npm run build || error "Application build failed after restore"
    
    # Check database connectivity
    node -e "
        const { getDynamoDBClient } = require('./lib/dynamodb/client');
        const client = getDynamoDBClient();
        client.listTables({}).promise()
            .then(() => console.log('Database connection successful'))
            .catch(err => { console.error('Database connection failed:', err); process.exit(1); });
    " || error "Database connectivity check failed"
    
    success "Post-restore health check passed"
}

# Main backup function
perform_backup() {
    local backup_type=${1:-"daily"}
    
    log "Starting $backup_type backup process..."
    
    setup_backup_directories
    
    # Backup DynamoDB
    local db_backup=$(backup_dynamodb "$backup_type")
    verify_backup "$db_backup"
    upload_to_s3 "$db_backup" "$backup_type"
    
    # Backup application
    local app_backup=$(backup_application "$backup_type")
    verify_backup "$app_backup"
    upload_to_s3 "$app_backup" "$backup_type"
    
    # Cleanup old backups
    cleanup_old_backups "$backup_type"
    
    success "$backup_type backup process completed"
}

# Main function
main() {
    case "${1:-backup}" in
        "backup")
            perform_backup "${2:-daily}"
            ;;
        "restore")
            if [ -z "$2" ]; then
                error "Backup file path required for restore"
            fi
            restore_backup "$2" "${3:-full}"
            post_restore_health_check
            ;;
        "verify")
            if [ -z "$2" ]; then
                error "Backup file path required for verification"
            fi
            verify_backup "$2"
            ;;
        "cleanup")
            cleanup_old_backups "${2:-daily}"
            ;;
        *)
            echo "Usage: $0 {backup|restore|verify|cleanup} [options]"
            echo "Examples:"
            echo "  $0 backup daily"
            echo "  $0 restore /path/to/backup.tar.gz full"
            echo "  $0 verify /path/to/backup.tar.gz"
            echo "  $0 cleanup weekly"
            exit 1
            ;;
    esac
}

main "$@"