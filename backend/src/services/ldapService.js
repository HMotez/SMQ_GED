// ============================================================
// services/ldapService.js — Sprint 44
// Authentification LDAP / Active Directory (ISO 9001)
// Active uniquement si LDAP_ENABLED=true dans .env
// ============================================================
"use strict";

const ldap = require("ldapjs");

const LDAP_ENABLED   = process.env.LDAP_ENABLED === "true";
const LDAP_URL       = process.env.LDAP_URL       || "ldap://localhost:389";
const LDAP_BIND_DN   = process.env.LDAP_BIND_DN   || "";
const LDAP_BIND_PWD  = process.env.LDAP_BIND_PASSWORD || "";
const LDAP_BASE_DN   = process.env.LDAP_BASE_DN   || "";
const LDAP_FILTER    = process.env.LDAP_USER_FILTER || "(sAMAccountName={username})";

// Échappe les caractères spéciaux LDAP pour prévenir l'injection de filtre
function escapeLdap(s) {
  return String(s).replace(/[\\*()\x00]/g, (c) =>
    "\\" + c.charCodeAt(0).toString(16).padStart(2, "0")
  );
}

function createClient() {
  return ldap.createClient({
    url:            LDAP_URL,
    timeout:        5000,
    connectTimeout: 5000,
    tlsOptions:     { rejectUnauthorized: false },
  });
}

function bindAsync(client, dn, password) {
  return new Promise((resolve, reject) => {
    client.bind(dn, password, (err) => (err ? reject(err) : resolve()));
  });
}

function searchAsync(client, filter) {
  return new Promise((resolve, reject) => {
    const opts = {
      filter,
      scope:      "sub",
      attributes: ["dn", "cn", "displayName", "mail", "sAMAccountName"],
      timeLimit:  5,
      sizeLimit:  1,
    };
    const entries = [];
    client.search(LDAP_BASE_DN, opts, (err, res) => {
      if (err) return reject(err);
      res.on("searchEntry", (e) => entries.push(e.object));
      res.on("error",       reject);
      res.on("end",         () => resolve(entries));
    });
  });
}

/**
 * Authentifie un utilisateur via LDAP/AD.
 * Retourne { name, email, samAccount } en cas de succès, null sinon.
 * Ne lance jamais d'exception — les erreurs sont loggées et retournent null.
 */
async function authenticateLdap(email, password) {
  if (!LDAP_ENABLED) return null;
  if (!LDAP_URL || !LDAP_BASE_DN) {
    console.warn("[LDAP] LDAP_URL ou LDAP_BASE_DN non configuré.");
    return null;
  }

  const username = email.includes("@") ? email.split("@")[0] : email;
  const filter = LDAP_FILTER
    .replace("{username}", escapeLdap(username))
    .replace("{email}",    escapeLdap(email));

  const bindClient = createClient();
  try {
    // Étape 1 : liaison avec le compte de service pour chercher l'utilisateur
    if (LDAP_BIND_DN && LDAP_BIND_PWD) {
      await bindAsync(bindClient, LDAP_BIND_DN, LDAP_BIND_PWD);
    }

    // Étape 2 : recherche du DN de l'utilisateur
    const entries = await searchAsync(bindClient, filter);
    if (!entries.length) {
      console.info(`[LDAP] Utilisateur introuvable dans l'AD : ${username}`);
      return null;
    }

    const entry  = entries[0];
    const userDn = entry.dn || entry.objectName;

    // Étape 3 : liaison en tant qu'utilisateur pour vérifier le mot de passe
    const userClient = createClient();
    try {
      await bindAsync(userClient, userDn, password);
      console.info(`[LDAP] Authentification AD réussie pour : ${email}`);
      return {
        name:       entry.displayName || entry.cn || username,
        email:      entry.mail        || email,
        samAccount: entry.sAMAccountName || username,
      };
    } finally {
      userClient.unbind();
    }
  } catch (err) {
    console.warn(`[LDAP] Échec d'authentification AD pour ${email} : ${err.message}`);
    return null;
  } finally {
    bindClient.unbind();
  }
}

module.exports = {
  authenticateLdap,
  isEnabled: () => LDAP_ENABLED,
};
