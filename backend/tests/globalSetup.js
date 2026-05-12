"use strict";
const { execSync } = require("child_process");

/**
 * Jest globalSetup — runs once before all test suites.
 * Resets locked accounts so test:01 (brute force) always starts clean.
 */
module.exports = async function globalSetup() {
  try {
    execSync(
      'docker exec smq_db psql -U postgres -d smq_db -c "UPDATE users SET login_attempts=0, locked_until=NULL;"',
      { stdio: "pipe", timeout: 10000 }
    );
    console.log("\n✅ [globalSetup] Comptes réinitialisés (login_attempts=0, locked_until=NULL)\n");
  } catch (err) {
    console.warn("\n⚠️  [globalSetup] Impossible de réinitialiser les comptes (Docker non disponible ?)\n");
  }
};
