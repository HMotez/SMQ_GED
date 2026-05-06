/**
 * Jest global setup — runs once before all test suites.
 * Resets login_attempts and locked_until for all test accounts
 * so the full suite starts from a clean auth state.
 */
"use strict";
try { require("dotenv").config({ path: require("path").join(__dirname, "../.env") }); } catch {}
// Also load .env.test overrides
try { require("dotenv").config({ path: require("path").join(__dirname, ".env.test"), override: true }); } catch {}

const { Pool } = require("pg");

module.exports = async function globalSetup() {
  const pool = new Pool({
    host:     process.env.DB_HOST     || "localhost",
    user:     process.env.DB_USER     || "smq_app",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME     || "smq_db",
    port:     parseInt(process.env.DB_PORT || "5432"),
    ssl:      process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  try {
    await pool.query(
      "UPDATE users SET login_attempts = 0, locked_until = NULL WHERE locked_until IS NOT NULL OR login_attempts > 0"
    );
    console.log("[globalSetup] ✓ Comptes déverrouillés pour la suite de tests.");
  } catch (err) {
    // DB not directly accessible from host — backend Docker handles it
    console.warn("[globalSetup] ⚠️  DB inaccessible depuis l'hôte — déverrouillez manuellement si besoin.");
  } finally {
    await pool.end();
  }
};
