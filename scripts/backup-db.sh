#!/usr/bin/env bash
# =============================================================================
# backup-db.sh — PostgreSQL backup script for ProcureHub
#
# Usage:
#   bash scripts/backup-db.sh
#
# Environment variables (can be set in .env or exported before running):
#   PGHOST      — default: localhost
#   PGPORT      — default: 5432
#   PGUSER      — default: postgres
#   PGPASSWORD  — password (required if not using .pgpass)
#   PGDATABASE  — default: procurehub
#   BACKUP_DIR  — where to store backup files (default: ./backups)
#   KEEP_DAYS   — how many days to retain backups (default: 30)
#
# Cron example (daily at 02:00):
#   0 2 * * * /bin/bash /path/to/procurehub/scripts/backup-db.sh >> /var/log/procurehub-backup.log 2>&1
#
# PM2 ecosystem.config.js cron example:
#   {
#     name: 'db-backup',
#     script: 'bash',
#     args: ['scripts/backup-db.sh'],
#     cron_restart: '0 2 * * *',
#     autorestart: false,
#   }
# =============================================================================

set -euo pipefail

# ── config ────────────────────────────────────────────────────────────────────
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-procurehub}"
BACKUP_DIR="${BACKUP_DIR:-$(dirname "$0")/../backups}"
KEEP_DAYS="${KEEP_DAYS:-30}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/procurehub_${TIMESTAMP}.sql.gz"

# ── prepare backup directory ──────────────────────────────────────────────────
mkdir -p "${BACKUP_DIR}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backup → ${BACKUP_FILE}"

# ── dump + compress ───────────────────────────────────────────────────────────
PGPASSWORD="${PGPASSWORD:-}" pg_dump \
  --host="${PGHOST}" \
  --port="${PGPORT}" \
  --username="${PGUSER}" \
  --dbname="${PGDATABASE}" \
  --no-password \
  --format=plain \
  --encoding=UTF8 \
  | gzip -9 > "${BACKUP_FILE}"

FILESIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup completed — size: ${FILESIZE}"

# ── prune old backups ─────────────────────────────────────────────────────────
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Removing backups older than ${KEEP_DAYS} days..."
find "${BACKUP_DIR}" -name "procurehub_*.sql.gz" -mtime "+${KEEP_DAYS}" -delete
REMAINING=$(find "${BACKUP_DIR}" -name "procurehub_*.sql.gz" | wc -l | tr -d ' ')
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Done. ${REMAINING} backup file(s) retained."

# ── restore instructions ──────────────────────────────────────────────────────
# To restore:
#   gunzip -c backups/procurehub_YYYYMMDD_HHMMSS.sql.gz | psql -h HOST -U USER -d procurehub
