# =============================================================
# SMQ_GED — Backend Dockerfile  (ACTIA Engineering Services)
# Node.js 20 + Express + LibreOffice + Module IA Gemini
# ======================================================# =============================================================

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
