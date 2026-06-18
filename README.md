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

<table><tr>
<td align="center" width="50%"><b>Login & Access Profiles</b><br/><img src="frontend/src/assets/Interface1.png" width="100%"/><br/><i>Secure login page with access profile matrix per role</i></td>
<td align="center" width="50%"><b>Sign Up & Role Selection</b><br/><img src="frontend/src/assets/IN35.png" width="100%"/><br/><i>Registration form with role selection and rights info</i></td>
</tr></table>

---

<table><tr>
<td align="center" width="50%"><b>Forgot Password</b><br/><img src="frontend/src/assets/IN11.png" width="100%"/><br/><i>Secure one-time reset link, expires after 1 hour</i></td>
<td align="center" width="50%"><b>Dashboard</b><br/><img src="frontend/src/assets/Interface14.png" width="100%"/><br/><i>Statistics by status, type and process — overdue tracking</i></td>
</tr></table>

---

<table><tr>
<td align="center" width="50%"><b>Document Supervision</b><br/><img src="frontend/src/assets/IN2.png" width="100%"/><br/><i>Expired, in validation, overdue and total — actionable list</i></td>
<td align="center" width="50%"><b>Statistics & Breakdowns</b><br/><img src="frontend/src/assets/IN3.png" width="100%"/><br/><i>Donut by status, curve by type, bars by process</i></td>
</tr></table>

---

<table><tr>
<td align="center" width="50%"><b>Document List</b><br/><img src="frontend/src/assets/IN23.png" width="100%"/><br/><i>Advanced filters (type, status, process, owner) and deadline indicators</i></td>
<td align="center" width="50%"><b>Archiving</b><br/><img src="frontend/src/assets/IN4.png" width="100%"/><br/><i>Archived documents with full version history access</i></td>
</tr></table>

---

<table><tr>
<td align="center" width="50%"><b>Create Document — Information</b><br/><img src="frontend/src/assets/IN30.png" width="100%"/><br/><i>Step 1/4: title, owner, document type, origin and keywords</i></td>
<td align="center" width="50%"><b>Create Document — Upload & Summary</b><br/><img src="frontend/src/assets/IN33.png" width="100%"/><br/><i>Step 4/4: file upload (PDF, Word, Excel — max 50 MB) + recap</i></td>
</tr></table>

---

<table><tr>
<td align="center" width="50%"><b>Status Change</b><br/><img src="frontend/src/assets/IN40.png" width="100%"/><br/><i>Transition modal (In Review → In Validation) with rollback</i></td>
<td align="center" width="50%"><b>Version History</b><br/><img src="frontend/src/assets/Interface7.png" width="100%"/><br/><i>Full revision history with multi-format download</i></td>
</tr></table>

---

<table><tr>
<td align="center" width="50%"><b>ISO Validations</b><br/><img src="frontend/src/assets/IN21.png" width="100%"/><br/><i>Reviewer view: Details / Reject / Approve actions</i></td>
<td align="center" width="50%"><b>Permission Matrix & ISO 9001 Lifecycle</b><br/><img src="frontend/src/assets/IN24.png" width="100%"/><br/><i>RBAC matrix per role and 10-step lifecycle visualization</i></td>
</tr></table>

---

<table><tr>
<td align="center" width="50%"><b>ISO 9001 Workflow</b><br/><img src="frontend/src/assets/Interface10.png" width="100%"/><br/><i>Kanban: document distribution per stage with role legend</i></td>
<td align="center" width="50%"><b>Notifications</b><br/><img src="frontend/src/assets/Interface15.png" width="100%"/><br/><i>Expired docs, review requests, new versions created</i></td>
</tr></table>

---

<table><tr>
<td align="center" width="50%"><b>Automated Emails (Kafka)</b><br/><img src="frontend/src/assets/IN41.png" width="100%"/><br/><i>Daily overdue report sent via Kafka/Nodemailer</i></td>
<td align="center" width="50%"><b>AI — Quality Score & Continuous Improvement</b><br/><img src="frontend/src/assets/IN5.png" width="100%"/><br/><i>Score 87/100, status counters and distribution chart</i></td>
</tr></table>

---

<table><tr>
<td align="center" width="50%"><b>AI — Quality Chatbot</b><br/><img src="frontend/src/assets/IN22.png" width="100%"/><br/><i>GPT-4o chatbot with themed quick suggestions</i></td>
<td align="center" width="50%"><b>AI — Continuous Improvement Report</b><br/><img src="frontend/src/assets/IN34.png" width="100%"/><br/><i>ISO 9001 report: score, priority areas and AI recommendations</i></td>
</tr></table>

---

<table><tr>
<td align="center" width="50%"><b>Audit Log</b><br/><img src="frontend/src/assets/IN20.png" width="100%"/><br/><i>All actions filterable by type, user and date — PDF export</i></td>
<td align="center" width="50%"><b>User Management</b><br/><img src="frontend/src/assets/IN1.png" width="100%"/><br/><i>Pending activation accounts and active accounts with roles</i></td>
</tr></table>

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

© 2026 Motez HM — ACTIA Engineering Services. All rights reserved.

*Unauthorized use, reproduction or distribution of this project is strictly prohibited.*

</div>

<!-- badge-6 -->
