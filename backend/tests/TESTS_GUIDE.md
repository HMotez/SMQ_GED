# Guide des Tests de Sécurité — GED ACTIA ES

## Avant de commencer

```powershell
docker compose up -d
docker exec smq_db psql -U postgres -d smq_db -c "UPDATE users SET login_attempts=0, locked_until=NULL;"
cd backend
```

---

## Lancer tous les tests

```powershell
npm test          # tous sauf test:12
npm run test:01   # un par un
```

## test:12 — Rate Limiting (isolé)

```powershell
docker compose restart backend && npm run test:12 && docker compose restart backend
```

---

## PASSED / FAILED — Ligne exacte à changer

> **Règle :** changer une donnée (chemin, mot de passe, email, token, contentType…), jamais le `expect()`.
> Après chaque FAILED → `git restore tests/` pour annuler.

---

### test:01 — Brute Force

```powershell
npm run test:01   # ✅ PASSED
```

**❌ FAILED** — `tests/01_brute_force.test.js` **ligne 15**
```js
// AVANT
const WRONG_PWD = "WrongPassXXX!000";
// APRÈS
const WRONG_PWD = config.LOCKABLE.password;
```
```powershell
npm run test:01   # ✗ Expected: 401  Received: 200
git restore tests/01_brute_force.test.js
docker exec smq_db psql -U postgres -d smq_db -c "UPDATE users SET login_attempts=0, locked_until=NULL;"
```

---

### test:02 — Politique de Mot de Passe

```powershell
npm run test:02   # ✅ PASSED
```

**❌ FAILED** — `tests/02_password_policy.test.js` **ligne 28**
```js
// AVANT
const res = await tryRegister("Short@1A");
// APRÈS
const res = await tryRegister("ValidPass@2025!");
```
```powershell
npm run test:02   # ✗ Expected: 400  Received: 201
git restore tests/02_password_policy.test.js
```

---

### test:03 — Messages d'Erreur Génériques

```powershell
npm run test:03   # ✅ PASSED
```

**❌ FAILED** — `tests/03_generic_errors.test.js` **ligne 18**
```js
// AVANT
email: "email_qui_nexiste_pas_xyz999@nowhere.invalid",
// APRÈS
email: config.ADMIN.email,
```
Et **ligne 19** :
```js
// AVANT
password: "SomePassword@123!",
// APRÈS
password: config.ADMIN.password,
```
```powershell
npm run test:03   # ✗ Expected: 401  Received: 200
git restore tests/03_generic_errors.test.js
```

---

### test:04 — Sessions JWT / Logout

```powershell
npm run test:04   # ✅ PASSED
```

**❌ FAILED** — `tests/04_session_management.test.js` **lignes 40–44** (remplacer tout le bloc)
```js
// AVANT
const fakeToken =
  "eyJhbGciOiJIUzI1NiJ9." +
  Buffer.from(JSON.stringify({ id: 1, exp: Math.floor(Date.now() / 1000) + 3600 }))
    .toString("base64url") +
  ".signature_invalide";
// APRÈS
const fakeToken = await getAdminToken();
```
```powershell
npm run test:04   # ✗ Expected: 401  Received: 200
git restore tests/04_session_management.test.js
```

---

### test:05 — HTTPS / SSL

```powershell
npm run test:05   # ✅ PASSED  (Docker requis)
```

**❌ FAILED** — `tests/05_https_ssl.test.js` **ligne 40**
```js
// AVANT
const res = await apiHttp.get("/");
// APRÈS
const res = await apiHttps.get("/");
```
```powershell
npm run test:05   # ✗ Expected value: [301, 302]  Received: 200
git restore tests/05_https_ssl.test.js
```

---

### test:06 — En-têtes de Sécurité

```powershell
npm run test:06   # ✅ PASSED
```

**❌ FAILED** — `tests/06_security_headers.test.js` **ligne 13**
```js
// AVANT
const res = await api.get("/api/health");
// APRÈS
const res = await api.get("/preview/test.pdf");
```
```powershell
npm run test:06   # ✗ Expected: "DENY"  Received: "SAMEORIGIN"
git restore tests/06_security_headers.test.js
```

---

### test:07 — Endurcissement Serveur

```powershell
npm run test:07   # ✅ PASSED
```

**❌ FAILED** — `src/server.js` **ligne 45**
```js
// AVANT
app.disable("x-powered-by");
// APRÈS (commenter la ligne)
// app.disable("x-powered-by");
```
```powershell
docker compose restart backend
npm run test:07   # ✗ Expected: undefined  Received: "Express"
git restore src/server.js
docker compose restart backend
```

---

### test:08 — Validation des Entrées / Upload

```powershell
npm run test:08   # ✅ PASSED
```

**❌ FAILED** — `tests/08_input_validation.test.js` **lignes 84–86**
```js
// AVANT
const res = await api.post("/api/documents", form, {
  headers: { ...authHeader(token), ...form.getHeaders() },
});
// APRÈS  (GET retourne 200 — pas dans [400, 415, 422])
const res = await api.get("/api/documents", { headers: authHeader(token) });
```
```powershell
npm run test:08   # ✗ Expected array: [400, 415, 422]  Received: 200
git restore tests/08_input_validation.test.js
```

---

### test:09 — Contrôle d'Accès RBAC

```powershell
npm run test:09   # ✅ PASSED
```

**❌ FAILED** — `tests/09_access_control.test.js` **ligne 67**
```js
// AVANT
const res = await api.get("/api/users", { headers: authHeader(reviewerToken) });
// APRÈS
const res = await api.get("/api/users", { headers: authHeader(adminToken) });
```
```powershell
npm run test:09   # ✗ Expected: 403  Received: 200
git restore tests/09_access_control.test.js
```

---

### test:10 — Gestion des Erreurs

```powershell
npm run test:10   # ✅ PASSED
```

**❌ FAILED** — `tests/10_error_handling.test.js` **ligne 13**
```js
// AVANT
const res = await api.get("/api/route_qui_nexiste_pas_xyz");
// APRÈS  (/api/health retourne 200, pas 404)
const res = await api.get("/api/health");
```
```powershell
npm run test:10   # ✗ Expected: 404  Received: 200
git restore tests/10_error_handling.test.js
```

---

### test:11 — WAF nginx

```powershell
npm run test:11   # ✅ PASSED  (Docker requis)
```

**❌ FAILED** — `tests/11_waf_protection.test.js` **ligne 49**
```js
// AVANT
const res = await apiHttps.get(`/api/test?q=${encodeURIComponent(payload)}`);
// APRÈS
const res = await apiHttps.get(`/api/test?q=hello`);
```
```powershell
npm run test:11   # ✗ Expected: 403  Received: 404
git restore tests/11_waf_protection.test.js
```

---

### test:12 — Rate Limiting

```powershell
docker compose restart backend 
npm run test:12 
docker compose restart backend   # ✅ PASSED
```

**❌ FAILED** — `tests/12_rate_limiting.test.js` **ligne 24**
```js
// AVANT
for (let i = 0; i < AUTH_RATE_LIMIT_MAX + 2; i++) {
// APRÈS
for (let i = 0; i < 3; i++) {
```
```powershell
docker compose restart backend
npm run test:12   # ✗ Expected array to contain 429 — not found
git restore tests/12_rate_limiting.test.js
docker compose restart backend
```

---

### test:13 — Journaux d'Audit

```powershell
npm run test:13   # ✅ PASSED
```

**❌ FAILED** — `tests/13_audit_logs.test.js` **ligne 22**
```js
// AVANT
const res = await api.get("/api/logs", { headers: authHeader(adminToken) });
// APRÈS
const reviewerToken = await getReviewerToken();
const res = await api.get("/api/logs", { headers: authHeader(reviewerToken) });
```
```powershell
npm run test:13   # ✗ Expected: 200  Received: 403
git restore tests/13_audit_logs.test.js
```

---

### test:14 — Supervision / Métriques

```powershell
npm run test:14   # ✅ PASSED
```

**❌ FAILED** — `tests/14_monitoring.test.js` **ligne 14**
```js
// AVANT
const res = await api.get("/api/health");
// APRÈS
const res = await api.get("/api/logs");
```
```powershell
npm run test:14   # ✗ Expected: 200  Received: 401
git restore tests/14_monitoring.test.js
```

---

### test:15 — Sauvegardes

```powershell
npm run test:15   # ✅ PASSED  (Docker requis)
```

**❌ FAILED** — `tests/15_backup.test.js` **ligne 12**
```js
// AVANT
const BACKUP_DIR = path.resolve(__dirname, "../../backups");
// APRÈS
const BACKUP_DIR = path.resolve(__dirname, "../../backups_inexistant");
```
```powershell
npm run test:15   # ✗ Expected: true  Received: false
git restore tests/15_backup.test.js
```

---

### test:16 — Détection d'Incidents

```powershell
npm run test:16   # ✅ PASSED
```

**❌ FAILED** — `tests/16_incident_detection.test.js` **ligne 22**
```js
// AVANT
const res = await api.get("/api/incidents", { headers: authHeader(adminToken) });
// APRÈS
const reviewerToken = await getReviewerToken();
const res = await api.get("/api/incidents", { headers: authHeader(reviewerToken) });
```
```powershell
npm run test:16   # ✗ Expected: 200  Received: 403
git restore tests/16_incident_detection.test.js
```

---

### test:17 — Surveillance Accès Non Autorisés à la BD

```powershell
npm run test:17   # ✅ PASSED
```

**❌ FAILED** — `tests/17_db_monitoring.test.js` **ligne 15**
```js
// AVANT
const DB_JS = path.resolve(__dirname, "../src/db.js");
// APRÈS  (utils.js ne contient pas "28P01")
const DB_JS = path.resolve(__dirname, "../src/utils.js");
```
```powershell
npm run test:17   # ✗ Expected string to contain "28P01"
git restore tests/17_db_monitoring.test.js
```

---

### test:18 — Veille Patchs & Audit npm

```powershell
npm run test:18   # ✅ PASSED
```

**❌ FAILED** — `tests/18_patch_audit.test.js` **ligne 18**
```js
// AVANT
const PATCH_SCRIPT = path.join(ROOT, "scripts", "patch-check.sh");
// APRÈS
const PATCH_SCRIPT = path.join(ROOT, "scripts", "patch-check-inexistant.sh");
```
```powershell
npm run test:18   # ✗ Expected: true  Received: false
git restore tests/18_patch_audit.test.js
```

---

## Récupération après erreur

```powershell
# Compte verrouillé (après test:01)
docker exec smq_db psql -U postgres -d smq_db -c "UPDATE users SET login_attempts=0, locked_until=NULL;"

# Rate limit épuisé (après test:12)
docker compose restart backend

# Annuler toutes les modifications FAILED
git restore tests/
```
