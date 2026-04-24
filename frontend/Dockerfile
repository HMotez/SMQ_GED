# =============================================================
# SMQ_GED — Frontend Dockerfile  (ACTIA Engineering Services)
# React 19 + Vite → bundle statique servi par Nginx
# Sprint 42 — Endurcissement infrastructure : WAF + server_tokens
# =============================================================

# ── Stage 1: Build ───────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies first (layer caching optimisation)
COPY package*.json ./
RUN npm ci

# Copy all source files
COPY . .

# API URL build arguments — baked into the JS bundle at build time
# VITE_API_URL   → base path for all /api/* calls (e.g. /api in Docker, full URL in dev)
# VITE_BACKEND_URL → base URL for /download/, /preview/ etc.
ARG VITE_API_URL=/api
ARG VITE_BACKEND_URL=""

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Build production bundle → outputs to /app/dist
RUN npm run build

# ── Stage 2: Serve ───────────────────────────────────────────
FROM nginx:stable-alpine AS production

# Copy the compiled React SPA
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default nginx config with our SPA + reverse-proxy + WAF config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
