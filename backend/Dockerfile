# =============================================================
# SMQ_GED — Backend Dockerfile  (ACTIA Engineering Services)
# Node.js 20 + Express + LibreOffice + Module IA Groq (llama-3.3-70b)
# Sprint 13 — PDF→Word (pdf2docx) + PDF→Excel (pdfplumber) conversion fix
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

# Install LibreOffice + Python3 + pip for document format conversion (/convert route)
RUN apt-get update && apt-get install -y \
    libreoffice \
    python3 \
    python3-pip \
    --no-install-recommends \
  && pip3 install --break-system-packages pdf2docx pdfplumber openpyxl \
  && rm -rf /var/lib/apt/lists/* /root/.cache/pip

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code and package files
COPY package*.json ./
COPY src/ ./src/
# Python conversion scripts are inside src/scripts — already copied above

# Create storage directory (will be mounted as a named volume)
RUN mkdir -p /app/storage

# Expose API port
EXPOSE 4000

# Set NODE_ENV for production optimizations
ENV NODE_ENV=production

# Start the Express server
CMD ["node", "src/server.js"]
