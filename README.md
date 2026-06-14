<div align="center">

<img src="frontend/src/assets/Logo.png" alt="ACTIA Logo" width="160"/>

# SMQ\_GED — Quality Management System & Electronic Document Management

**Final Year Project — ACTIA Engineering Services (AES)**

*Applied Bachelor's Degree in Software Engineering / Information Systems — FSM Monastir, 2025-2026*

---

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-Private-red)](#)

</div>

---

## Table of Contents

1. [Project Overview](#-project-overview)
2. [Technical Architecture](#-technical-architecture)
3. [Features](#-features)
4. [Screenshots](#-screenshots)
5. [Roles & Permissions](#-roles--permissions)
6. [ISO 9001 Document Lifecycle](#-iso-9001-document-lifecycle)
7. [Security](#-security)
8. [Docker Infrastructure](#-docker-infrastructure)
9. [Author](#-author)

---

## Project Overview

SMQ\_GED is a full-stack web platform for **Electronic Document Management** aligned with the **ISO 9001:2015** standard, developed as a Final Year Project at **ACTIA Engineering Services**.

It centralizes the creation, revision, validation, and archiving of quality documents, replacing paper-based processes with a secure, traceable digital workflow.

### Goals

| Goal | Description |
|---|---|
| **ISO 9001 Compliance** | Complete document workflow with a normalized lifecycle |
| **Full Traceability** | Audit log of all user actions |
| **Security by Design** | 18 automated security test suites, WAF, antivirus, encryption |
| **Role-Based Access** | Granular RBAC access control per role |
| **Built-in AI** | Document assistant powered by GPT-4o (OpenAI) |

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                             │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (443) / HTTP → HTTPS redirect
                  ┌────────▼────────┐
                  │  Nginx + WAF    │  React SPA (Frontend)
                  │  Let's Encrypt  │  Secure reverse proxy
                  └────────┬────────┘
                           │ Internal Docker network (smq_network)
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
   │  Antivirus  │  │   Metrics   │  │ Dashboards │
   └─────────────┘  └─────────────┘  └────────────┘
```

### Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | React + Vite + Tailwind CSS | 19 / 8 / 4 |
| **Routing** | React Router DOM | 7 |
| **Backend** | Node.js + Express | 20 / 5 |
| **Database** | PostgreSQL | 16 |
| **Messaging** | Apache Kafka (KRaft) | 3.7 |
| **Authentication** | JWT + bcryptjs | — |
| **Antivirus** | ClamAV | stable |
| **AI** | OpenAI GPT-4o | — |
| **Directory** | LDAP (ldapjs) | — |
| **Emails** | Nodemailer via Kafka | — |
| **Monitoring** | Prometheus + Grafana | latest |
| **Reverse Proxy** | Nginx + WAF | alpine |
| **Containers** | Docker Compose | — |
| **Export** | jsPDF, docx, pptxgenjs, xlsx | — |

---

## Features

### Document Management

- **Document Creation** — Guided form with classification by type (Procedure, Template, Instruction, Guide, Manual), process, owner and origin (Internal / QHSE / Client).
- **Document List** — Filtered view by type, status, process, owner and deadline. Real-time revision deadline indicators.
- **Version History** — Full revision history with individual access to each version (View, Download, PDF, Word, Excel).
- **Archiving** — Move obsolete documents to a searchable archive.
- **Multi-format Export** — PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx).

### ISO 9001 Validation Workflow

- **Validation Board** — Dedicated interface for Reviewers to approve or reject documents *In Validation*.
- **Visual Workflow** — Kanban view showing document distribution at each lifecycle stage.
- **Status Transitions** — Guided, controlled progression based on the role-permission matrix.

### Dashboard

- Real-time statistics: breakdown by status, document type and process.
- Donut chart (Chart.js) with interactive legend and trend curves.
- **Overdue Revisions** section: documents past their revision date, sorted by urgency.

### Smart Notifications

- Automatic alerts for **expired documents** (overdue revision).
- Notifications for **review requests**, **new versions** and **pending validations**.
- Dynamic badges in the navigation bar.
- Mark individual or all notifications as read.

### AI Assistant

- Contextual conversational assistant powered by **OpenAI GPT-4o**.
- Modes: Quality Creation, Continuous Improvement, and free chat.
- Persistent conversation history per session.
- Quick suggestions organized by theme: surveillance, documents, statistics, processes.

### Administration

- **User Management** (Admin) — Create accounts, change roles, activate/deactivate users.
- **Audit Log** (Admin + Quality Engineer) — View all system actions with filters by action type, user and date range. PDF export.
- **Permission Matrix** — Visual RBAC grid showing role rights directly in the UI.

### Authentication & Sessions

- Email/password login with JWT.
- Password reset via email (secure one-time link, 1-hour expiry).
- Inactivity detection with automatic logout (`SessionManager`).
- Brute-force protection: account lock after failed attempts.

---

## Screenshots

### Login & Access Profiles

<img src="frontend/src/assets/Interface1.png" alt="Login page and role matrix" width="100%"/>

*Secure login page with access profile matrix overview per role*

---

### Sign Up & Role Selection

<img src="frontend/src/assets/IN35.png" alt="Account creation" width="100%"/>

*Registration form with role selection and associated rights information*

---

### Forgot Password

<img src="frontend/src/assets/IN11.png" alt="Forgot password" width="100%"/>

*Password reset by email — secure one-time link, expires after 1 hour*

---

### Dashboard

<img src="frontend/src/assets/Interface14.png" alt="Dashboard" width="100%"/>

*Main dashboard: statistics by status, document type and process — overdue revision tracking*

---

### Document Supervision

<img src="frontend/src/assets/IN2.png" alt="Document supervision" width="100%"/>

*Supervision view: expired, in validation, overdue and total documents — actionable list*

---

### Statistics & Breakdowns

<img src="frontend/src/assets/IN3.png" alt="Statistics and breakdowns" width="100%"/>

*Breakdown by status (donut chart), by document type (curve) and by process (horizontal bars)*

---

### Document List

<img src="frontend/src/assets/IN23.png" alt="Document list" width="100%"/>

*Full document list with advanced filters (type, status, process, owner) and deadline indicators*

---

### Archiving

<img src="frontend/src/assets/IN4.png" alt="Archiving" width="100%"/>

*Archive page: archived documents with full version history access*

---

### Create Document — Information

<img src="frontend/src/assets/IN30.png" alt="Create document - step 1" width="100%"/>

*Step 1/4: title, owner, document type, origin and keywords*

---

### Create Document — Upload & Summary

<img src="frontend/src/assets/IN33.png" alt="Create document - step 4" width="100%"/>

*Step 4/4: file upload (PDF, Word, Excel — max 50 MB) and summary before creation*

---

### Status Change

<img src="frontend/src/assets/IN40.png" alt="Status change" width="100%"/>

*Status transition confirmation modal (e.g. In Review → In Validation) with rollback option*

---

### Version History

<img src="frontend/src/assets/Interface7.png" alt="Document versions" width="100%"/>

*Document detail: full revision history with multi-format download (PDF, Word, Excel)*

---

### ISO Validations

<img src="frontend/src/assets/IN21.png" alt="ISO Validations" width="100%"/>

*Validation interface (Reviewer view): pending documents with Details / Reject / Approve actions*

---

### Permission Matrix & ISO 9001 Lifecycle

<img src="frontend/src/assets/IN24.png" alt="Permission matrix and ISO 9001 lifecycle" width="100%"/>

*RBAC permission matrix per role and 10-step ISO 9001 lifecycle visualization with status transition*

---

### ISO 9001 Workflow

<img src="frontend/src/assets/Interface10.png" alt="ISO 9001 Workflow" width="100%"/>

*Kanban workflow view: document distribution per stage with responsible role legend*

---

### Notifications

<img src="frontend/src/assets/Interface15.png" alt="Notification center" width="100%"/>

*Notification center: expired documents, review requests, new versions created*

---

### Automated Emails (Kafka)

<img src="frontend/src/assets/IN41.png" alt="Automated email - overdue documents" width="100%"/>

*Automated email sent via Kafka/Nodemailer: daily report of overdue documents requiring action*

---

### AI Assistant — Quality Score & Continuous Improvement

<img src="frontend/src/assets/IN5.png" alt="AI Assistant - Quality Score" width="100%"/>

*Continuous Improvement mode: global quality score (87/100), status counters and distribution chart*

---

### AI Assistant — Quality Chatbot

<img src="frontend/src/assets/IN22.png" alt="AI Assistant - Quality Chatbot" width="100%"/>

*Document chatbot (GPT-4o) with quick suggestions organized by theme: surveillance, documents, statistics*

---

### AI Assistant — Continuous Improvement Report

<img src="frontend/src/assets/IN34.png" alt="AI Assistant - Continuous Improvement Report" width="100%"/>

*Automated ISO 9001 report: global quality score, priority improvement areas and AI recommendations*

---

### Audit Log

<img src="frontend/src/assets/IN20.png" alt="Audit log" width="100%"/>

*Activity log: all actions filterable by type, user and date — PDF export*

---

### User Management

<img src="frontend/src/assets/IN1.png" alt="User management" width="100%"/>

*Account administration: pending activation accounts and active accounts with role management*

---

## Roles & Permissions

| Permission | Admin | Quality Eng. | Reviewer | Visitor |
|---|:---:|:---:|:---:|:---:|
| Read documents | ✅ | ✅ | ✅ | ✅ |
| Create document | ✅ | ✅ | ❌ | ❌ |
| Edit document | ✅ | ✅ | ❌ | ❌ |
| Validate document | ✅ | ❌ | ✅ | ❌ |
| Change status | ✅ | ✅ | ✅ | ❌ |
| Comment | ✅ | ✅ | ✅ | ❌ |
| Archive | ✅ | ❌ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ✅ | ❌ | ❌ |

---

## ISO 9001 Document Lifecycle

```
Draft → In Writing → Review Request → In Review
    → In Correction → In Validation → Validated → Released
        → Obsolete → Archived
```

Each transition is:
- **Controlled** by the permission matrix (required role)
- **Traced** in the audit log (who, when, what)
- **Notified** to the relevant stakeholders

---

## Security

The application was built with a **Security by Design** approach. All measures below are covered by **18 automated Jest test suites**.

### Authentication & Sessions

| Measure | Detail |
|---|---|
| Signed JWT (HS256) | Configurable expiry, stored client-side only |
| bcryptjs (rounds 12) | Password hashing — never stored in plain text |
| Password policy | Minimum length, uppercase, digit, special character |
| Brute-force lock | Account locked after N failed attempts |
| Secure reset | Signed OTP token, single-use, short expiry |
| Inactivity logout | Frontend `SessionManager` — configurable timeout |

### Transport & Network

| Measure | Detail |
|---|---|
| Mandatory HTTPS | Nginx + Let's Encrypt, HTTP → HTTPS redirect |
| HSTS | `max-age=31536000; includeSubDomains; preload` |
| PostgreSQL SSL | Encrypted connection backend → database |
| Internal Docker network | Backend and DB not exposed externally, only Nginx |

### HTTP Security Headers

| Header | Value |
|---|---|
| `Content-Security-Policy` | Restricted sources, `upgrade-insecure-requests` |
| `X-Frame-Options` | `DENY` (file routes: `SAMEORIGIN`) |
| `X-Content-Type-Options` | `nosniff` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Camera, microphone, geolocation disabled |

### Access Control

| Measure | Detail |
|---|---|
| RBAC middleware | Every route verifies JWT role before executing |
| Least privilege | Dedicated DB user with minimal rights (migration 009) |
| Input validation | Systematic sanitization, malformed payload rejection |
| WAF Nginx | Filtering rules for SQL injection, XSS, path traversal |

### File Uploads

| Measure | Detail |
|---|---|
| ClamAV antivirus | INSTREAM scan of every uploaded file before storage |
| Immediate rejection | Infected file deleted, 422 error returned |
| Extension & size | MIME type verification and size limit enforcement |

### Audit & Monitoring

| Measure | Detail |
|---|---|
| Full audit log | All actions (create, edit, login, etc.) |
| Prometheus | Real-time application metrics collection |
| Grafana | Monitoring dashboards |
| Incident detection | Alerts on abnormal behavior |
| Automated backups | Daily `.sql.gz` dumps with integrity checks |
| Vulnerability scanning | Trivy (Docker images) + npm audit (dependencies) |

### Security Test Suites (Jest)

```
01 Brute Force          07 Server Hardening       13 Audit Logs
02 Password Policy      08 Input Validation        14 Monitoring
03 Generic Errors       09 Access Control          15 Backup
04 Session Management   10 Error Handling          16 Incident Detection
05 HTTPS / SSL          11 WAF                     17 DB Monitoring
06 Security Headers     12 Rate Limiting            18 Dependency Audit
```

---

## Docker Infrastructure

The entire application runs via **Docker Compose** with the following services:

| Service | Image | Role |
|---|---|---|
| `smq_frontend` | React + Nginx | SPA + reverse proxy + WAF + SSL |
| `smq_backend` | Node.js 20 | REST API (internal port 4000) |
| `smq_db` | PostgreSQL 16 Alpine | Database (SSL enabled) |
| `smq_kafka` | Apache Kafka 3.7 | Async messaging (emails) |
| `smq_clamav` | ClamAV stable | Antivirus for uploaded files |
| `smq_backup` | PostgreSQL 16 Alpine | Automated .sql.gz backups |
| `smq_prometheus` | Prometheus | Metrics collection (`--profile monitoring`) |
| `smq_grafana` | Grafana | Dashboards (`--profile monitoring`) |
| `smq_certbot` | Certbot | Automatic SSL renewal (`--profile ssl-prod`) |
| `smq_trivy` | Aqua Trivy | Vulnerability scanner (`--profile audit`) |
| `smq_patch_monitor` | Node 20 slim | Automated npm audit (`--profile audit`) |

All services communicate through the private `smq_network`. Only Nginx is publicly exposed (ports 80/443).

---

## Author

| | |
|---|---|
| **Student** | Motez HM |
| **Degree** | Applied Bachelor's — Software Engineering / Information Systems |
| **Institution** | Faculty of Sciences of Monastir (FSM) |
| **Host Company** | ACTIA Engineering Services (AES) |
| **Year** | 2025 – 2026 |

---

<div align="center">

*Private project — Property of ACTIA Engineering Services & FSM Monastir*

</div>
