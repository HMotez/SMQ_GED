# Exécuter les tests de sécurité

## Avant de commencer

```powershell
docker compose up -d
docker exec smq_db psql -U postgres -d smq_db -c "UPDATE users SET login_attempts=0, locked_until=NULL;"
cd backend
```

---

## Tests un par un

```powershell
npm run test:01   # Règle 3  — Brute Force
npm run test:02   # Règle 2  — Mot de passe complexe
npm run test:03   # Règle 4  — Messages d'erreur génériques
npm run test:04   # Règles 5,6,7 — Sessions JWT / Logout
npm run test:05   # Règles 8,9 — HTTPS / SSL
npm run test:06   # Règle 12 — En-têtes de sécurité
npm run test:07   # Règle 19 — Endurcissement serveur
npm run test:08   # Règles 10,11 — Validation entrées / Upload
npm run test:09   # Règles 13,14 — Contrôle d'accès RBAC
npm run test:10   # Règles 15,16 — Gestion des erreurs
npm run test:11   # Règle 23 — WAF nginx
npm run test:13   # Règle 31 — Journaux d'audit
npm run test:14   # Règle 29 — Supervision / Métriques
npm run test:15   # Règle 25 — Sauvegardes
npm run test:16   # Règle 36 — Détection d'incidents
npm run test:17   # Gestion BD — Surveillance accès non autorisés (pool error handler)
npm run test:18   # Gestion de mise à jour — Veille patchs & audit npm
```

---

## test:12 — Rate Limiting (à part)

> ⚠️ **TOUJOURS exécuter seul, TOUJOURS redémarrer le backend après.**
> Ce test envoie 101 requêtes sur `/api/auth/login` et épuise le quota pour 15 min.
> Si tu lances test:13 après sans restart → LOGIN FAILED 429.

```powershell
docker compose restart backend
npm run test:12
docker compose restart backend   # ← obligatoire avant tout autre test
```

---

## Tous les tests d'un coup

```powershell
npm test
```

> `test:12` est exclu du `npm test` automatique. Lance-le séparément.

---

## Détail des nouveaux tests

### test:17 — Surveillance accès non autorisés à la BD

Vérifie que le pool PostgreSQL intercepte les erreurs d'authentification et les
journalise comme événements `SECURITY` dans `backend/logs/errors.log`.

| Ce qui est testé | Méthode |
|---|---|
| `pool.on("error")` enregistré dans db.js | Inspection du code source |
| Codes d'erreur auth PostgreSQL détectés (28P01, 28000) | Inspection du code source |
| Appel à `logger.security("DB_UNAUTHORIZED_ACCESS")` | Inspection du code source |
| Répertoire `backend/logs/` accessible en écriture | Système de fichiers |
| DB connectée et opérationnelle | `GET /api/health` |
| Logs visibles par l'Admin | `GET /api/logs` |
| L'écouteur ne relance pas l'erreur (pas de crash) | Inspection du code source |

```powershell
npm run test:17
```

---

### test:18 — Veille patchs & audit npm

Vérifie que l'infrastructure d'audit de vulnérabilités est en place et opérationnelle.

| Ce qui est testé | Méthode |
|---|---|
| `scripts/patch-check.sh` existe | Système de fichiers |
| `scripts/security-audit.sh` existe | Système de fichiers |
| `patch-check.sh` contient npm audit + Trivy | Inspection du contenu |
| `package-lock.json` backend présent | Système de fichiers |
| `package-lock.json` frontend présent | Système de fichiers |
| Service `patch-monitor` déclaré dans docker-compose | Inspection YAML |
| `patch-monitor` dans le profile `audit` (pas par défaut) | Inspection YAML |
| `patch-monitor` monte les lock files en `:ro` | Inspection YAML |
| Répertoire `reports/security/` accessible | Système de fichiers |
| npm audit backend → 0 vulnérabilité CRITIQUE | Exécution npm audit |

```powershell
npm run test:18
```

**Pour lancer le scan Docker complet (Trivy) :**

```powershell
docker compose --profile audit run --rm patch-monitor
docker compose --profile audit run --rm trivy
```

---

## Si un test échoue

**Compte verrouillé :**
```powershell
docker exec smq_db psql -U postgres -d smq_db -c "UPDATE users SET login_attempts=0, locked_until=NULL;"
```

**Rate limit épuisé :**
```powershell
docker compose restart backend
```

**test:17 — logs/ introuvable :**
```powershell
mkdir backend\logs
```

**test:18 — npm audit réseau indisponible :**
> Le test est ignoré automatiquement si npm registry est inaccessible.
> Relancez avec connexion internet active.
