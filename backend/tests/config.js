"use strict";
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env.test") });

module.exports = {
  API:         process.env.TEST_API_URL          || "http://localhost:4000",
  NGINX:       process.env.TEST_NGINX_URL        || "http://localhost:80",
  NGINX_HTTPS: process.env.TEST_NGINX_HTTPS_URL  || "https://localhost:443",

  ADMIN: {
    email:    process.env.TEST_ADMIN_EMAIL    || "",
    password: process.env.TEST_ADMIN_PASSWORD || "",
  },
  USER: {
    email:    process.env.TEST_USER_EMAIL    || "",
    password: process.env.TEST_USER_PASSWORD || "",
  },
  REVIEWER: {
    email:    process.env.TEST_REVIEWER_EMAIL    || "",
    password: process.env.TEST_REVIEWER_PASSWORD || "",
  },
  LOCKABLE: {
    email:    process.env.TEST_LOCKABLE_EMAIL    || "",
    password: process.env.TEST_LOCKABLE_PASSWORD || "",
  },
};
