#!/bin/bash
# SMQ_GED — Procédure de récupération PostgreSQL
# Usage : ./scripts/restore.sh <fichier_sauvegarde.sql.gz>
# Exemple : ./scripts/restore.sh ./backups/smq_ged_20260423_120000.sql.gz

set -euo pipefail

BACKUP_FILE="${1:?Erreur : fichier de sauvegarde requis. Usage: $0 <fichier.sql.gz>}"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Erreur : fichier introuvable : $BACKUP_FILE" >&2
  exit 1
fi

# Charger les variables d'environnement si .env présent
if [[ -f .env ]]; then
  set -a; source .env; set +a
fi

DB_USER="${DB_USER:-smq_user}"
DB_NAME="${DB_NAME:-smq_ged}"

echo "[$(date)] === RÉCUPÉRATION SMQ_GED ==="
echo "[$(date)] Fichier  : $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
echo "[$(date)] Base     : $DB_NAME"
echo ""
echo "ATTENTION : cette opération va ÉCRASER toutes les données actuelles."
read -rp "Taper 'oui' pour confirmer la restauration : " confirm

if [[ "$confirm" != "oui" ]]; then
  echo "Restauration annulée."
  exit 0
fi

echo "[$(date)] Restauration en cours..."

# Drop et recréation de la base, puis restauration
docker exec -i smq_db psql -U "$DB_USER" postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB_NAME}';" \
  -c "DROP DATABASE IF EXISTS ${DB_NAME};" \
  -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

gunzip -c "$BACKUP_FILE" | docker exec -i smq_db psql -U "$DB_USER" "$DB_NAME"

echo "[$(date)] Restauration terminée avec succès."
