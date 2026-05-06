/**
 * Reset test account passwords and unlock them.
 * Run once before tests: node tests/reset_test_accounts.js
 */
"use strict";
// Load .env if running from host — silently ignored if not found (Docker already has env vars)
try { require("dotenv").config({ path: require("path").join(__dirname, "../.env") }); } catch {}

const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const pool = new Pool({
  host:     process.env.DB_HOST     || "postgres",
  user:     process.env.DB_USER     || "smq_app",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "smq_db",
  port:     process.env.DB_PORT     || 5432,
  ssl:      process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const accounts = [
  { email: "admin@test.com",    password: "Admin123123!" },
  { email: "ing@test.com",      password: "Ing123123!"   },
  { email: "reviewer@test.com", password: "Rev123123!"   },
];

async function reset() {
  console.log("Resetting test accounts...\n");
  for (const acc of accounts) {
    const hash = await bcrypt.hash(acc.password, 10);
    const res = await pool.query(
      `UPDATE users
       SET password_hash  = $1,
           login_attempts = 0,
           locked_until   = NULL,
           is_active      = true
       WHERE LOWER(email) = LOWER($2)
       RETURNING email, role_id`,
      [hash, acc.email]
    );
    if (res.rowCount === 0) {
      console.log(`  ✗ ${acc.email} — NOT FOUND in database`);
    } else {
      console.log(`  ✓ ${acc.email} — password updated + unlocked`);
    }
  }
  await pool.end();
  console.log("\nDone. Run: npm run test:04");
}

reset().catch(console.error);
