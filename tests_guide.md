# Guide des Tests de Sécurité — GED ACTIA ES

## Prérequis

### 1. Démarrer le backend
```bash
cd backend
npm run dev
# Serveur sur http://localhost:4000
```

### 2. Configurer les variables de test
Créer le fichier `backend/tests/.env.test` :
```env
TEST_API_URL=http://localhost:4000

TEST_ADMIN_EMAIL=admin@actia.ged
TEST_ADMIN_PASSWORD=Admin@2025!

TEST_REVIEWER_EMAIL=reviewer@actia.ged
TEST_REVIEWER_PASSWORD=Reviewer@2025!

TEST_LOCKABLE_EMAIL=reviewer@actia.ged
TEST_LOCKABLE_PASSWORD=Reviewer@2025!

# Pour les tests WAF/HTTPS (nécessite Docker)
TEST_NGINX_URL=http://localhost:80
TEST_NGINX_HTTPS_URL=https://localhost:443
```

### 3. (Optionnel) Démarrer Docker pour les tests WAF/HTTPS
```bash
docker compose up -d
```

---

## Lancer tous les tests d'un coup

```bash
cd backend
npm test
```
> ⚠️ Le test 12 (rate limiting) est exclu du `npm test` car il épuise le rate limiter.
> Lancez-le séparément avec `npm run test:12`.

---

## Tests individuels — Passed et Contre-tests (Failed attendus)

### TEST 01 — Protection Brute Force
```bash
npm run test:01
```

| Type | Ce qui est testé | Résultat attendu |
|------|-----------------|-----------------|
| ✅ Passed | 1ère tentative erronée | 401 INVALID_CREDENTIALS |
| ✅ Passed | 2ème tentative erronée | 401 INVALID_CREDENTIALS |
| ✅ Passed | 3ème tentative → compte verrouillé | 429 ACCOUNT_LOCKED |
| ✅ Passed | Bon mot de passe après verrouillage | 429 (toujours bloqué) |
| ✅ Passed | Message contient la durée en minutes | `\d+ minute` |
| ❌ Contre-test | Email inconnu n'affecte pas un autre compte | 401 (pas 429) |
| ❌ Contre-test | Réponse 429 sans fuite système | Pas de SQL/stack trace |
| ❌ Contre-test | Réponse 429 structurée (error + code) | JSON avec `error` et `code` |

> ⚠️ **Reset après le test** (si le compte reviewer@actia.ged est verrouillé) :
> ```sql
> UPDATE users SET login_attempts=0, locked_until=NULL WHERE email='reviewer@actia.ged';
> ```

---

### TEST 02 — Politique de Mot de Passe
```bash
npm run test:02
```

| Type | Ce qui est testé | Résultat attendu |
|------|-----------------|-----------------|
| ✅ Passed | Mot de passe < 12 chars | 400 VALIDATION_ERROR |
| ✅ Passed | Sans majuscule | 400 VALIDATION_ERROR |
| ✅ Passed | Sans minuscule | 400 VALIDATION_ERROR |
| ✅ Passed | Sans chiffre | 400 VALIDATION_ERROR |
| ✅ Passed | Sans caractère spécial | 400 VALIDATION_ERROR |
| ✅ Passed | Mot de passe vide | 400 |
| ✅ Passed | Mot de passe valide | 201 (pending) |
| ✅ Passed | Réponse contient la liste des erreurs | `errors[]` non vide |
| ❌ Contre-test | confirmPassword différent | 400 |
| ❌ Contre-test | Email déjà utilisé | 409 |
| ❌ Contre-test | Email manquant | 400 |
| ❌ Contre-test | Mot de passe valide → pas d'erreurs dans la réponse | Pas de champ `errors` |

---

### TEST 03 — Messages d'Erreur Génériques
```bash
npm run test:03
```

| Type | Ce qui est testé | Résultat attendu |
|------|-----------------|-----------------|
| ✅ Passed | Email inexistant → message générique | `Email ou mot de passe incorrect.` |
| ✅ Passed | Email valide + mauvais pwd → même message | Même message générique |
| ✅ Passed | Message ne révèle pas si l'email existe | Pas de `introuvable` / `not found` |
| ✅ Passed | Pas de stack trace dans la réponse | Pas de `Error: at` |
| ✅ Passed | Pas de chemin serveur dans la réponse | Pas de `/src/` `/controllers/` |
| ✅ Passed | Body vide → 400 | 400 |
| ❌ Contre-test | Login valide → token retourné (système OK) | 200 avec `token` |
| ❌ Contre-test | SQL injection dans email → pas de fuite SQL | Pas d'erreur PostgreSQL |
| ❌ Contre-test | Champs null → pas de 500 | 400 ou 401 |
| ❌ Contre-test | Réponse 200 ne contient pas le mot de passe | Pas de `password` dans le body |

---

### TEST 04 — Gestion des Sessions
```bash
npm run test:04
```

| Type | Ce qui est testé | Résultat attendu |
|------|-----------------|-----------------|
| ✅ Passed | Token contient `exp` | `exp` défini et numérique |
| ✅ Passed | Expiration ≤ 24h | `expiresInHours <= 24` |
| ✅ Passed | Signature invalide → 401 | 401 |
| ✅ Passed | Sans token → 401 | 401 |
| ✅ Passed | Token valide → `GET /me` retourne user | 200 |
| ✅ Passed | Token fonctionne avant logout | 200 |
| ✅ Passed | Logout → 200 | 200 |
| ✅ Passed | Après logout → token rejeté | 401 |
| ✅ Passed | Token invalidé sur autres endpoints | 401 |
| ❌ Contre-test | Algorithme `none` (bypass JWT) | 401 |
| ❌ Contre-test | Payload modifié (rôle falsifié) | 401 |
| ❌ Contre-test | Token expiré (exp = 1) | 401 |
| ❌ Contre-test | Double logout → idempotent | 200 |

---

### TEST 05 — HTTPS / SSL
```bash
npm run test:05
# Nécessite Docker : docker compose up -d
```

| Type | Ce qui est testé | Résultat attendu |
|------|-----------------|-----------------|
| ✅ Passed | HTTP → HTTPS redirection (301/302) | 301 ou 302 |
| ✅ Passed | Header Location pointe vers https:// | `https://` dans Location |
| ✅ Passed | Redirection préserve le chemin | `https://` dans Location |
| ✅ Passed | HTTPS répond (2xx ou 3xx) | < 500 |
| ✅ Passed | HSTS max-age=31536000 | Header HSTS présent |
| ✅ Passed | Connexion TLS établie (port 443) | Connexion réussie |
| ✅ Passed | Protocole TLS 1.2 ou 1.3 | `TLSv1.2` ou `TLSv1.3` |
| ❌ Contre-test | HTTP ne sert pas l'API directement | 301/302 (pas 200) |
| ❌ Contre-test | TLS 1.0 / 1.1 non utilisés | Pas `TLSv1` ni `TLSv1.1` |
| ❌ Contre-test | HTTP redirige bien vers HTTPS | Location commence par `https://` |

---

### TEST 06 — En-têtes de Sécurité HTTP
```bash
npm run test:06
```

| Type | Ce qui est testé | Résultat attendu |
|------|-----------------|-----------------|
| ✅ Passed | X-XSS-Protection: 1; mode=block | Présent |
| ✅ Passed | X-Content-Type-Options: nosniff | Présent |
| ✅ Passed | X-Frame-Options: DENY | Présent |
| ✅ Passed | CSP avec default-src 'self' | Présent |
| ✅ Passed | CSP frame-ancestors 'none' | Présent |
| ✅ Passed | HSTS max-age=31536000 | Présent |
| ✅ Passed | Referrer-Policy: strict-origin | Présent |
| ✅ Passed | Permissions-Policy (géoloc, micro, caméra) | Présent |
| ✅ Passed | /preview : X-Frame-Options = SAMEORIGIN | SAMEORIGIN |
| ❌ Contre-test | X-Powered-By ABSENT | Undefined |
| ❌ Contre-test | Server sans version Express/Node | Pas de `express/x.x` |
| ❌ Contre-test | CSP sans `unsafe-inline` ni `unsafe-eval` | Absent |
| ❌ Contre-test | X-Frame-Options pas ALLOWALL | Pas `ALLOWALL` |
| ❌ Contre-test | HSTS max-age ≥ 31536000 | ≥ 1 an |

---

### TEST 07 — Durcissement Serveur
```bash
npm run test:07
```

| Type | Ce qui est testé | Résultat attendu |
|------|-----------------|-----------------|
| ✅ Passed | X-Powered-By absent | Undefined |
| ✅ Passed | Header Server sans version | Pas de `express/x` |
| ✅ Passed | 404 sans technologies dans le body | Pas de `express` / `node.js` |
| ✅ Passed | 404 sans chemin interne | Pas de `/app/` `C:\` |
| ✅ Passed | JSON malformé → 400 sans stack trace | Pas de `SyntaxError at` |
| ❌ Contre-test | `/.env` → 404 | 404 |
| ❌ Contre-test | `/.git/config` → 404 | 404 |
| ❌ Contre-test | `/api/package.json` → 404 | 404 |
| ❌ Contre-test | `/api/node_modules/` → 404 | 404 |
| ❌ Contre-test | Réponse API toujours en JSON | `Content-Type: application/json` |

---

### TEST 08 — Validation des Entrées et Fichiers
```bash
npm run test:08
```

| Type | Ce qui est testé | Résultat attendu |
|------|-----------------|-----------------|
| ✅ Passed | GET sur endpoint POST → 404/405 | 404 ou 405 |
| ✅ Passed | Login sans body → 400 MISSING_CREDENTIALS | 400 |
| ✅ Passed | Login email seulement → 400 | 400 |
| ✅ Passed | Content-Type non-JSON → géré (pas 500) | Pas 500 |
| ✅ Passed | Prototype pollution → géré | 400 ou 401 |
| ✅ Passed | Upload sans auth → 401 | 401 |
| ✅ Passed | Upload `.exe` → rejeté | 400/415/422 |
| ✅ Passed | Upload `.sh` → rejeté | 400/415/422 |
| ✅ Passed | Upload `.html` → rejeté | 400/415/422 |
| ✅ Passed | Upload `.js` → rejeté | 400/415/422 |
| ✅ Passed | Types autorisés documentés | PDF/DOCX/XLSX uniquement |
| ❌ Contre-test | SQL injection dans titre → pas 500 | Pas 500, pas d'erreur SQL |
| ❌ Contre-test | Fichier > 50 Mo → 413/400 | 400 ou 413 |
| ❌ Contre-test | Path traversal dans filename → non stocké | Filename sans `../` |

---

### TEST 09 — Contrôle d'Accès (RBAC)
```bash
npm run test:09
```

| Type | Ce qui est testé | Résultat attendu |
|------|-----------------|-----------------|
| ✅ Passed | Routes protégées sans token → 401 | 401 sur chaque route |
| ✅ Passed | Token invalide → 401 | 401 |
| ✅ Passed | Header Authorization non-Bearer → 401 | 401 |
| ✅ Passed | Reviewer : lecture documents → 200 | 200 |
| ✅ Passed | Reviewer : gestion users → 403 | 403 |
| ✅ Passed | Reviewer : journaux d'audit → 403 | 403 |
| ✅ Passed | Reviewer : archive-expired → 403 | 403 |
| ✅ Passed | Admin : users → 200 | 200 |
| ✅ Passed | Admin : logs → 200 | 200 |
| ✅ Passed | 403 sans détails de permission | Pas de `sql`/`database` |
| ❌ Contre-test | Toutes routes protégées → 401 (visiteur) | 401 sur toutes |
| ❌ Contre-test | Reviewer ne voit pas les incidents | 403 |
| ❌ Contre-test | Reviewer ne peut pas créer d'incident | 403 |
| ❌ Contre-test | Reviewer ne peut pas changer les rôles | 403 |
| ❌ Contre-test | Admin accède aux incidents (pas de faux positif) | 200 |

---

### TEST 10 — Gestion des Erreurs
```bash
npm run test:10
```

| Type | Ce qui est testé | Résultat attendu |
|------|-----------------|-----------------|
| ✅ Passed | 404 sans stack trace | Pas de `Error: at` |
| ✅ Passed | 404 sans chemin interne | Pas de `/src/` |
| ✅ Passed | SQL injection → pas d'infos DB | Pas de `postgres`/`sql` |
| ✅ Passed | 404 sans version Node.js | Pas de `node vx.x` |
| ✅ Passed | JSON malformé → pas 500 | 400 |
| ✅ Passed | Types incorrects → pas 500 | Pas 500 |
| ✅ Passed | Body > 1 Mo → 413 ou 400 | 413 ou 400 |
| ✅ Passed | DELETE sur /login → 404/405 | 404 ou 405 |
| ✅ Passed | Sans Content-Type → géré | Pas 500 |
| ✅ Passed | Serveur répond après erreurs | 200 sur /health |
| ❌ Contre-test | Erreurs toujours en JSON | `Content-Type: application/json` |
| ❌ Contre-test | Body 404 structuré (champ `error`) | Champ `error` présent |
| ❌ Contre-test | PATCH /login → 404/405 (pas 500) | 404 ou 405 |
| ❌ Contre-test | 10 erreurs simultanées → serveur OK | 200 sur /health |
| ❌ Contre-test | Corps d'erreur < 1 Ko | < 1024 caractères |

---

### TEST 11 — WAF (Web Application Firewall)
```bash
npm run test:11
# Nécessite Docker : docker compose up -d
```

| Type | Ce qui est testé | Résultat attendu |
|------|-----------------|-----------------|
| ✅ Passed | Payloads SQL dans URL → 403 | 403 |
| ✅ Passed | Payloads XSS dans URL → 403 | 403 |
| ✅ Passed | Path traversal encodé → 403/400 | 403 ou 400 |
| ✅ Passed | Path traversal brut → non servi | 200/403/404 (pas /etc/passwd) |
| ✅ Passed | User-Agent scanner → 403 | 403 |
| ✅ Passed | Méthode TRACE → 403/405 | 403 ou 405 |
| ✅ Passed | HTTP → HTTPS redirect | 301 ou 302 |
| ❌ Contre-test | GET /api/health normal → pas bloqué | 200 (pas 403) |
| ❌ Contre-test | User-Agent navigateur standard → passé | Pas 403 |
| ❌ Contre-test | Paramètre normal `?lang=fr` → passé | Pas 403 |
| ❌ Contre-test | Payload SQL bloqué → 403 (pas 200 ni 500) | 403 uniquement |

---

### TEST 12 — Rate Limiting
```bash
# ⚠️ ISOLÉ — ne pas lancer avec npm test
npm run test:12
```
> Ce test épuise le rate limiter pour 15 min. Attendez avant de relancer d'autres tests auth.

| Type | Ce qui est testé | Résultat attendu |
|------|-----------------|-----------------|
| ✅ Passed | `N+1` requêtes rapides → 429 | 429 dans la liste |
| ✅ Passed | Réponse 429 contient Retry-After | Header présent |
| ✅ Passed | Limite globale > limite auth | 1000 > AUTH_RATE_LIMIT_MAX |
| ❌ Contre-test | 1 seule requête → jamais 429 | 400 ou 401 (pas 429) |
| ❌ Contre-test | Réponse 429 avec message non vide | `error` non vide |
| ❌ Contre-test | Réponse 429 avec code `RATE_LIMIT*` | Code présent |

---

### TEST 13 — Journaux d'Audit
```bash
npm run test:13
```

| Type | Ce qui est testé | Résultat attendu |
|------|-----------------|-----------------|
| ✅ Passed | Admin : GET /logs → 200 | 200 + tableau |
| ✅ Passed | Logs contiennent `action` + `created_at` | Champs présents |
| ✅ Passed | Échec login → log LOGIN_FAILURE | Log trouvé |
| ✅ Passed | Succès login → log LOGIN_SUCCESS | Log trouvé |
| ✅ Passed | Accès refusé → log ACCESS_DENIED | Log trouvé |
| ✅ Passed | GET /logs sans token → 401 | 401 |
| ✅ Passed | GET /logs avec Reviewer → 403 | 403 |
| ❌ Contre-test | Logs sans mots de passe en clair | Pas de `"password":"..."` |
| ❌ Contre-test | DELETE /logs → 404/405 (non supprimable) | 404 ou 405 |
| ❌ Contre-test | Timestamps valides (> 2024-01-01) | Pas de `1970` |
| ❌ Contre-test | Logs sans stack traces | Pas de `at .js:` |

---

### TEST 14 — Supervision des Performances
```bash
npm run test:14
```

| Type | Ce qui est testé | Résultat attendu |
|------|-----------------|-----------------|
| ✅ Passed | GET /health → 200 | 200 |
| ✅ Passed | Health retourne statut lisible | Contient `ok`/`healthy` |
| ✅ Passed | GET /metrics → format Prometheus | `# HELP` présent |
| ✅ Passed | Métriques incluent `http_requests_total` | Pattern présent |
| ✅ Passed | /health accessible sans auth | Pas 401 ni 403 |
| ✅ Passed | Réponse en < 2000ms | `< 2000` ms |
| ✅ Passed | DB accessible (API répond sans 500) | Pas 500 |
| ❌ Contre-test | /health sans credentials DB dans le body | Pas de `password`/`DB_PASS` |
| ❌ Contre-test | /health sans JWT secrets | Pas de `jwt_secret` |
| ❌ Contre-test | /health en < 500ms | `< 500` ms |
| ❌ Contre-test | /health retourne un objet (pas une string) | `typeof object` |
| ❌ Contre-test | /metrics sans tokens actifs | Pas de `Bearer ...` |

---

### TEST 15 — Gestion des Sauvegardes
```bash
npm run test:15
# Nécessite : docker compose up -d (le service backup génère les .sql.gz)
```

| Type | Ce qui est testé | Résultat attendu |
|------|-----------------|-----------------|
| ✅ Passed | Répertoire `./backups/` existe | `existsSync` true |
| ✅ Passed | Au moins un fichier `.sql.gz` | `length > 0` |
| ✅ Passed | Sauvegarde récente (< 48h) | `ageInHours <= 48` |
| ✅ Passed | Fichiers non vides (size > 0) | `size > 0` |
| ✅ Passed | `/backups/` non exposé via API | 404 |
| ❌ Contre-test | Backups compressés (.gz) | Avertissement si plain SQL |
| ❌ Contre-test | Noms sans `password`/`secret` | Pas de credentials |
| ❌ Contre-test | `/api/backups` → 404 | 404 |
| ❌ Contre-test | Noms horodatés (contiennent 4 chiffres) | Pattern `\d{4}` |

---

### TEST 16 — Détection des Incidents
```bash
npm run test:16
```

| Type | Ce qui est testé | Résultat attendu |
|------|-----------------|-----------------|
| ✅ Passed | Admin : GET /incidents → 200 | 200 |
| ✅ Passed | Réponse contient un tableau | `Array` |
| ✅ Passed | Incidents ont `type`/`severity`/`status` | Champs présents |
| ✅ Passed | GET /incidents sans token → 401 | 401 |
| ✅ Passed | Reviewer : GET /incidents → 403 | 403 |
| ✅ Passed | 5 échecs → incident BRUTE_FORCE (async) | 200 (endpoint OK) |
| ❌ Contre-test | Statut invalide → 400 | 400 |
| ❌ Contre-test | Incident inexistant → 404 | 404 |
| ❌ Contre-test | Création sans champs requis → 400 | 400 |
| ❌ Contre-test | 1 login normal → pas d'incident BRUTE_FORCE | `length === 0` |

---

### TEST 17 — Surveillance de la Base de Données
```bash
npm run test:17
```

| Type | Ce qui est testé | Résultat attendu |
|------|-----------------|-----------------|
| ✅ Passed | `db.js` a un écouteur `pool.on("error")` | Pattern présent |
| ✅ Passed | Codes 28P01, 28000 détectés | Présents dans le code |
| ✅ Passed | Journalise `DB_UNAUTHORIZED_ACCESS` | Pattern présent |
| ✅ Passed | Codes 08006, 08001, 3D000 présents | Présents |
| ✅ Passed | `logger.security()` existe | Fonction présente |
| ✅ Passed | Écriture dans `errors.log` | `ERROR_LOG` référencé |
| ✅ Passed | Répertoire logs accessible en écriture | `writeFileSync` sans erreur |
| ✅ Passed | DB connectée via `/api/health` | `database.status === ok` |
| ✅ Passed | Erreurs visibles dans `/api/logs` | Tableau retourné |
| ✅ Passed | Écouteur sans `throw` | Pas de `throw` dans le handler |
| ❌ Contre-test | `db.js` sans password hardcodé | Pas de `password: "..."` |
| ❌ Contre-test | Paramètres via `process.env.*` | `DB_HOST`/`DB_USER`/etc. |
| ❌ Contre-test | Pas d'IP hardcodée pour le host | Pas de `"192.168.x.x"` |
| ❌ Contre-test | `GET /api/health` → `database.status: ok` | `"ok"` |
| ❌ Contre-test | `errors.log` sans credentials en clair | Pas de `"password":"..."` |

---

### TEST 18 — Veille Patchs et Vulnérabilités
```bash
npm run test:18
```

| Type | Ce qui est testé | Résultat attendu |
|------|-----------------|-----------------|
| ✅ Passed | `scripts/patch-check.sh` existe | `existsSync` true |
| ✅ Passed | `scripts/security-audit.sh` existe | `existsSync` true |
| ✅ Passed | `patch-check.sh` non vide | `size > 0` |
| ✅ Passed | `patch-check.sh` contient `npm audit` + `trivy` | Patterns présents |
| ✅ Passed | `backend/package-lock.json` existe | `existsSync` true |
| ✅ Passed | `frontend/package-lock.json` existe | `existsSync` true |
| ✅ Passed | `package-lock.json` est un JSON valide | `JSON.parse` sans erreur |
| ✅ Passed | `docker-compose.yml` déclare `patch-monitor` | Pattern présent |
| ✅ Passed | `patch-monitor` utilise `node:20-slim` | Pattern présent |
| ✅ Passed | `patch-monitor` dans profile `audit` | Pattern présent |
| ✅ Passed | `patch-monitor` monte les locks en `:ro` | Pattern présent |
| ✅ Passed | `patch-monitor` sauvegarde dans `reports/security` | Pattern présent |
| ✅ Passed | Répertoire `reports/security` accessible | Créé si absent |
| ✅ Passed | `npm audit` backend → 0 vulnérabilité CRITIQUE | `critical === 0` |
| ❌ Contre-test | `package.json` sans version `*` ni `latest` | Pas de wildcard |
| ❌ Contre-test | `package-lock.json` lockfileVersion ≥ 2 | `>= 2` |
| ❌ Contre-test | `npm audit` backend → 0 vulnérabilité HAUTE | `high === 0` |
| ❌ Contre-test | `patch-check.sh` contient `exit 1` | Pattern présent |

---

## Interpréter les résultats Jest

```
PASS  tests/01_brute_force.test.js
  Règle 3 — Brute Force Protection
    ✓ 1ère tentative erronée → 401 INVALID_CREDENTIALS (120 ms)
    ✓ 3ème tentative erronée → compte verrouillé (429)  (80 ms)
  Contre-tests 01 — Brute Force : cas d'échec attendus
    ✓ Email inconnu n'affecte pas un autre compte        (95 ms)
    ✗ Réponse 429 structurée (error + code)             (12 ms)
```

- `✓` = test passé (comportement correct)
- `✗` = test échoué (le contrôle de sécurité ne fonctionne pas)
- `○` = test ignoré (variable d'env manquante ou Docker absent)

---

## Lancer tous les tests avec rapport HTML

```bash
cd backend
npx jest --verbose --coverage 2>&1 | tee test-report.txt
```

---

## Ordre recommandé d'exécution

```bash
# 1. Tests sans prérequis (backend seul)
npm run test:02
npm run test:03
npm run test:06
npm run test:07
npm run test:08
npm run test:10
npm run test:13
npm run test:14
npm run test:15
npm run test:17
npm run test:18

# 2. Tests nécessitant un compte configuré (.env.test)
npm run test:04
npm run test:09
npm run test:16

# 3. Test brute force (verrouille un compte — à faire en dernier)
npm run test:01

# 4. Tests nécessitant Docker (nginx)
npm run test:05
npm run test:11

# 5. Test rate limiting (isolé — épuise le limiter 15 min)
npm run test:12
```
