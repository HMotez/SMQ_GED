// =============================================================
// services/sharepointService.js
// RÔLE : Service d'intégration avec Microsoft SharePoint Online.
//        Permet l'upload automatique des documents validés vers
//        la bibliothèque SharePoint de l'entreprise ACTIA.
//        Désactivé par défaut (SHAREPOINT_ENABLED=false dans .env).
//        Utilise Microsoft Graph API avec OAuth2 (client credentials).
//        Fonctions :
//          uploadFileToSharePoint(localPath, fileName) → URL SharePoint
//          getSharePointLink(fileName)                 → URL existante
//        Le lien SharePoint est stocké dans versions.sharepoint_link
//        et affiché dans DocDetailModal pour un accès direct.
//
// Sprint 10 — Workflow A1/A2/A3 + SharePoint
//
// To enable: set SHAREPOINT_ENABLED=true in .env and fill in
// the required credentials below.
// =============================================================
"use strict";

const ENABLED =
  process.env.SHAREPOINT_ENABLED === "true" &&
  process.env.SHAREPOINT_TENANT_ID &&
  process.env.SHAREPOINT_CLIENT_ID &&
  process.env.SHAREPOINT_CLIENT_SECRET &&
  process.env.SHAREPOINT_SITE_URL;

if (ENABLED) {
  console.log("[SharePoint] Service enabled — Microsoft Graph API ready.");
} else {
  console.log("[SharePoint] Service disabled — set SHAREPOINT_ENABLED=true with credentials to activate.");
}

// ── Token cache ───────────────────────────────────────────────
let _tokenCache = null;
let _tokenExpiry = 0;

/**
 * Get an access token from Microsoft Identity Platform (OAuth2 client credentials).
 */
async function getAccessToken() {
  if (!ENABLED) return null;
  if (_tokenCache && Date.now() < _tokenExpiry) return _tokenCache;

  const url = `https://login.microsoftonline.com/${process.env.SHAREPOINT_TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type:    "client_credentials",
    client_id:     process.env.SHAREPOINT_CLIENT_ID,
    client_secret: process.env.SHAREPOINT_CLIENT_SECRET,
    scope:         "https://graph.microsoft.com/.default",
  });

  const res = await fetch(url, { method: "POST", body });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[SharePoint] Token request failed: ${err}`);
  }
  const data = await res.json();
  _tokenCache = data.access_token;
  _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return _tokenCache;
}

// ── SharePoint site/drive resolution ─────────────────────────

let _driveId = null;

async function getDriveId(token) {
  if (_driveId) return _driveId;
  const siteUrl  = process.env.SHAREPOINT_SITE_URL; // e.g. https://tenant.sharepoint.com/sites/SMQ-GED
  const hostname = new URL(siteUrl).hostname;
  const sitePath = new URL(siteUrl).pathname;

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${hostname}:${sitePath}?$select=id`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`[SharePoint] Could not resolve site: ${await res.text()}`);
  const { id: siteId } = await res.json();

  const dRes = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${siteId}/drive`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!dRes.ok) throw new Error(`[SharePoint] Could not resolve drive: ${await dRes.text()}`);
  const { id } = await dRes.json();
  _driveId = id;
  return _driveId;
}

// ── Public API ────────────────────────────────────────────────

/**
 * Upload a file to SharePoint Documents library.
 * Returns the SharePoint web URL of the uploaded file, or null if disabled.
 *
 * @param {string} localFilePath  — absolute path on server
 * @param {string} fileName       — destination file name in SharePoint
 * @returns {Promise<string|null>} SharePoint URL
 */
async function uploadFileToSharePoint(localFilePath, fileName) {
  if (!ENABLED) {
    console.log(`[SharePoint] Upload skipped (disabled): ${fileName}`);
    return null;
  }

  try {
    const fs    = require("fs");
    const token = await getAccessToken();
    const drive = await getDriveId(token);

    const fileBuffer = fs.readFileSync(localFilePath);
    const folder     = process.env.SHAREPOINT_FOLDER || "SMQ-GED";

    const uploadRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${drive}/root:/${folder}/${fileName}:/content`,
      {
        method:  "PUT",
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "application/octet-stream",
        },
        body: fileBuffer,
      }
    );

    if (!uploadRes.ok) {
      throw new Error(`Upload failed: ${await uploadRes.text()}`);
    }

    const item = await uploadRes.json();
    const link = item.webUrl;
    console.log(`[SharePoint] Uploaded "${fileName}" → ${link}`);
    return link;
  } catch (err) {
    console.error(`[SharePoint] uploadFileToSharePoint error: ${err.message}`);
    return null;
  }
}

/**
 * Get the SharePoint web URL for an existing file (by name).
 * Returns null if disabled or not found.
 *
 * @param {string} fileName
 * @returns {Promise<string|null>}
 */
async function getSharePointLink(fileName) {
  if (!ENABLED) return null;

  try {
    const token  = await getAccessToken();
    const drive  = await getDriveId(token);
    const folder = process.env.SHAREPOINT_FOLDER || "SMQ-GED";

    const res = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${drive}/root:/${folder}/${fileName}?$select=webUrl`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) return null;
    const { webUrl } = await res.json();
    return webUrl || null;
  } catch (err) {
    console.error(`[SharePoint] getSharePointLink error: ${err.message}`);
    return null;
  }
}

module.exports = {
  uploadFileToSharePoint,
  getSharePointLink,
  isEnabled: () => !!ENABLED,
};
