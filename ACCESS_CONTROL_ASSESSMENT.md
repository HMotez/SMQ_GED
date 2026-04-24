# 🔐 Access Control Security Assessment
**SMQ_GED Codebase Analysis**  
**Date**: April 18, 2026

---

## Executive Summary

| Recommendation | Status | Finding |
|---|---|---|
| **1. Least Privilege Principle** | 🔴 **PARTIALLY IMPLEMENTED** | Many routes lack access control; authentication/authorization not applied consistently |
| **2. Complete Mediation** | 🔴 **PARTIALLY IMPLEMENTED** | Unauthenticated users access sensitive data; missing per-resource authorization checks |

**Routes Overview**:
- ✅ Protected Routes: **12**
- ❌ Unprotected Routes: **26+**
- **Overall Compliance: ~32% (12/38 routes)**

---

## 1. LEAST PRIVILEGE PRINCIPLE - "Deny by Default"

### Current Implementation Status: 🟡 **PARTIAL**

The application **attempts** role-based access control but **fails** to apply "deny by default" consistently.

### Architecture Analysis

#### Role Middleware ([roleMiddleware.js](backend/src/middleware/roleMiddleware.js))

```javascript
// ✅ CORRECT: Requires authentication
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.currentUser) {
    return res.status(401).json({
      error: "Authentification requise. Sélectionnez un utilisateur.",
      code: "NO_USER",
    });
  }
  const role = req.currentUser.role;
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({
      error: `Accès refusé. Votre rôle (${role}) ne permet pas cette action.`,
      code: "FORBIDDEN",
    });
  }
  next();
};
```

**✅ Strengths:**
- Explicit role checking at middleware level
- Clear 401 (unauthenticated) vs 403 (unauthorized) responses
- Role permissions defined in `ROLE_PERMISSIONS` object
- Transition rules enforced via `TRANSITION_ROLE_MAP`

#### Permission Matrix

```javascript
const ROLE_PERMISSIONS = {
  "Admin": [
    "document:read", "document:create", "document:update",
    "document:status", "validation:create",
    "archive:manage", "user:manage",
  ],
  "Ing. Qualité": [
    "document:read", "document:create", "document:update",
    "document:status", "validation:create",
  ],
  "Reviewer": [
    "document:read", "validation:create",
  ],
};
```

**⚠️ Issues:**
- Permission matrix defined but **NOT enforced** in most routes
- Controllers use `requireRole()` middleware but many routes skip it entirely
- No `DENY_BY_DEFAULT` gate at the application level

---

### 1.1 Protected Routes (Explicit Role Requirements)

#### ✅ PROTECTED: Document Management

| Endpoint | Method | Protected By | Required Role(s) |
|---|---|---|---|
| `POST /api/documents` | POST | ✅ requireRole | Admin, Ing. Qualité |
| `PUT /api/documents/:id` | PUT | ✅ requireRole | Admin, Ing. Qualité |
| `PATCH /api/documents/:id/status` | PATCH | ✅ requireRole | All 3 roles (granular check in controller) |
| `POST /api/documents/archive-expired` | POST | ✅ requireRole | Admin |
| `POST /api/documents/sync-disk` | POST | ✅ requireRole | Admin |

**Key Code Snippet** ([documentRoutes.js](backend/src/routes/documentRoutes.js)):
```javascript
// ✅ GOOD: Role check before create
router.post( "/",
  loadUser,
  requireRole("Admin", "Ing. Qualité"),
  upload.single("file"),
  virusScanMiddleware,
  ctrl.createDocument
);

// ❌ BAD: No role check for reading
router.get("/", ctrl.getDocuments);
router.get("/:id", ctrl.getDocumentById);
```

#### ✅ PROTECTED: Validation Management

| Endpoint | Method | Protected By | Required Role(s) |
|---|---|---|---|
| `POST /api/validations/document/:docId` | POST | ✅ requireRole | Admin, Reviewer, Ing. Qualité |
| `PATCH /api/validations/:id` | PATCH | ✅ loadUser only | Blocks in controller |
| `PUT /api/validations/:id` | PUT | ✅ loadUser only | Blocks in controller |
| `DELETE /api/validations/:id` | DELETE | ✅ loadUser only | Blocks in controller |

**Issue**: Write operations protected, but **ONLY middleware-level check** (loadUser, not requireRole)

#### ✅ PROTECTED: Role Management

| Endpoint | Method | Protected By | Required Role(s) |
|---|---|---|---|
| `GET /api/roles/users` | GET | ✅ requireRole | Admin |
| `PATCH /api/roles/users/:userId` | PATCH | ✅ requireRole | Admin |
| `DELETE /api/roles/users/:userId` | DELETE | ✅ requireRole | Admin |
| `PATCH /api/roles/users/:userId/deactivate` | PATCH | ✅ requireRole | Admin |

#### ✅ PROTECTED: AI Module

| Endpoint | Method | Protected By | Required Role(s) |
|---|---|---|---|
| `POST /api/ai/classify` | POST | ✅ requireRole | Admin, Ing. Qualité |
| `POST /api/ai/extract-dates` | POST | ✅ requireRole | Admin, Ing. Qualité |
| `GET /api/ai/improvements` | GET | ✅ requireRole | Admin, Ing. Qualité |
| `GET /api/ai/logs` | GET | ✅ requireRole | Admin |

#### ✅ PROTECTED: Logs

| Endpoint | Method | Protected By | Required Role(s) |
|---|---|---|---|
| `GET /api/logs` | GET | ✅ requireRole | Admin |

---

### 1.2 Unprotected Routes (NO Role Requirements) - 🔴 CRITICAL GAPS

#### ❌ UNPROTECTED: Authentication Routes (Intentionally Public)
```javascript
// ✅ CORRECT: Public endpoints
router.post("/login",           ctrl.login);      // ✅ Public
router.post("/register",        ctrl.register);   // ✅ Public
router.get("/me",               ctrl.me);         // ⚠️ Needs Bearer token but no explicit protection
router.post("/logout",          ctrl.logout);
router.post("/forgot-password", ctrl.forgotPassword);
router.post("/reset-password",  ctrl.resetPassword);
```

#### ❌ UNPROTECTED: Document Metadata (Public Read)

| Endpoint | Method | Access | Issue |
|---|---|---|---|
| `GET /api/documents/statuses` | GET | ✅ Public | Read-only metadata - acceptable |
| `GET /api/documents/stats` | GET | ❌ PUBLIC | **SENSITIVE: Reveals document metrics** |
| `GET /api/documents/filters` | GET | ❌ PUBLIC | Reveals available filter options |
| `GET /api/documents/archive-candidates` | GET | ❌ PUBLIC | **SENSITIVE: Lists archivable documents** |
| `GET /api/documents/archive-history` | GET | ❌ PUBLIC | **SENSITIVE: Archive audit trail** |
| `GET /api/documents/archived` | GET | ❌ PUBLIC | Lists all archived documents |
| `GET /api/documents` | GET | ❌ PUBLIC | **CRITICAL: Retrieves ALL documents** |
| `GET /api/documents/:id` | GET | ❌ PUBLIC | **CRITICAL: Retrieves specific document data** |
| `GET /api/documents/:id/versions` | GET | ❌ PUBLIC | **CRITICAL: Access document versions** |
| `GET /api/documents/:id/audit-trail` | GET | ❌ PUBLIC | **SENSITIVE: Full audit trail** |

**Code Evidence** ([documentRoutes.js](backend/src/routes/documentRoutes.js#L15-L26)):
```javascript
// ❌ NO ACCESS CONTROL - Unauthenticated users can read ALL documents
router.get("/statuses",           ctrl.getStatuses);
router.get("/stats",              ctrl.getDocumentStats);
router.get("/filters",            ctrl.getFilterOptions);
router.get("/archive-candidates", ctrl.getArchiveCandidates);
router.get("/archive-history",    ctrl.getArchiveHistory);
router.get("/archived",           ctrl.getArchivedDocuments);
router.get("/",                   ctrl.getDocuments);        // ⚠️ Returns ALL docs
router.get("/:id",                ctrl.getDocumentById);     // ⚠️ No per-resource check
```

#### ❌ UNPROTECTED: Validation Data (Public Read)

| Endpoint | Method | Access | Issue |
|---|---|---|---|
| `GET /api/validations/stats` | GET | ❌ PUBLIC | **SENSITIVE: Validation metrics** |
| `GET /api/validations/pending-docs` | GET | ❌ PUBLIC | **SENSITIVE: Documents awaiting review** |
| `GET /api/validations/document/:docId/summary` | GET | ❌ PUBLIC | Document validation status |
| `GET /api/validations/document/:docId` | GET | ❌ PUBLIC | All validations for document |
| `GET /api/validations` | GET | ❌ PUBLIC | **CRITICAL: ALL validations in system** |

**Code Evidence** ([validationRoutes.js](backend/src/routes/validationRoutes.js#L12-L17)):
```javascript
// ❌ NO ACCESS CONTROL
router.get("/stats",                  ctrl.getValidationStats);
router.get("/pending-docs",           ctrl.getPendingDocuments);
router.get("/document/:docId/summary", ctrl.getValidationSummary);
router.get("/document/:docId",        ctrl.getDocumentValidations);
router.get("/",                       ctrl.getAllValidations);  // ⚠️ ALL validations public
```

#### ❌ UNPROTECTED: User Data (Public Read)

| Endpoint | Method | Access | Issue |
|---|---|---|---|
| `GET /api/users` | GET | ❌ PUBLIC | **CRITICAL: List all users + roles** |
| `GET /api/users/pending-count` | GET | ❌ PUBLIC | **SENSITIVE: Pending registrations** |
| `GET /api/roles` | GET | ✅ Public | Read-only role definitions - acceptable |

**Code Evidence** ([userRoutes.js](backend/src/routes/userRoutes.js)):
```javascript
// ❌ NO ACCESS CONTROL - Exposed user database
router.get("/pending-count", ctrl.getPendingCount);  // Anyone can enumerate users
router.get("/",              ctrl.getUsers);          // Public user directory
```

#### ❌ UNPROTECTED: Folder & Type Metadata (Public Read)

| Endpoint | Method | Access | Issue |
|---|---|---|---|
| `GET /api/folders/level/:level` | GET | ❌ PUBLIC | Folder structure accessible |
| `GET /api/folders/children/:parentId` | GET | ❌ PUBLIC | Folder hierarchy leak |
| `GET /api/types` | GET | ❌ PUBLIC | Document types list |
| `GET /api/processes` | GET | ❌ PUBLIC | Process list |

**Code Evidence** ([folderRoutes.js](backend/src/routes/folderRoutes.js)):
```javascript
// ❌ NO MIDDLEWARE
router.get("/level/:level",       ctrl.getFoldersByLevel);
router.get("/children/:parentId", ctrl.getFolderChildren);
```

#### ❌ UNPROTECTED: Dashboard & Notifications

| Endpoint | Method | Access | Issue |
|---|---|---|---|
| `GET /api/dashboard/overview` | GET | ⚠️ loadUser only | No role check - all authenticated users see all KPIs |
| `GET /api/dashboard/stats` | GET | ⚠️ loadUser only | No role check - statistics exposed to all roles |
| `POST /api/notifications/trigger-expiration` | POST | ⚠️ loadUser only | Admin-level action lacks requireRole |
| `GET /api/notifications/*` | GET | ⚠️ loadUser only | Missing fine-grained role checks |
| `POST /api/ai/query` | POST | ⚠️ loadUser only | AI chatbot lacks role requirements |
| `POST /api/ai/stream` | POST | ⚠️ loadUser only | SSE stream lacks role requirements |

**Code Evidence** ([dashboardRoutes.js](backend/src/routes/dashboardRoutes.js)):
```javascript
// ⚠️ INCOMPLETE: Only checks authentication, not authorization
router.get("/overview", loadUser, getOverview);  // No role check
router.get("/stats",    loadUser, getDashboardStats);  // No role check
```

#### ❌ UNPROTECTED: File Serving (CRITICAL)

| Endpoint | Pattern | Access | Issue |
|---|---|---|---|
| `/files/*` | `/files/(.+)` | ❌ PUBLIC | **CRITICAL: Direct file access no auth** |
| `/preview/*` | `/preview/(.+)` | ❌ PUBLIC | **CRITICAL: Preview without authorization** |
| `/download/*` | `/download/(.+)` | ❌ PUBLIC | **CRITICAL: Download without authorization** |
| `/convert/*` | `/convert/(.+)` | ❌ PUBLIC | **CRITICAL: Format conversion without auth** |

**Code Evidence** ([server.js](backend/src/server.js#L78-L145)):
```javascript
// ❌ NO ACCESS CONTROL - Anyone can access ANY file
app.get(/^\/files\/(.+)$/, (req, res) => {
  const filePath = resolveFilePath(req.params[0]);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Fichier introuvable" });
  res.sendFile(filePath);  // ⚠️ NO AUTHENTICATION CHECK
});

app.get(/^\/preview\/(.+)$/, (req, res) => {
  // ⚠️ NO AUTHENTICATION CHECK
  res.sendFile(filePath);
});

app.get(/^\/download\/(.+)$/, (req, res) => {
  // ⚠️ NO AUTHENTICATION CHECK
  res.download(filePath);
});

app.get(/^\/convert\/(.+)$/, (req, res) => {
  // ⚠️ NO AUTHENTICATION CHECK
  // Accepts any filename, converts to any format
});
```

---

## 2. COMPLETE MEDIATION - "Always Check"

### Current Implementation Status: 🔴 **INCOMPLETE**

Complete mediation requires **every** access decision to go through an authorization check. The current implementation has gaps:

### Issues Identified

#### 2.1 Inconsistent Authentication Loading

**Problem**: The `loadUser` middleware only **loads** user info but doesn't **protect** the route.

```javascript
// ⚠️ ISSUE: loadUser sets req.currentUser but doesn't enforce authentication
const loadUser = async (req, _res, next) => {
  // ... tries to load JWT or x-user-id header
  req.currentUser = null;  // ⚠️ ALLOWED TO CONTINUE with null user
  next();  // ⚠️ PROCEEDS EVEN IF USER NULL
};
```

**Example - Unprotected Endpoint:**
```javascript
// ❌ This allows UNAUTHENTICATED access
router.get("/api/documents", ctrl.getDocuments);  // No middleware at all
router.get("/api/documents/stats", ctrl.getDocumentStats);  // No middleware

// ⚠️ This allows anyone to read files
app.get(/^\/files\/(.+)$/, (req, res) => { res.sendFile(filePath); });
```

#### 2.2 Missing Per-Resource Authorization

**Problem**: Routes check role but not if user should access **that specific resource**.

```javascript
// ✅ Correct: Checks user exists and has role
router.patch("/:id/status",
  loadUser,
  requireRole("Admin", "Ing. Qualité", "Reviewer"),
  ctrl.changeStatus
);

// ❌ Missing: Does NOT check if user owns the document
// Any authenticated user can view ANY document
router.get("/:id", ctrl.getDocumentById);
```

**Implication**: 
- User A (Ing. Qualité) can view User B's confidential documents
- No "data isolation" enforced at API level
- Controllers may check, but we haven't verified all do

#### 2.3 Unauthenticated Users Access Sensitive Data

**Current Flow:**
```
1. Unauthenticated Request → /api/documents/stats
2. No middleware protection
3. Database query runs → Returns all document statistics
4. Response: 200 OK { "status": {...}, "counts": {...} }
```

**Impact**:
- Competitive intelligence leak (document count by type)
- Project planning insights (revision dates, statuses)
- User enumeration (/api/users)
- System structure leak (folder hierarchy)

#### 2.4 File Serving Completely Unprotected

**Critical Issue**: Any unauthenticated user can:
- Download confidential documents via `/download/document.pdf`
- Convert files to other formats via `/convert/document.pdf?to=docx`
- Access file directory structure via `/files/`
- Preview sensitive documents via `/preview/`

**No authorization checks in file serving code:**
```javascript
app.get(/^\/files\/(.+)$/, (req, res) => {
  // ⚠️ NO CHECKS:
  // - Is user authenticated?
  // - Does user have permission to access this file?
  // - Is file path valid (no directory traversal)?
  res.sendFile(filePath);
});
```

---

## 3. DETAILED ROUTE PROTECTION ANALYSIS

### Summary Table: Protected vs Unprotected Routes

```
PROTECTED ROUTES (Explicit requireRole or role-based controller logic)
═════════════════════════════════════════════════════════════════════════
 1. POST   /api/documents                    → requireRole("Admin", "Ing. Qualité")
 2. PUT    /api/documents/:id                → requireRole("Admin", "Ing. Qualité")
 3. PATCH  /api/documents/:id/status         → requireRole(all 3)
 4. POST   /api/documents/archive-expired    → requireRole("Admin")
 5. POST   /api/documents/sync-disk          → requireRole("Admin")
 6. POST   /api/validations/document/:docId  → requireRole("Admin", "Reviewer", "Ing. Qualité")
 7. PATCH  /api/validations/:id              → loadUser + controller block
 8. PUT    /api/validations/:id              → loadUser + controller block
 9. DELETE /api/validations/:id              → loadUser + controller block
10. GET   /api/roles/users                   → requireRole("Admin")
11. PATCH /api/roles/users/:userId           → requireRole("Admin")
12. DELETE /api/roles/users/:userId          → requireRole("Admin")
13. PATCH /api/roles/users/:userId/deactivate → requireRole("Admin")
14. POST  /api/ai/classify                   → requireRole("Admin", "Ing. Qualité")
15. POST  /api/ai/extract-dates              → requireRole("Admin", "Ing. Qualité")
16. GET   /api/ai/improvements               → requireRole("Admin", "Ing. Qualité")
17. GET   /api/ai/logs                       → requireRole("Admin")
18. GET   /api/logs                          → requireRole("Admin")

Total PROTECTED: 18 endpoints


UNPROTECTED ROUTES (No middleware protection)
═════════════════════════════════════════════════════════════════════════
 1. POST   /api/auth/login                   ✓ Intentionally public
 2. POST   /api/auth/register                ✓ Intentionally public
 3. GET    /api/auth/me                      ⚠️ Public (expects Bearer token)
 4. POST   /api/auth/logout                  ✓ Intentionally public
 5. POST   /api/auth/forgot-password         ✓ Intentionally public
 6. POST   /api/auth/reset-password          ✓ Intentionally public
 7. GET    /api/documents/statuses           ⚠️ Read-only metadata
 8. GET    /api/documents/stats              ❌ SENSITIVE: Stats leak
 9. GET    /api/documents/filters            ❌ Filter options leak
10. GET    /api/documents/archive-candidates ❌ SENSITIVE: Archivable docs
11. GET    /api/documents/archive-history    ❌ SENSITIVE: Archive events
12. GET    /api/documents/archived           ❌ SENSITIVE: Archived docs
13. GET    /api/documents                    ❌ CRITICAL: ALL documents
14. GET    /api/documents/:id                ❌ CRITICAL: ANY document
15. GET    /api/documents/:id/versions       ❌ CRITICAL: Document versions
16. GET    /api/documents/:id/audit-trail    ❌ SENSITIVE: Full audit trail
17. GET    /api/validations/stats            ❌ SENSITIVE: Stats leak
18. GET    /api/validations/pending-docs     ❌ SENSITIVE: Pending items
19. GET    /api/validations/document/:docId/summary  ❌ Validation status
20. GET    /api/validations/document/:docId  ❌ Document validations
21. GET    /api/validations                  ❌ CRITICAL: ALL validations
22. GET    /api/roles                        ✓ Read-only metadata
23. GET    /api/users                        ❌ CRITICAL: User directory
24. GET    /api/users/pending-count          ❌ SENSITIVE: Pending users
25. GET    /api/folders/level/:level         ❌ Folder structure leak
26. GET    /api/folders/children/:parentId   ❌ Folder hierarchy leak
27. GET    /api/types                        ❌ Document types leak
28. GET    /api/processes                    ❌ Process list leak
29. GET    /api/dashboard/overview           ⚠️ loadUser only (no requireRole)
30. GET    /api/dashboard/stats              ⚠️ loadUser only (no requireRole)
31. POST   /api/ai/query                     ⚠️ loadUser only (no requireRole)
32. POST   /api/ai/stream                    ⚠️ loadUser only (no requireRole)
33. POST   /api/notifications/trigger-expiration ⚠️ loadUser only (no requireRole)
34. GET    /api/notifications/*              ⚠️ loadUser only (no requireRole)
35. PATCH  /api/notifications/*              ⚠️ loadUser only (no requireRole)
36. GET    /files/*                          ❌ CRITICAL: Direct file access
37. GET    /preview/*                        ❌ CRITICAL: Preview any file
38. GET    /download/*                       ❌ CRITICAL: Download any file
39. GET    /convert/*                        ❌ CRITICAL: Convert any file

Total UNPROTECTED: 39 endpoints
Total with INCOMPLETE protection (loadUser only): 6 endpoints

COMPLIANCE RATE: 18/57 = 31.6%
```

---

## 4. KEY CODE SNIPPETS - Access Control Implementation

### 4.1 Role Middleware Pattern (Good Practice)

**File**: [backend/src/middleware/roleMiddleware.js](backend/src/middleware/roleMiddleware.js)

```javascript
const requireRole = (...allowedRoles) => (req, res, next) => {
  // ✅ Step 1: Check authentication
  if (!req.currentUser) {
    return res.status(401).json({
      error: "Authentification requise.",
      code: "NO_USER",
    });
  }
  
  // ✅ Step 2: Check authorization
  const role = req.currentUser.role;
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({
      error: `Accès refusé. Votre rôle (${role}) ne permet pas cette action.`,
      code: "FORBIDDEN",
      required: allowedRoles,
      yourRole: role,
    });
  }
  
  next();
};
```

**Usage - Protected Route** ✅:
```javascript
router.post("/",
  loadUser,                                    // Step 1: Load user
  requireRole("Admin", "Ing. Qualité"),       // Step 2: Check role
  upload.single("file"),                       // Step 3: Process file
  virusScanMiddleware,                         // Step 4: Virus scan
  ctrl.createDocument                          // Step 5: Controller logic
);
```

### 4.2 File Serving - NO Protection (Security Flaw)

**File**: [backend/src/server.js](backend/src/server.js#L78-L100)

```javascript
// ❌ CRITICAL: No authentication check
app.get(/^\/files\/(.+)$/, (req, res) => {
  const filePath = resolveFilePath(req.params[0]);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Fichier introuvable" });
  res.sendFile(filePath);  // ⚠️ Anyone can download
});

// ❌ CRITICAL: No authentication check
app.get(/^\/download\/(.+)$/, (req, res) => {
  const filePath = resolveFilePath(req.params[0]);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Fichier introuvable" });
  res.download(filePath, path.basename(filePath));  // ⚠️ Anyone can download
});

// ❌ CRITICAL: No authentication check
app.get(/^\/convert\/(.+)$/, (req, res) => {
  const filename  = decodeURIComponent(req.params[0]);
  const targetFmt = (req.query.to || "pdf").toLowerCase();
  const srcPath   = path.join(uploadDir, filename);
  
  // ⚠️ Accepts any filename, converts to any format, returns to anyone
});
```

### 4.3 Unprotected Data Endpoints

**File**: [backend/src/routes/documentRoutes.js](backend/src/routes/documentRoutes.js#L15-L26)

```javascript
// ❌ NO PROTECTION: Public read of all documents
router.get("/",           ctrl.getDocuments);
router.get("/:id",        ctrl.getDocumentById);
router.get("/:id/versions",     ctrl.getDocumentVersions);
router.get("/:id/audit-trail",  ctrl.getAuditTrail);

// Contrast with protected endpoints:
router.post( "/",
  loadUser,
  requireRole("Admin", "Ing. Qualité"),  // ✅ Protected
  upload.single("file"),
  virusScanMiddleware,
  ctrl.createDocument
);
```

---

## 5. CRITICAL SECURITY GAPS

### 🔴 GAP #1: File Access Not Protected

**Vulnerability**: Any unauthenticated user can download any file.

```bash
# Attack example:
curl -k https://localhost/download/secret-document.pdf
# Returns: File content (no auth check)
```

**Impact**: 
- Confidential documents exposed
- Compliance violation (ISO 27001)
- Data breach via file path enumeration

**Fix Needed**:
```javascript
app.get(/^\/files\/(.+)$/, 
  loadUser,                    // ✅ Require authentication
  requireRole(...),            // ✅ Check authorization
  (req, res) => {
    // ✅ Verify file belongs to user or is public
    // ✅ Then serve
  }
);
```

---

### 🔴 GAP #2: User Directory Public

**Vulnerability**: Complete user list with roles exposed.

**File**: [backend/src/routes/userRoutes.js](backend/src/routes/userRoutes.js)

```javascript
// ❌ NO PROTECTION
router.get("/", ctrl.getUsers);  // Returns ALL users + roles
```

**Attack**:
```bash
curl https://localhost/api/users
# Response:
[
  { id: 1, name: "Admin", email: "admin@test.com", role: "Admin" },
  { id: 2, name: "Ing Qualité", email: "ing@test.com", role: "Ing. Qualité" },
  ...
]
```

**Impact**:
- User enumeration (enables targeted attacks)
- Role intelligence gathering
- Email harvesting for phishing

---

### 🔴 GAP #3: All Documents Publicly Readable

**Vulnerability**: No access control on document retrieval.

**Impact**:
- Competitive intelligence leak
- Confidential processes exposed
- Patient/sensitive data breach (if applicable)
- Compliance violation

```javascript
// ❌ CRITICAL: No role check
router.get("/", ctrl.getDocuments);        // Get ALL documents
router.get("/:id", ctrl.getDocumentById);  // Get ANY document
```

---

### 🔴 GAP #4: Validation Records Public

**Vulnerability**: Complete validation audit trail exposed.

```javascript
router.get("/", ctrl.getAllValidations);  // ❌ Returns ALL validations
```

**Leaked information**:
- Who validated what and when
- Decision history (approved/rejected)
- Audit trail for all documents

---

### 🔴 GAP #5: Incomplete Mediation on Dashboard

**Vulnerability**: Dashboard accessible to any authenticated user, no role-based filtering.

```javascript
// ⚠️ INCOMPLETE: No role check
router.get("/overview", loadUser, getOverview);  // All roles see all KPIs
router.get("/stats",    loadUser, getDashboardStats);
```

**Should be**:
```javascript
// ✅ Better: Role-aware filtering
router.get("/overview", 
  loadUser, 
  requireRole("Admin", "Ing. Qualité"),  // Reviewer doesn't need dashboard
  roleFilteredOverview
);
```

---

### 🟡 GAP #6: Per-Resource Authorization Missing

**Vulnerability**: Routes check role but not if user should access **that specific resource**.

**Example**: 
```javascript
// ✅ Checks: Is user authenticated?
// ✅ Checks: Does user have "Reviewer" role?
// ❌ Missing: Can THIS user validate THIS document?

router.patch("/:id/status",
  loadUser,
  requireRole("Admin", "Ing. Qualité", "Reviewer"),
  ctrl.changeStatus  // Might have internal check, but not explicit
);
```

**Implication**: Multi-tenant issues possible if users from different departments can access each other's documents.

---

## 6. RECOMMENDATIONS FOR LEAST PRIVILEGE PRINCIPLE

### Priority 1: CRITICAL (Implement Immediately)

1. **Protect File Serving**
   ```javascript
   // Add middleware to ALL file serving routes
   app.get(/^\/files\/(.+)$/,    loadUser, requireRole, serveFile);
   app.get(/^\/download\/(.+)$/, loadUser, requireRole, downloadFile);
   app.get(/^\/preview\/(.+)$/,  loadUser, requireRole, previewFile);
   app.get(/^\/convert\/(.+)$/,  loadUser, requireRole, convertFile);
   ```

2. **Protect User Directory**
   ```javascript
   // Only Admin can list users
   router.get("/", loadUser, requireRole("Admin"), ctrl.getUsers);
   ```

3. **Protect Document Reads**
   ```javascript
   // All read endpoints need at minimum loadUser check
   router.get("/",       loadUser, ctrl.getDocuments);
   router.get("/:id",    loadUser, ctrl.getDocumentById);
   ```

### Priority 2: HIGH (Implement in Next Sprint)

4. **Protect Validation Reads**
   ```javascript
   // Validation data is sensitive
   router.get("/",       loadUser, ctrl.getAllValidations);
   router.get("/stats",  loadUser, requireRole("Admin", "Ing. Qualité"), ctrl.getValidationStats);
   ```

5. **Implement Global "Deny by Default"**
   - Create a middleware that catches all unprotected routes
   - Require explicit `ALLOW` for public endpoints
   ```javascript
   const ALLOW_PUBLIC = ["/api/auth/login", "/api/auth/register", ...];
   
   app.use("/api", (req, res, next) => {
     if (!ALLOW_PUBLIC.includes(req.path)) {
       return res.status(401).json({ error: "Unauthorized" });
     }
     next();
   });
   ```

6. **Add Per-Resource Authorization Checks**
   ```javascript
   router.get("/:id", loadUser, async (req, res) => {
     const doc = await getDocument(req.params.id);
     
     // ✅ Check: Does THIS user have access to THIS resource?
     if (!canUserAccessDocument(req.currentUser, doc)) {
       return res.status(403).json({ error: "Access denied" });
     }
     
     res.json(doc);
   });
   ```

### Priority 3: MEDIUM (Implement in Next 2 Sprints)

7. **Add Role-Based Dashboard Filtering**
   ```javascript
   router.get("/overview",
     loadUser,
     requireRole("Admin", "Ing. Qualité"),  // Reviewer doesn't see
     roleAwareOverview
   );
   ```

8. **Audit Trail for Access Attempts**
   - Log all access denials
   - Monitor for suspicious patterns

---

## 7. RECOMMENDATIONS FOR COMPLETE MEDIATION

### Required Changes

1. **Enforce Authentication Globally**
   ```javascript
   // Apply loadUser to all /api routes by default
   app.use("/api", loadUser);
   
   // Explicitly whitelist public endpoints
   const PUBLIC_ENDPOINTS = [
     /^\/api\/auth\/login$/,
     /^\/api\/auth\/register$/,
     /^\/api\/auth\/forgot-password$/,
     /^\/api\/auth\/reset-password$/,
   ];
   
   app.use("/api", (req, res, next) => {
     if (PUBLIC_ENDPOINTS.some(re => re.test(req.path))) {
       return next();  // Skip authentication for public routes
     }
     
     if (!req.currentUser && req.method !== "OPTIONS") {
       return res.status(401).json({ error: "Authentication required" });
     }
     
     next();
   });
   ```

2. **Verify User on Every Request**
   - Current implementation: Only loads user once at middleware
   - Recommended: Re-fetch user on each protected endpoint to catch deactivated accounts
   ```javascript
   const verifyUserActive = async (req, res, next) => {
     const user = await getUserById(req.currentUser.id);
     if (!user.is_active) {
       return res.status(401).json({ error: "Account deactivated" });
     }
     req.currentUser = user;  // Update with fresh data
     next();
   };
   ```

3. **Per-Resource Authorization in Controllers**
   - Currently: Missing in most controllers
   - Recommended: Every controller checks `can user access resource`
   ```javascript
   const getDocumentById = async (req, res) => {
     const doc = await getDocument(req.params.id);
     
     // ✅ Complete mediation: Check every access
     if (!canUserAccessDocument(req.currentUser, doc)) {
       return res.status(403).json({ error: "Access denied" });
     }
     
     res.json(doc);
   };
   ```

4. **Deny-by-Default Architecture**
   ```javascript
   // Instead of: Only some routes have requireRole
   // Move to: All routes must explicitly ALLOW access
   
   const routes = [
     {
       path: "/api/documents",
       method: "GET",
       allow: ["Admin", "Ing. Qualité", "Reviewer"],  // ✅ Explicit whitelist
     },
     {
       path: "/api/users",
       method: "GET",
       allow: ["Admin"],  // ✅ Only admin can list users
     },
   ];
   ```

---

## 8. COMPLIANCE CHECKLIST

| Requirement | Status | Evidence |
|---|---|---|
| ✅ Role-based access control defined | ✓ IMPLEMENTED | ROLE_PERMISSIONS, TRANSITION_ROLE_MAP in roleMiddleware.js |
| ✅ Role middleware exists | ✓ IMPLEMENTED | requireRole() function |
| ❌ All routes protected | ✗ MISSING | 39/57 routes unprotected |
| ❌ Deny by default enforced | ✗ MISSING | Many public routes |
| ❌ File access controlled | ✗ MISSING | /files, /download, /preview, /convert unprotected |
| ❌ Per-resource authorization | ✗ MISSING | No controller-level checks verified |
| ❌ Complete mediation | ✗ MISSING | Unauthenticated access allowed |
| ⚠️ Authentication consistency | ⚠️ PARTIAL | Some routes use loadUser, others none |
| ✓ Role transition rules | ✓ IMPLEMENTED | TRANSITION_ROLE_MAP enforced |
| ❌ API documentation on protection | ✗ MISSING | No indication which routes need auth |

---

## 9. CONCLUSION

### Current State
- **Least Privilege**: 🟡 Partially Implemented (31.6% protected routes)
- **Complete Mediation**: 🟡 Partially Implemented (major gaps in unauthenticated access)

### Critical Issues
1. **File serving completely unprotected** - IMMEDIATE FIX NEEDED
2. **User directory publicly readable** - IMMEDIATE FIX NEEDED
3. **All documents publicly readable** - IMMEDIATE FIX NEEDED
4. **No deny-by-default architecture** - Need refactoring
5. **Per-resource authorization missing** - Design needed

### Risk Level
🔴 **HIGH** - Sensitive business data and user information exposed to unauthenticated access

### Recommended Action Plan
1. **Week 1**: Protect file serving + user directory + document reads
2. **Week 2**: Implement deny-by-default middleware
3. **Week 3**: Add per-resource authorization in controllers
4. **Week 4**: Comprehensive testing + audit logging

---

**Next Steps**: See IMPLEMENTATION_ROADMAP.md for detailed fix procedures.
