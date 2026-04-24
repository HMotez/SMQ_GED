#!/bin/bash
# SMQ_GED — Veille et gestion des mises à jour
# Usage : ./scripts/check-updates.sh
# Vérifie : npm audit, paquets obsolètes, intégrité des images Docker

set -euo pipefail

BOLD='\033[1m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${BOLD}================================================${NC}"
echo -e "${BOLD}  SMQ_GED — Veille des mises à jour$(date '+  %Y-%m-%d %H:%M')${NC}"
echo -e "${BOLD}================================================${NC}\n"

# ── 1. Audit de sécurité npm (vulnérabilités connues) ─────────
echo -e "${BOLD}[1/4] Audit de sécurité npm (backend)${NC}"
cd backend
if npm audit --audit-level=moderate 2>&1; then
  echo -e "${GREEN}✔ Aucune vulnérabilité critique détectée.${NC}"
else
  echo -e "${RED}✘ Vulnérabilités détectées — exécuter : npm audit fix${NC}"
fi
cd ..
echo ""

# ── 2. Paquets npm obsolètes ──────────────────────────────────
echo -e "${BOLD}[2/4] Paquets npm obsolètes (backend)${NC}"
cd backend
OUTDATED=$(npm outdated 2>/dev/null || true)
if [[ -z "$OUTDATED" ]]; then
  echo -e "${GREEN}✔ Tous les paquets sont à jour.${NC}"
else
  echo -e "${YELLOW}⚠ Mises à jour disponibles :${NC}"
  echo "$OUTDATED"
  echo -e "${YELLOW}  → Vérifier la source sur https://www.npmjs.com avant mise à jour${NC}"
  echo -e "${YELLOW}  → Tester dans l'environnement staging avant production${NC}"
fi
cd ..
echo ""

# ── 3. Vérification de la source des images Docker ────────────
echo -e "${BOLD}[3/4] Vérification des images Docker (digests)${NC}"

check_image() {
  local IMAGE="$1"
  local EXPECTED_DIGEST="$2"

  ACTUAL=$(docker pull "$IMAGE" --quiet 2>/dev/null && \
            docker inspect --format='{{index .RepoDigests 0}}' "$IMAGE" 2>/dev/null || echo "ERREUR")

  if [[ "$ACTUAL" == "ERREUR" ]]; then
    echo -e "${RED}  ✘ $IMAGE — impossible de vérifier (Docker non démarré ?)${NC}"
  else
    echo -e "${GREEN}  ✔ $IMAGE${NC}"
    echo "    Digest : $ACTUAL"
  fi
}

check_image "postgres:16-alpine"      ""
check_image "apache/kafka:3.7.0"      ""
check_image "clamav/clamav:stable"    ""
check_image "node:20-slim"            ""

echo -e "${YELLOW}  → Comparer les digests ci-dessus avec les releases officielles${NC}"
echo -e "${YELLOW}     postgres  : https://hub.docker.com/_/postgres${NC}"
echo -e "${YELLOW}     kafka     : https://hub.docker.com/r/apache/kafka${NC}"
echo -e "${YELLOW}     clamav    : https://hub.docker.com/r/clamav/clamav${NC}"
echo -e "${YELLOW}     node      : https://hub.docker.com/_/node${NC}"
echo ""

# ── 4. Rappel procédure de mise à jour sécurisée ─────────────
echo -e "${BOLD}[4/4] Procédure à suivre avant toute mise à jour${NC}"
echo "  1. Vérifier la source du patch (source officielle + digest)"
echo "  2. Lire le changelog / release notes"
echo "  3. Appliquer sur staging :  docker compose -f docker-compose.staging.yml up --build -d"
echo "  4. Valider le comportement sur staging (tests fonctionnels)"
echo "  5. Appliquer en production : docker compose up --build -d"
echo ""
echo -e "${BOLD}================================================${NC}"
echo -e "${BOLD}  Veille terminée — $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${BOLD}================================================${NC}"
