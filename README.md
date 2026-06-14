<div align="center">

<img src="frontend/src/assets/Logo.png" alt="ACTIA Logo" width="160"/>

# SMQ\_GED — Système de Management de la Qualité & Gestion Électronique des Documents

**Projet de Fin d'Études — ACTIA Engineering Services (AES)**

*Licence Appliquée en Génie Logiciel / Systèmes d'Information — FSM Monastir, 2025-2026*

---

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com)
[![License](https://img.shields.io/badge/Licence-Privée-red)](#)

</div>

---

## Table des matières

1. [Présentation du projet](#-présentation-du-projet)
2. [Architecture technique](#-architecture-technique)
3. [Fonctionnalités](#-fonctionnalités)
4. [Captures d'écran](#-captures-décran)
5. [Rôles & Permissions](#-rôles--permissions)
6. [Cycle de vie ISO 9001](#-cycle-de-vie-iso-9001)
7. [Sécurité](#-sécurité)
8. [Infrastructure Docker](#-infrastructure-docker)
9. [Auteur](#-auteur)

---

## Présentation du projet

SMQ\_GED est une plateforme web complète de **Gestion Électronique des Documents** alignée sur la norme **ISO 9001:2015**, développée dans le cadre d'un PFE au sein d'**ACTIA Engineering Services**.

Elle centralise la création, la révision, la validation et l'archivage des documents qualité de l'entreprise en remplaçant les processus papier par un workflow numérique sécurisé et traçable.

### Objectifs

| Objectif | Description |
|---|---|
| **Conformité ISO 9001** | Workflow documentaire complet avec cycle de vie normalisé |
| **Traçabilité totale** | Journal d'audit de toutes les actions utilisateurs |
| **Sécurité by design** | 18 suites de tests de sécurité, WAF, antivirus, chiffrement |
| **Multi-rôles RBAC** | Contrôle d'accès granulaire par rôle |
| **IA intégrée** | Assistant documentaire basé sur GPT-4o (OpenAI) |

---

## Architecture technique

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                             │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (443) / HTTP→HTTPS redirect
                  ┌────────▼────────┐
                  │  Nginx + WAF    │  Frontend React (SPA)
                  │  Let's Encrypt  │  Reverse proxy sécurisé
                  └────────┬────────┘
                           │ Réseau interne Docker (smq_network)
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐
   │  Backend    │  │ PostgreSQL  │  │   Kafka    │
   │ Node/Express│  │  16 + SSL   │  │  (KRaft)   │
   │  Port 4000  │  │  Port 5432  │  │ Port 9092  │
   └──────┬──────┘  └─────────────┘  └────────────┘
          │
   ┌──────▼──────┐  ┌─────────────┐  ┌────────────┐
   │   ClamAV   │  │  Prometheus │  │  Grafana   │
   │  Antivirus  │  │  Métriques  │  │ Dashboards │
   └─────────────┘  └─────────────┘  └────────────┘
```

### Stack technologique

| Couche | Technologie | Version |
|---|---|---|
| **Frontend** | React + Vite + Tailwind CSS | 19 / 8 / 4 |
| **Routing** | React Router DOM | 7 |
| **Backend** | Node.js + Express | 20 / 5 |
| **Base de données** | PostgreSQL | 16 |
| **Messagerie** | Apache Kafka (KRaft) | 3.7 |
| **Authentification** | JWT + bcryptjs | — |
| **Antivirus** | ClamAV | stable |
| **IA** | OpenAI GPT-4o | — |
| **Annuaire** | LDAP (ldapjs) | — |
| **Emails** | Nodemailer via Kafka | — |
| **Supervision** | Prometheus + Grafana | latest |
| **Reverse proxy** | Nginx + WAF | alpine |
| **Conteneurs** | Docker Compose | — |
| **Export** | jsPDF, docx, pptxgenjs, xlsx | — |

---

## Fonctionnalités

### Gestion documentaire

- **Création de documents** — Formulaire guidé avec classification par type (Procédure, Trame, Instruction, Guide, Manuel), processus, responsable et origine (Interne / QHSE / Client).
- **Liste des documents** — Vue filtrée par type, statut, processus, responsable et retard. Indicateurs de délai de révision en temps réel.
- **Versions multiples** — Historique complet des révisions avec accès individuel à chaque version (Consulter, Télécharger, PDF, Word, Excel).
- **Archivage** — Déplacement des documents obsolètes vers une archive consultable.
- **Export multi-format** — PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx).

### Workflow de validation ISO 9001

- **Tableau de validation** — Interface dédiée aux Reviewers pour approuver ou rejeter les documents *En validation*.
- **Workflow visuel** — Kanban par statut montrant la répartition des documents à chaque étape du cycle de vie.
- **Transitions de statut** — Progression guidée et contrôlée selon la matrice de permissions par rôle.

### Tableau de bord

- Statistiques en temps réel : répartition par statut, par type et par processus.
- Graphique circulaire (Chart.js) avec légende interactive.
- Section **Retard de révision** : documents dont la date de révision est dépassée, triés par urgence.

### Notifications intelligentes

- Alertes automatiques sur les **documents expirés** (révision dépassée).
- Notifications pour les **appels en relecture**, **nouvelles versions** et **validations en attente**.
- Badges dynamiques dans la barre de navigation.
- Marquage individuel ou global comme lu.

### Assistant IA

- Assistant conversationnel contextuel basé sur **OpenAI GPT-4o**.
- Modes : Création Qualité, Amélioration Continue, et mode libre.
- Historique des conversations persistant par session.
- Suggestions rapides intégrées pour les cas d'usage documentaires courants.

### Administration

- **Gestion des utilisateurs** (Admin) — Création, modification de rôle, activation/désactivation des comptes.
- **Journal d'audit** (Admin + Ing. Qualité) — Consultation de toutes les actions système avec filtres par type d'action, utilisateur et plage de dates. Export PDF.
- **Matrice de permissions** — Visualisation des droits par rôle directement dans l'interface.

### Authentification & Sessions

- Connexion par email/mot de passe avec JWT.
- Réinitialisation de mot de passe par email (lien sécurisé à usage unique).
- Détection d'inactivité avec déconnexion automatique (`SessionManager`).
- Protection brute-force : verrouillage de compte après tentatives échouées.

---

## Captures d'écran

### Connexion & Profils d'accès

<img src="frontend/src/assets/Interface1.png" alt="Page de connexion et matrice des rôles" width="100%"/>

*Page de connexion sécurisée avec aperçu de la matrice des profils d'accès*

---

### Tableau de bord

<img src="frontend/src/assets/Interface14.png" alt="Tableau de bord" width="100%"/>

*Dashboard : statistiques par statut, type de document et processus — documents en retard de révision*

---

### Liste des documents

<img src="frontend/src/assets/Interface6.png" alt="Liste des documents" width="100%"/>

*Vue liste avec filtres avancés (type, statut, processus, responsable)*

---

### Historique des versions

<img src="frontend/src/assets/Interface7.png" alt="Versions d'un document" width="100%"/>

*Détail d'un document avec historique complet des révisions et options de téléchargement multi-format*

---

### Validations ISO

<img src="frontend/src/assets/Interface8.png" alt="Validations ISO" width="100%"/>

*Interface de validation documentaire avec compteurs (En validation, Validés, Rejetés)*

---

### Matrice des permissions & Cycle de vie

<img src="frontend/src/assets/Interface9.png" alt="Matrice de permissions et cycle de vie ISO 9001" width="100%"/>

*Matrice RBAC des permissions par rôle et visualisation du cycle de vie ISO 9001 à 10 étapes*

---

### Workflow ISO 9001

<img src="frontend/src/assets/Interface10.png" alt="Workflow ISO 9001" width="100%"/>

*Vue Kanban du workflow : répartition des documents par étape avec légende des rôles*

---

### Notifications

<img src="frontend/src/assets/Interface15.png" alt="Centre de notifications" width="100%"/>

*Centre de notifications : documents expirés, appels en relecture, nouvelles versions*

---

### Nouveau document

<img src="frontend/src/assets/Interface18.png" alt="Création de document" width="100%"/>

*Formulaire de création de document avec classification, processus et origine*

---

### Assistant IA

<img src="frontend/src/assets/Interface17.png" alt="Assistant IA" width="100%"/>

*Assistant documentaire IA (GPT-4o) avec suggestions rapides et modes spécialisés*

---

### Journal d'audit

<img src="frontend/src/assets/Interface3.png" alt="Journal d'audit" width="100%"/>

*Journal d'activités système : 66 entrées filtrables par action, utilisateur et date — export PDF*

---

### Gestion des utilisateurs

<img src="frontend/src/assets/Interface2.png" alt="Gestion des utilisateurs" width="100%"/>

*Interface d'administration des comptes avec gestion des rôles en temps réel*

---

## Rôles & Permissions

| Permission | Admin | Ing. Qualité | Reviewer | Visiteur |
|---|:---:|:---:|:---:|:---:|
| Lire les documents | ✅ | ✅ | ✅ | ✅ |
| Créer un document | ✅ | ✅ | ❌ | ❌ |
| Modifier un document | ✅ | ✅ | ❌ | ❌ |
| Valider un document | ✅ | ❌ | ✅ | ❌ |
| Changer le statut | ✅ | ✅ | ✅ | ❌ |
| Commenter | ✅ | ✅ | ✅ | ❌ |
| Archiver | ✅ | ❌ | ❌ | ❌ |
| Gérer les utilisateurs | ✅ | ❌ | ❌ | ❌ |
| Consulter les logs | ✅ | ✅ | ❌ | ❌ |

---

## Cycle de vie ISO 9001

```
Brouillon → En rédaction → Appel en relecture → En relecture
    → En correction → En validation → Validé → Diffusé
        → Obsolète → Archivé
```

Chaque transition est :
- **Contrôlée** par la matrice de permissions (rôle requis)
- **Tracée** dans le journal d'audit (qui, quand, quoi)
- **Notifiée** aux parties prenantes concernées

---

## Sécurité

L'application a été conçue avec une approche **Security by Design**. Toutes les mesures ci-dessous sont couvertes par **18 suites de tests Jest automatisés**.

### Authentification & Sessions

| Mesure | Détail |
|---|---|
| JWT signé (HS256) | Expiration configurable, stocké côté client uniquement |
| bcryptjs (rounds 12) | Hachage des mots de passe — jamais stockés en clair |
| Politique de mot de passe | Longueur minimale, majuscule, chiffre, caractère spécial |
| Verrouillage brute-force | Compte verrouillé après N tentatives échouées |
| Réinitialisation sécurisée | Token OTP signé, usage unique, expiration courte |
| Déconnexion par inactivité | `SessionManager` frontend — timeout configurable |

### Transport & Réseau

| Mesure | Détail |
|---|---|
| HTTPS obligatoire | Nginx + Let's Encrypt, redirection HTTP → HTTPS |
| HSTS | `max-age=31536000; includeSubDomains; preload` |
| PostgreSQL SSL | Connexion chiffrée backend → base de données |
| Réseau interne Docker | Backend et DB non exposés à l'extérieur, uniquement Nginx |

### En-têtes HTTP de sécurité

| En-tête | Valeur |
|---|---|
| `Content-Security-Policy` | Sources restreintes, `upgrade-insecure-requests` |
| `X-Frame-Options` | `DENY` (sauf routes fichiers : `SAMEORIGIN`) |
| `X-Content-Type-Options` | `nosniff` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Caméra, micro, géolocalisation désactivés |

### Contrôle d'accès

| Mesure | Détail |
|---|---|
| RBAC middleware | Chaque route vérifie le rôle JWT avant d'exécuter |
| Principe du moindre privilège | Utilisateur DB dédié avec droits minimaux (migration 009) |
| Validation des entrées | Sanitisation systématique, rejet des payloads malformés |
| WAF Nginx | Règles de filtrage SQL injection, XSS, path traversal |

### Fichiers uploadés

| Mesure | Détail |
|---|---|
| Antivirus ClamAV | Scan INSTREAM de chaque fichier avant stockage |
| Rejet immédiat | Fichier infecté supprimé, erreur 422 retournée |
| Extension & taille | Vérification du type MIME et limite de taille |

### Audit & Monitoring

| Mesure | Détail |
|---|---|
| Journal d'audit complet | Toutes les actions (création, modification, connexion, etc.) |
| Prometheus | Collecte de métriques applicatives en temps réel |
| Grafana | Tableaux de bord de supervision |
| Détection d'incidents | Alertes sur comportements anormaux |
| Sauvegardes automatiques | Dumps `.sql.gz` quotidiens avec vérification d'intégrité |
| Scan de vulnérabilités | Trivy (images Docker) + npm audit (dépendances) |

### Suites de tests de sécurité (Jest)

```
01 Brute Force          07 Durcissement serveur   13 Logs d'audit
02 Politique MDP        08 Validation des entrées  14 Monitoring
03 Erreurs génériques   09 Contrôle d'accès        15 Backup
04 Gestion de session   10 Gestion des erreurs     16 Détection incidents
05 HTTPS / SSL          11 WAF                     17 Monitoring DB
06 Headers sécurité     12 Rate Limiting            18 Audit dépendances
```

---

## Infrastructure Docker

L'application tourne entièrement via **Docker Compose** avec les services suivants :

| Service | Image | Rôle |
|---|---|---|
| `smq_frontend` | React + Nginx | SPA + reverse proxy + WAF + SSL |
| `smq_backend` | Node.js 20 | API REST (port 4000 interne) |
| `smq_db` | PostgreSQL 16 Alpine | Base de données (SSL activé) |
| `smq_kafka` | Apache Kafka 3.7 | Messagerie asynchrone (emails) |
| `smq_clamav` | ClamAV stable | Antivirus des fichiers uploadés |
| `smq_backup` | PostgreSQL 16 Alpine | Sauvegardes automatiques .sql.gz |
| `smq_prometheus` | Prometheus | Collecte de métriques (`--profile monitoring`) |
| `smq_grafana` | Grafana | Tableaux de bord (`--profile monitoring`) |
| `smq_certbot` | Certbot | Renouvellement SSL Let's Encrypt (`--profile ssl-prod`) |
| `smq_trivy` | Aqua Trivy | Scanner de vulnérabilités (`--profile audit`) |
| `smq_patch_monitor` | Node 20 slim | npm audit automatique (`--profile audit`) |

Tous les services communiquent via le réseau privé `smq_network`. Seul Nginx est exposé au public (ports 80/443).

---

## Auteur

| | |
|---|---|
| **Étudiant** | Motez HM |
| **Formation** | Licence Appliquée — Génie Logiciel / Systèmes d'Information |
| **Établissement** | Faculté des Sciences de Monastir (FSM) |
| **Entreprise d'accueil** | ACTIA Engineering Services (AES) |
| **Année** | 2025 – 2026 |

---

<div align="center">

*Projet privé — Propriété d'ACTIA Engineering Services & FSM Monastir*

</div>
