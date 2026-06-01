# SMQ GED — ACTIA Engineering Services

> ⚠️ Fichier privé — ne pas pousser sur un dépôt public


## Infos Ubuntu

| Usage           | Mot de passe      |
|-----------------|-------------------|
| Sudo terminal   | `REDACTED`          |
| App admin       | `REDACTED` |
---

## Lancer l'application

```bash
docker compose up --build -d
```

**http://localhost**

| Rôle             | Email                | Mot de passe    |
|------------------|----------------------|-----------------|
| Admin            | admin@test.com       | `REDACTED`  |
| Ing. Qualité     | ing@test.com         | `REDACTED`    |
| Reviewer         | reviewer@test.com    | `REDACTED`    |

Arrêter :

```bash
docker compose down
```

---

## Lancer les tests

```bash
# 1. Réinitialiser les comptes verrouillés
docker exec smq_db psql -U postgres -d smq_db -c "UPDATE users SET login_attempts=0, locked_until=NULL;"

# 2. Lancer tous les tests
cd backend
npm test
```

### Suite individuelle

```bash
npm run test:01   # Brute Force
npm run test:02   # Politique mot de passe
npm run test:03   # Messages d'erreur génériques
npm run test:04   # Gestion de session
npm run test:05   # HTTPS / SSL
npm run test:06   # Headers de sécurité
npm run test:07   # Durcissement serveur
npm run test:08   # Validation des entrées
npm run test:09   # Contrôle d'accès
npm run test:10   # Gestion des erreurs
npm run test:11   # WAF
npm run test:13   # Logs d'audit
npm run test:14   # Monitoring
npm run test:15   # Backup
npm run test:16   # Détection d'incidents
npm run test:17   # Monitoring DB
npm run test:18   # Audit dépendances
```

### test:12 — Rate Limiting (isolé)

```bash
docker exec smq_db psql -U postgres -d smq_db -c "UPDATE users SET login_attempts=0, locked_until=NULL;" && npm run test:12 && docker compose restart backend
```

---


