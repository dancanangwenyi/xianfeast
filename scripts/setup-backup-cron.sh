#!/bin/bash

# Setup automated backup cron jobs for XianFeast

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-system.sh"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
    exit 1
}

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    error "Backup script not found: $BACKUP_SCRIPT"
fi

# Make backup script executable
chmod +x "$BACKUP_SCRIPT"

# Create cron jobs
log "Setting up backup cron jobs..."

# Create temporary cron file
TEMP_CRON=$(mktemp)

# Get existing cron jobs (excluding XianFeast backups)
crontab -l 2>/dev/null | grep -v "XianFeast backup" > "$TEMP_CRON" || true

# Add XianFeast backup jobs
cat >> "$TEMP_CRON" << EOF

# XianFeast backup jobs
# Daily backup at 2:00 AM
0 2 * * * $BACKUP_SCRIPT backup daily >> /var/log/xianfeast-backup.log 2>&1

# Weekly backup on Sunday at 3:00 AM  
0 3 * * 0 $BACKUP_SCRIPT backup weekly >> /var/log/xianfeast-backup.log 2>&1

# Monthly backup on 1st day at 4:00 AM
0 4 1 * * $BACKUP_SCRIPT backup monthly >> /var/log/xianfeast-backup.log 2>&1

# Cleanup old backups daily at 5:00 AM
0 5 * * * $BACKUP_SCRIPT cleanup daily >> /var/log/xianfeast-backup.log 2>&1

EOF

# Install new cron jobs
crontab "$TEMP_CRON"

# Cleanup
rm "$TEMP_CRON"

# Create log rotation for backup logs
cat > /etc/logrotate.d/xianfeast-backup << EOF
/var/log/xianfeast-backup.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
EOF

success "Backup cron jobs installed successfully"

# Display installed cron jobs
log "Installed cron jobs:"
crontab -l | grep "XianFeast backup" -A 10

log "Backup logs will be written to: /var/log/xianfeast-backup.log"
log "Manual backup can be run with: $BACKUP_SCRIPT backup [daily|weekly|monthly]"