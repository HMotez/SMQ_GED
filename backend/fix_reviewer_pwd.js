const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const pool = new Pool({
  host: "postgres",
  port: 5432,
  database: process.env.DB_NAME || "smq_db",
  user: process.env.DB_USER || "smq_app",
  password: process.env.DB_PASSWORD,
});

async function fix() {
  const hash = await bcrypt.hash("Rev123!", 12);
  console.log("Hash:", hash);
  const r = await pool.query(
    "UPDATE users SET password_hash=$1, login_attempts=0, locked_until=NULL WHERE email='reviewer@test.com' RETURNING email",
    [hash]
  );
  console.log("Updated:", r.rows[0]);
  await pool.end();
}

fix().catch(e => { console.error(e.message); process.exit(1); });
