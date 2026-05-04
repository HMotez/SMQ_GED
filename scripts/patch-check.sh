#!/bin/sh
# =============================================================
# SMQ_GED — Veille Patches & Audit de Vulnérabilités
# Utilisation : docker compose --profile audit run --rm trivy
# Ou en local : bash scripts/patch-check.sh
# =============================================================

REPORT_DIR="./reports/security"
DATE=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$REPORT_DIR/patch-check_$DATE.txt"
PASS=0
FAIL=0

mkdir -p "$REPORT_DIR"

log() { echo "$1" | tee -a "$REPORT_FILE"; }

log "=============================================="
log " SMQ_GED — Veille Patches & Vulnérabilités"
log " Date : $(date)"
log "=============================================="
log ""

# ── 1. NPM Audit Backend ──────────────────────────────────────
log "--- [1/3] NPM Audit — Backend ---"
if command -v npm >/dev/null 2>&1; then
  cd ./backend && npm audit --audit-level=high 2>&1 | tee -a "../$REPORT_FILE"
  if [ $? -eq 0 ]; then log "✅ Backend: aucune vulnérabilité critique"; PASS=$((PASS+1))
  else log "⚠️  Backend: vulnérabilités détectées — voir rapport"; FAIL=$((FAIL+1)); fi
  cd ..
else
  log "⚠️  npm non disponible (exécuter dans le container backend)"
fi

log ""

# ── 2. NPM Audit Frontend ─────────────────────────────────────
log "--- [2/3] NPM Audit — Frontend ---"
if command -v npm >/dev/null 2>&1; then
  cd ./frontend && npm audit --audit-level=high 2>&1 | tee -a "../$REPORT_FILE"
  if [ $? -eq 0 ]; then log "✅ Frontend: aucune vulnérabilité critique"; PASS=$((PASS+1))
  else log "⚠️  Frontend: vulnérabilités détectées — voir rapport"; FAIL=$((FAIL+1)); fi
  cd ..
else
  log "⚠️  npm non disponible"
fi

log ""

# ── 3. Trivy — Image Scan ─────────────────────────────────────
log "--- [3/3] Trivy — Scan des images Docker ---"
if command -v trivy >/dev/null 2>&1; then
  trivy image --severity HIGH,CRITICAL --no-progress smq_ged-backend 2>&1 | tee -a "$REPORT_FILE"
  trivy image --severity HIGH,CRITICAL --no-progress smq_ged-frontend 2>&1 | tee -a "$REPORT_FILE"
  log "✅ Scan Trivy terminé"
  PASS=$((PASS+1))
else
  log "⚠️  Trivy non disponible — lancer : docker compose --profile audit run --rm trivy"
fi

log ""
log "=============================================="
log " RÉSUMÉ : $PASS vérification(s) OK / $FAIL avertissement(s)"
log " Rapport : $REPORT_FILE"
log "=============================================="
