# =============================================================
<<<<<<< HEAD
# SMQ_GED — Backend Dockerfile  (ACTIA Engineering Services)
# Node.js 20 + Express + LibreOffice + Module IA Gemini
# =============================================================
# Stage 1 : Installation des dépendances production uniquement
# Stage 2 : Image finale avec LibreOffice pour la conversion
#           de documents + Module IA (NLP, Gemini, classification)
=======
# SMQ_GED — Backend Dockerfile
# Sprint 7 — Dockerisation & Déploiement Containerisé
# Sprint 6 — Module IA embarqué (NLP, classification, extraction
#             dates, amélioration continue) — aucune dépendance
#             système supplémentaire requise.
# =============================================================
# Stage 1: Install production dependencies only
# Stage 2: Final image with LibreOffice for document conversion
#          + Module IA Sprint 6 (pur Node.js + PostgreSQL)
>>>>>>> 1d2558f60f462409d3243bfe5057dd02adcf7580
# =============================================================

# ── Stage 1: Dependency resolution ───────────────────────────
FROM node:20-slim AS deps

WORKDIR /app

COPY package*.json ./

# Install ONLY production dependencies (no devDependencies)
RUN npm ci --omit=dev

# ── Stage 2: Production image ────────────────────────────────
FROM node:20-slim AS production

WORKDIR /app

# Install LibreOffice for document format conversion (/convert route)
# --no-install-recommends keeps the image as lean as possible
RUN apt-get update && apt-get install -y \
    libreoffice \
    --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code and package files
COPY package*.json ./
COPY src/ ./src/

# Create storage directory (will be mounted as a named volume)
RUN mkdir -p /app/storage

# Expose API port
EXPOSE 4000

# Set NODE_ENV for production optimizations
ENV NODE_ENV=production

# Start the Express server
CMD ["node", "src/server.js"]
