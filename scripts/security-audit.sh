#!/bin/bash
# SMQ_GED — Évaluation des vulnérabilités
# Usage : ./scripts/security-audit.sh
#
# Effectue :
#   1. Audit des dépendances npm (npm audit)
#   2. Scan CVE des images Docker (Trivy)
#   3. Scan du système de fichiers (Trivy fs)
#   4. Génère un rapport daté dans ./reports/security/

set -euo pipefail

BOLD='\033[1m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_DIR="./reports/security"
REPORT_FILE="${REPORT_DIR}/audit_${TIMESTAMP}.txt"

mkdir -p "$REPORT_DIR"

{
echo "================================================"
echo "  SMQ_GED — Rapport d'évaluation des vulnérabilités"
echo "  Date : $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================"
echo ""
} | tee "$REPORT_FILE"

log() { echo -e "$1" | tee -a "$REPORT_FILE"; }

ERRORS=0

# ── 1. Audit npm — dépendances backend ───────────────────────
log "${BOLD}[1/3] Audit de sécurité npm${NC}"
log "  Cible : backend/package.json"

cd backend
npm_audit_json=$(npm audit --json 2>/dev/null || true)
vuln_count=$(echo "$npm_audit_json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('metadata',{}).get('vulnerabilities',{}).get('total',0))" 2>/dev/null || echo "?")
critical=$(echo "$npm_audit_json"   | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('metadata',{}).get('vulnerabilities',{}).get('critical',0))" 2>/dev/null || echo "?")
high=$(echo "$npm_audit_json"       | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('metadata',{}).get('vulnerabilities',{}).get('high',0))" 2>/dev/null || echo "?")
cd ..

{
echo ""
echo "  Vulnérabilités totales : $vuln_count"
echo "  Critiques              : $critical"
echo "  Élevées                : $high"
} | tee -a "$REPORT_FILE"

if [[ "$critical" != "0" && "$critical" != "?" ]]; then
  log "${RED}  ✘ Vulnérabilités critiques détectées — corriger immédiatement (npm audit fix)${NC}"
  ERRORS=$((ERRORS+1))
elif [[ "$high" != "0" && "$high" != "?" ]]; then
  log "${YELLOW}  ⚠ Vulnérabilités élevées détectées — planifier la correction${NC}"
else
  log "${GREEN}  ✔ Aucune vulnérabilité critique/élevée${NC}"
fi
log ""

# ── 2. Scan CVE des images Docker (Trivy) ────────────────────
log "${BOLD}[2/3] Scan CVE des images Docker (Trivy)${NC}"

IMAGES=(
  "smq_ged-backend:sprint31"
  "smq_ged-frontend:sprint42"
  "postgres:16-alpine"
  "apache/kafka:3.7.0"
  "clamav/clamav:stable"
)

if ! docker image inspect aquasec/trivy:latest &>/dev/null; then
  log "  Téléchargement de Trivy..."
  docker pull aquasec/trivy:latest >> "$REPORT_FILE" 2>&1 || true
fi

for IMAGE in "${IMAGES[@]}"; do
  log "${CYAN}  Scan : $IMAGE${NC}"
  {
    echo ""
    echo "  --- $IMAGE ---"
    docker run --rm \
      -v /var/run/docker.sock:/var/run/docker.sock \
      -v trivy-cache:/root/.cache/trivy \
      aquasec/trivy:latest image \
        --severity HIGH,CRITICAL \
        --no-progress \
        "$IMAGE" 2>/dev/null \
    || echo "  Image non disponible localement — builder d'abord avec docker compose build"
    echo ""
  } | tee -a "$REPORT_FILE"
done

# ── 3. Scan du système de fichiers ────────────────────────────
log "${BOLD}[3/3] Scan du système de fichiers (backend/src)${NC}"
{
  echo ""
  docker run --rm \
    -v "$(pwd)/backend:/workspace:ro" \
    -v trivy-cache:/root/.cache/trivy \
    aquasec/trivy:latest fs \
      --severity HIGH,CRITICAL \
      --no-progress \
      /workspace 2>/dev/null \
  || echo "  Scan fs non disponible"
  echo ""
} | tee -a "$REPORT_FILE"

# ── Résumé ────────────────────────────────────────────────────
{
echo "================================================"
echo "  Rapport sauvegardé : $REPORT_FILE"
echo "  Rappel : lancer un audit après tout changement"
echo "  majeur (nouveau module, mise à jour dépendance,"
echo "  modification de la configuration serveur)."
echo "================================================"
} | tee -a "$REPORT_FILE"

if [[ $ERRORS -gt 0 ]]; then
  exit 1
fi
