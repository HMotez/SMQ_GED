const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const pool = new Pool({
  host: "postgres",
  port: 5432,
  database: process.env.DB_NAME || "smq_db",
  user: process.env.DB_USER || "smq_app",
  password: process.env.DB_PASSWORD,
});

async function verify() {
  const r = await pool.query("SELECT password_hash FROM users WHERE email='reviewer@test.com'");
  const hash = r.rows[0].password_hash;
  console.log("Hash from DB:", hash);
  console.log("Hash length:", hash.length);
  const ok = await bcrypt.compare("Rev123!", hash);
  console.log("Rev123! matches:", ok);
  await pool.end();
}

verify().catch(e => { console.error(e.message); process.exit(1); });
