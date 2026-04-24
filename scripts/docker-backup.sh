#!/bin/sh
# SMQ_GED — Sauvegarde automatique PostgreSQL (conteneur backup)
# Tourne en boucle : pg_dump toutes les 24h, conserve 30 jours

set -e

DB_HOST="${DB_HOST:-postgres}"
DB_USER="${DB_USER:-smq_user}"
DB_NAME="${DB_NAME:-smq_ged}"
BACKUP_DIR="/backups"
KEEP_DAYS=30

mkdir -p "$BACKUP_DIR"

while true; do
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  FILE="${BACKUP_DIR}/smq_ged_${TIMESTAMP}.sql.gz"

  echo "[$(date)] Sauvegarde en cours → $FILE"
  pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" | gzip > "$FILE"
  echo "[$(date)] Terminée : $(du -h "$FILE" | cut -f1)"

  # Purge des sauvegardes de plus de KEEP_DAYS jours
  find "$BACKUP_DIR" -name "smq_ged_*.sql.gz" -mtime "+${KEEP_DAYS}" -delete
  echo "[$(date)] Purge : fichiers de plus de ${KEEP_DAYS} jours supprimés"

  sleep 86400
done
