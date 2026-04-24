const { Pool } = require("pg");
require("dotenv").config();

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

module.exports = pool;
