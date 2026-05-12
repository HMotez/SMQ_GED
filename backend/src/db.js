// ============================================================
// db.js — Pool de connexions PostgreSQL (pg)
// Un seul pool partagé dans toute l'application.
// Toutes les requêtes passent par pool.query() ou pool.connect().
// La variable DB_SSL=true active le TLS entre l'app et la DB
// (indispensable en production Docker).
// ============================================================
const { Pool } = require("pg");
require("dotenv").config();
const logger = require("./utils/logger");

// DB_SSL=true → enforce TLS between app and PostgreSQL (production)
const sslConfig = process.env.DB_SSL === "true"
  ? { rejectUnauthorized: false }   // self-signed cert accepted
  : false;

const pool = new Pool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port:     process.env.DB_PORT,
  ssl:      sslConfig,
});

// Surveillance accès non autorisés à la BD — Gestion BD (checklist sécurité)
// pg error codes: 28P01 = wrong password, 28000 = invalid auth, 3D000 = db not found
pool.on("error", (err) => {
  const authCodes = ["28P01", "28000", "3D000", "08006", "08001"];
  if (authCodes.includes(err.code)) {
    logger.security("DB_UNAUTHORIZED_ACCESS", {
      message: err.message,
      code:    err.code,
      host:    process.env.DB_HOST,
      user:    process.env.DB_USER,
    });
  } else {
    logger.error("DB_CONNECTION_ERROR", { message: err.message, code: err.code });
  }
});

module.exports = pool;
