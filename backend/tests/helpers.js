"use strict";
const axios  = require("axios");
const https  = require("https");
const config = require("./config");

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Direct backend API — port 4000
const api = axios.create({
  baseURL:        config.API,
  validateStatus: () => true,
  timeout:        15000,
});

// Intercept connection errors and give a clear message
api.interceptors.response.use(null, (err) => {
  if (err.code === "ECONNREFUSED" || err.code === "ECONNRESET" || err.message?.includes("AggregateError")) {
    throw new Error(
      `\n❌ Impossible de se connecter au backend (${config.API})\n` +
      `   Démarrez le backend d'abord : cd backend && npm run dev\n`
    );
  }
  throw err;
});

// Through nginx HTTPS — port 443
const apiHttps = axios.create({
  baseURL:        config.NGINX_HTTPS,
  validateStatus: () => true,
  timeout:        15000,
  httpsAgent,
});

// Through nginx HTTP — port 80 (no redirect follow)
const apiHttp = axios.create({
  baseURL:        config.NGINX,
  validateStatus: () => true,
  timeout:        15000,
  maxRedirects:   0,
  httpsAgent,
});

async function login(credentials) {
  return api.post("/api/auth/login", credentials);
}

// Token cache — avoids exhausting the auth rate limit across test suites
const _tokenCache = {};

async function getToken(credentials) {
  const key = credentials.email;
  if (_tokenCache[key]) return _tokenCache[key];
  const res = await login(credentials);
  if (!res.data?.token) {
    throw new Error(`Login failed (${res.status}): ${JSON.stringify(res.data)}`);
  }
  _tokenCache[key] = res.data.token;
  return _tokenCache[key];
}

function clearTokenCache() { Object.keys(_tokenCache).forEach(k => delete _tokenCache[k]); }

async function getAdminToken()    { return getToken(config.ADMIN); }
async function getUserToken()     { return getToken(config.USER); }
async function getReviewerToken() { return getToken(config.REVIEWER); }

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

function skipIfMissing(val, label) {
  if (!val) {
    console.warn(`⚠️  ${label} non configuré dans tests/.env.test — test ignoré`);
    return true;
  }
  return false;
}

module.exports = {
  api, apiHttps, apiHttp,
  login, getToken, getAdminToken, getUserToken, getReviewerToken,
  clearTokenCache, authHeader, skipIfMissing,
};
