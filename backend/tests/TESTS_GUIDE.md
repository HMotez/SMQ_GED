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
