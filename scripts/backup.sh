#!/bin/bash
# SMQ_GED — Procédure de sauvegarde manuelle PostgreSQL
# Usage : ./scripts/backup.sh [répertoire_de_sortie]
# Exemple : ./scripts/backup.sh ./backups

set -euo pipefail

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/smq_ged_${TIMESTAMP}.sql.gz"
KEEP_DAYS=30

# Charger les variables d'environnement si .env présent
if [[ -f .env ]]; then
  set -a; source .env; set +a
fi

DB_USER="${DB_USER:-smq_user}"
DB_NAME="${DB_NAME:-smq_ged}"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] === SAUVEGARDE SMQ_GED ==="
echo "[$(date)] Base     : $DB_NAME"
echo "[$(date)] Fichier  : $BACKUP_FILE"

docker exec smq_db pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "[$(date)] Taille   : $(du -h "$BACKUP_FILE" | cut -f1)"
echo "[$(date)] Sauvegarde terminée avec succès."

# Purge automatique
find "$BACKUP_DIR" -name "smq_ged_*.sql.gz" -mtime "+${KEEP_DAYS}" -delete
echo "[$(date)] Purge    : sauvegardes de plus de ${KEEP_DAYS} jours supprimées."
