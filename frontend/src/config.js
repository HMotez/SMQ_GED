// =============================================================
// src/config.js — Centralized API URL Configuration
// Sprint 7 — Dockerisation & Déploiement Containerisé
// =============================================================
//
// VITE_API_URL and VITE_BACKEND_URL are baked in at build time by Vite.
// They are set as Docker build ARGs in the frontend Dockerfile
// and forwarded to Vite via ENV, so no .env file is needed in production.
//
// Environments:
//   Local dev  → VITE_API_URL not set → fallback to http://localhost:4000/api
//   Docker     → VITE_API_URL=/api   → nginx proxies /api/* to backend:4000
// =============================================================

/**
 * Base URL for all REST API calls  (e.g. `${API}/auth/login`)
 * Docker:     /api
 * Local dev:  http://localhost:4000/api
 */
export const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

/**
 * Base URL for direct file routes: /files/, /download/, /preview/, /convert/
 * Docker:     "" (empty → relative paths, proxied by nginx)
 * Local dev:  http://localhost:4000
 */
export const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";
