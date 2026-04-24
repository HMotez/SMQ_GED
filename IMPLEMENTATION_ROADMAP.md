# 🛠️ Access Control Implementation Roadmap
**SMQ_GED Security Hardening Plan**

---

## Quick Fix Checklist

### CRITICAL (Do First)

- [ ] **File Serving Protection** - Add `loadUser, requireRole` to `/files`, `/preview`, `/download`, `/convert`
- [ ] **User Directory Protection** - Restrict `GET /api/users` to Admin only
- [ ] **Document Read Protection** - Add `loadUser` to `GET /api/documents` endpoints
- [ ] **Validation Read Protection** - Add `loadUser` to `GET /api/validations` endpoints

### HIGH PRIORITY (This Sprint)

- [ ] **Global Authentication Middleware** - Implement deny-by-default for `/api/*`
- [ ] **Dashboard Role Filtering** - Restrict dashboard to appropriate roles
- [ ] **AI Module Role Checks** - Complete requireRole on all AI endpoints

### MEDIUM PRIORITY (Next Sprint)

- [ ] **Per-Resource Authorization** - Add data access checks in controllers
- [ ] **Audit Logging** - Log all access attempts (granted/denied)
- [ ] **API Documentation** - Document security requirements per endpoint

---

## Detailed Implementation Steps

### Step 1: Protect File Serving (CRITICAL)

**File**: `backend/src/server.js`

**Current Code** (Lines 78-145):
```javascript
app.get(/^\/files\/(.+)$/, (req, res) => {
  const filePath = resolveFilePath(req.params[0]);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Fichier introuvable" });
  res.sendFile(filePath);
});
```

**New Code**:
```javascript
const { loadUser, requireRole } = require("./middleware/roleMiddleware");

// ✅ Protect file serving with authentication
const serveFileProtected = async (req, res) => {
  // ✓ User is authenticated (via loadUser + requireRole middleware)
  // ✓ User has appropriate role (via requireRole middleware)
  
  const filePath = resolveFilePath(req.params[0]);
  
  // ✓ TODO: Add per-resource check: Can user access this file?
  // const canAccess = await canUserAccessFile(req.currentUser, filePath);
  // if (!canAccess) {
  //   return res.status(403).json({ error: "Accès refusé" });
  // }
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Fichier introuvable" });
  }
  
  res.sendFile(filePath);
};

// Apply to all file serving routes
app.get(/^\/files\/(.+)$/, loadUser, requireRole("Admin", "Ing. Qualité", "Reviewer"), serveFileProtected);
app.get(/^\/preview\/(.+)$/, loadUser, requireRole("Admin", "Ing. Qualité", "Reviewer"), previewFileProtected);
app.get(/^\/download\/(.+)$/, loadUser, requireRole("Admin", "Ing. Qualité", "Reviewer"), downloadFileProtected);
app.get(/^\/convert\/(.+)$/, loadUser, requireRole("Admin", "Ing. Qualité", "Reviewer"), convertFileProtected);
```

**Testing**:
```bash
# ❌ Should be rejected (no auth)
curl -k https://localhost/download/document.pdf

# ✅ Should be allowed (authenticated + role)
curl -k -H "Authorization: Bearer <token>" https://localhost/download/document.pdf
```

---

### Step 2: Protect User Directory (CRITICAL)

**File**: `backend/src/routes/userRoutes.js`

**Current Code**:
```javascript
router.get("/pending-count", ctrl.getPendingCount);
router.get("/",              ctrl.getUsers);
```

**New Code**:
```javascript
const { loadUser, requireRole } = require("../middleware/roleMiddleware");

// ✅ Restrict user enumeration to Admin
router.get("/pending-count", loadUser, requireRole("Admin"), ctrl.getPendingCount);
router.get("/",              loadUser, requireRole("Admin"), ctrl.getUsers);
```

**Testing**:
```bash
# ❌ Should be rejected (not authenticated)
curl -k https://localhost/api/users

# ❌ Should be rejected (not Admin)
curl -k -H "Authorization: Bearer <ing-qualite-token>" https://localhost/api/users

# ✅ Should be allowed (Admin)
curl -k -H "Authorization: Bearer <admin-token>" https://localhost/api/users
```

---

### Step 3: Protect Document Reads (CRITICAL)

**File**: `backend/src/routes/documentRoutes.js`

**Current Code** (Lines 15-26):
```javascript
router.get(  "/statuses",           ctrl.getStatuses);
router.get(  "/stats",              ctrl.getDocumentStats);
router.get(  "/filters",            ctrl.getFilterOptions);
router.get(  "/archive-candidates", ctrl.getArchiveCandidates);
router.get(  "/archive-history",    ctrl.getArchiveHistory);
router.get(  "/archived",           ctrl.getArchivedDocuments);
router.get(  "/",                   ctrl.getDocuments);
router.get(  "/:id",                ctrl.getDocumentById);
```

**New Code**:
```javascript
// ✅ At minimum, require authentication for document reads
// Could also add role check depending on business rules
router.get(  "/statuses",           loadUser, ctrl.getStatuses);
router.get(  "/stats",              loadUser, ctrl.getDocumentStats);
router.get(  "/filters",            loadUser, ctrl.getFilterOptions);
router.get(  "/archive-candidates", loadUser, ctrl.getArchiveCandidates);
router.get(  "/archive-history",    loadUser, ctrl.getArchiveHistory);
router.get(  "/archived",           loadUser, ctrl.getArchivedDocuments);
router.get(  "/",                   loadUser, ctrl.getDocuments);
router.get(  "/:id",                loadUser, ctrl.getDocumentById);
router.get(  "/:id/versions",       loadUser, ctrl.getDocumentVersions);
router.get(  "/:id/audit-trail",    loadUser, ctrl.getAuditTrail);
```

---

### Step 4: Protect Validation Reads (CRITICAL)

**File**: `backend/src/routes/validationRoutes.js`

**Current Code** (Lines 12-17):
```javascript
router.get(  "/stats",                  ctrl.getValidationStats);
router.get(  "/pending-docs",           ctrl.getPendingDocuments);
router.get(  "/document/:docId/summary", ctrl.getValidationSummary);
router.get(  "/document/:docId",        ctrl.getDocumentValidations);
router.get(  "/",                       ctrl.getAllValidations);
```

**New Code**:
```javascript
// ✅ Validation data is sensitive - require authentication
// Consider also restricting to Admin/Reviewer only
router.get(  "/stats",                  loadUser, ctrl.getValidationStats);
router.get(  "/pending-docs",           loadUser, ctrl.getPendingDocuments);
router.get(  "/document/:docId/summary", loadUser, ctrl.getValidationSummary);
router.get(  "/document/:docId",        loadUser, ctrl.getDocumentValidations);
router.get(  "/",                       loadUser, ctrl.getAllValidations);
```

---

### Step 5: Protect Folder & Type Reads

**File**: `backend/src/routes/folderRoutes.js`

**Current Code**:
```javascript
router.get("/level/:level",       ctrl.getFoldersByLevel);
router.get("/children/:parentId", ctrl.getFolderChildren);
```

**New Code**:
```javascript
const { loadUser } = require("../middleware/roleMiddleware");

// ✅ Folder structure requires authentication
router.get("/level/:level",       loadUser, ctrl.getFoldersByLevel);
router.get("/children/:parentId", loadUser, ctrl.getFolderChildren);
```

**File**: `backend/src/routes/typeRoutes.js` (or embedded in server.js)

**Current Code**:
```javascript
router.get("/", ctrl.getTypes);
```

**New Code**:
```javascript
const { loadUser } = require("../middleware/roleMiddleware");

// ✅ Document types require authentication
router.get("/", loadUser, ctrl.getTypes);
```

---

### Step 6: Protect Process List

**File**: `backend/src/routes/processRoutes.js`

**Current Code**:
```javascript
router.get("/", getProcesses);
```

**New Code**:
```javascript
const { loadUser } = require("../middleware/roleMiddleware");

// ✅ Process list requires authentication
router.get("/", loadUser, getProcesses);
```

---

### Step 7: Protect Dashboard (HIGH PRIORITY)

**File**: `backend/src/routes/dashboardRoutes.js`

**Current Code** (Lines 11-14):
```javascript
router.get("/overview", loadUser, getOverview);
router.get("/stats", loadUser, getDashboardStats);
```

**Issue**: All authenticated users see all KPIs (no role filtering)

**New Code** (Option A - Restrict by role):
```javascript
const { loadUser, requireRole } = require("../middleware/roleMiddleware");

// ✅ Only Admin and Ing. Qualité see full dashboard
// Reviewer only sees review-related dashboards
router.get("/overview", 
  loadUser, 
  requireRole("Admin", "Ing. Qualité"),
  getOverview
);

router.get("/stats", 
  loadUser, 
  requireRole("Admin", "Ing. Qualité"),
  getDashboardStats
);

// Optional: Separate reviewer-specific dashboard
router.get("/reviewer-stats",
  loadUser,
  requireRole("Reviewer"),
  getReviewerStats  // Only shows validation-related stats
);
```

**New Code** (Option B - Role-filtered data):
```javascript
// Controller filters data based on user role
const getOverviewRoleAware = async (req, res) => {
  const { currentUser } = req;
  
  if (currentUser.role === "Admin" || currentUser.role === "Ing. Qualité") {
    // Full dashboard
    return getFullOverview();
  } else if (currentUser.role === "Reviewer") {
    // Only validation-related stats
    return getValidationOnlyOverview();
  }
  
  res.status(403).json({ error: "Unauthorized" });
};

router.get("/overview", loadUser, getOverviewRoleAware);
```

---

### Step 8: Complete AI Module Protection (HIGH PRIORITY)

**File**: `backend/src/routes/aiRoutes.js`

**Current Code** (Lines 16-27):
```javascript
router.post("/query", loadUser, ctrl.handleChatQuery);
router.post("/stream", loadUser, ctrl.handleStreamQuery);
```

**Issue**: AI chatbot accessible to any authenticated user (no role check)

**New Code**:
```javascript
// ✅ AI features restricted to appropriate roles
router.post("/query", 
  loadUser,
  requireRole("Admin", "Ing. Qualité", "Reviewer"),
  ctrl.handleChatQuery
);

router.post("/stream",
  loadUser,
  requireRole("Admin", "Ing. Qualité", "Reviewer"),
  ctrl.handleStreamQuery
);
```

---

### Step 9: Protect Notifications Admin Endpoints

**File**: `backend/src/routes/notificationRoutes.js`

**Current Code** (Line 19):
```javascript
router.post("/trigger-expiration", ctrl.triggerExpirationJob);
```

**Issue**: Admin-level action accessible to all authenticated users

**New Code**:
```javascript
const { loadUser, requireRole } = require("../middleware/roleMiddleware");

router.use(loadUser);  // All routes require authentication

// ✅ Admin-level job trigger restricted to Admin
router.post("/trigger-expiration", 
  requireRole("Admin"),
  ctrl.triggerExpirationJob
);

// ✅ Regular notification endpoints accessible to all authenticated users
router.get("/unread-count", ctrl.getUnreadCount);
router.get("/", ctrl.getUserNotifications);
router.patch("/read-all", ctrl.markAllAsRead);
router.patch("/:id/read", ctrl.markAsRead);
```

---

### Step 10: Implement Global Deny-by-Default (HIGH PRIORITY)

**File**: `backend/src/server.js` (New middleware)

Create a new middleware file: `backend/src/middleware/authGate.js`:

```javascript
// ============================================================
// middleware/authGate.js
// Global authentication gate - implements "deny by default"
// ============================================================

const ALLOW_PUBLIC = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

// Routes that require authentication but are tested separately
const ALLOW_UNAUTHENTICATED_GET = [
  "/api/auth/me",  // Checks Bearer token internally
];

const authGate = (req, res, next) => {
  // Allow public endpoints
  if (ALLOW_PUBLIC.some(path => req.path.startsWith(path))) {
    return next();
  }
  
  // Allow GET /me (handles its own auth check)
  if (req.path === "/api/auth/me") {
    return next();
  }
  
  // All other /api routes MUST have user loaded
  if (req.path.startsWith("/api")) {
    if (!req.currentUser) {
      return res.status(401).json({
        error: "Authentication required",
        code: "UNAUTHORIZED",
        path: req.path,
      });
    }
  }
  
  next();
};

module.exports = { authGate, ALLOW_PUBLIC };
```

**Apply in server.js**:
```javascript
const { loadUser } = require("./middleware/roleMiddleware");
const { authGate } = require("./middleware/authGate");

// 1. Load user on all requests
app.use("/api", loadUser);

// 2. Apply authentication gate (deny by default)
app.use("/api", authGate);

// 3. Then route to specific endpoints
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
// ... etc
```

---

### Step 11: Add Per-Resource Authorization (MEDIUM PRIORITY)

**Example**: Document access controller

**File**: `backend/src/controllers/documentController.js`

Add helper function:

```javascript
// ============================================================
// Helper: Check if user can access document
// ============================================================
const canUserAccessDocument = async (user, documentId) => {
  // Admin: Can access all documents
  if (user.role === "Admin") {
    return true;
  }
  
  // Get document
  const doc = await pool.query(
    "SELECT * FROM documents WHERE id = $1",
    [documentId]
  );
  
  if (!doc.rows.length) {
    return false;  // Document not found
  }
  
  const document = doc.rows[0];
  
  // Ing. Qualité: Can access documents they created or are responsible for
  if (user.role === "Ing. Qualité") {
    if (document.created_by === user.id || document.responsible === user.name) {
      return true;
    }
  }
  
  // Reviewer: Can access documents that are in review status
  if (user.role === "Reviewer") {
    const status = await getDocumentStatus(document.status_id);
    if (["En relecture", "En validation"].includes(status)) {
      return true;
    }
  }
  
  return false;
};

// Apply in getDocumentById
const getDocumentById = async (req, res) => {
  const { id } = req.params;
  
  // ✅ NEW: Per-resource authorization check
  if (!await canUserAccessDocument(req.currentUser, id)) {
    return res.status(403).json({
      error: "Vous n'avez pas accès à ce document",
      code: "FORBIDDEN",
    });
  }
  
  // Proceed with normal logic
  const result = await pool.query(
    "SELECT * FROM documents WHERE id = $1",
    [id]
  );
  
  if (!result.rows.length) {
    return res.status(404).json({ error: "Document not found" });
  }
  
  res.json(result.rows[0]);
};
```

---

### Step 12: Add Comprehensive Audit Logging (MEDIUM PRIORITY)

**File**: `backend/src/middleware/auditLog.js`

```javascript
const pool = require("../db");

const auditLog = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log after response
    logAuditEvent({
      userId: req.currentUser?.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });
    
    res.send = originalSend;
    return res.send(data);
  };
  
  next();
};

const logAuditEvent = async (event) => {
  try {
    // Only log if audit_logs table exists
    await pool.query(
      `INSERT INTO audit_logs 
        (user_id, method, path, status_code, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        event.userId,
        event.method,
        event.path,
        event.statusCode,
        event.ipAddress,
        event.userAgent,
      ]
    );
  } catch (err) {
    console.error("Audit logging error:", err.message);
    // Don't fail the request if audit logging fails
  }
};

module.exports = { auditLog };
```

**Apply in server.js**:
```javascript
const { auditLog } = require("./middleware/auditLog");

app.use("/api", auditLog);  // Log all API access
```

---

## Testing Checklist

### Test 1: File Access Protection

```bash
# Before fix: ✅ Returns file (NO AUTH REQUIRED)
curl -k https://localhost/download/document.pdf

# After fix: ❌ Returns 401 Unauthorized
curl -k https://localhost/download/document.pdf

# After fix: ✅ Returns file (WITH AUTH)
curl -k -H "Authorization: Bearer <token>" https://localhost/download/document.pdf
```

### Test 2: User Directory Protection

```bash
# Before fix: ✅ Returns user list
curl -k https://localhost/api/users

# After fix: ❌ Returns 401 Unauthorized
curl -k https://localhost/api/users

# After fix: ✅ Returns user list (Admin only)
curl -k -H "Authorization: Bearer <admin-token>" https://localhost/api/users

# After fix: ❌ Returns 403 Forbidden (Ing. Qualité)
curl -k -H "Authorization: Bearer <ing-token>" https://localhost/api/users
```

### Test 3: Document Read Protection

```bash
# Before fix: ✅ Returns all documents
curl -k https://localhost/api/documents

# After fix: ❌ Returns 401 Unauthorized
curl -k https://localhost/api/documents

# After fix: ✅ Returns documents (WITH AUTH)
curl -k -H "Authorization: Bearer <token>" https://localhost/api/documents
```

### Test 4: Per-Resource Authorization

```bash
# Create two users: User A (Ing. Qualité) and User B (Ing. Qualité)
# User A creates a document

# User B tries to access User A's document
# Before fix: ✅ User B can access
# After fix: ❌ User B gets 403 Forbidden

curl -k -H "Authorization: Bearer <user-b-token>" \
  https://localhost/api/documents/<user-a-doc-id>
```

---

## Timeline

| Week | Task | Priority | Estimated Hours |
|---|---|---|---|
| 1 | Protect file serving | CRITICAL | 4 |
| 1 | Protect user directory | CRITICAL | 2 |
| 1 | Protect document reads | CRITICAL | 4 |
| 1 | Protect validation reads | CRITICAL | 2 |
| **Week 1 Total** | | | **12** |
| 2 | Global deny-by-default middleware | HIGH | 6 |
| 2 | Dashboard role filtering | HIGH | 4 |
| 2 | Complete AI module protection | HIGH | 2 |
| 2 | Comprehensive testing | HIGH | 6 |
| **Week 2 Total** | | | **18** |
| 3 | Per-resource authorization | MEDIUM | 12 |
| 3 | Audit logging implementation | MEDIUM | 8 |
| 3 | Security documentation | MEDIUM | 4 |
| **Week 3 Total** | | | **24** |
| | **GRAND TOTAL** | | **54 hours** |

---

## Success Criteria

- [ ] All 57 routes documented with required authentication level
- [ ] 0 unauthenticated access to sensitive endpoints (/files, /documents, /users, etc.)
- [ ] All role requirements explicitly declared in routes
- [ ] Per-resource authorization checks in all read controllers
- [ ] 100% compliance with "Deny by Default" principle
- [ ] Audit trail for all access attempts
- [ ] Security tests passing (see Testing Checklist)
- [ ] No 401/403 errors in normal usage flows
- [ ] Documentation updated with new security requirements

---

## Verification Script

After implementing all changes, run this verification:

```bash
#!/bin/bash
echo "🔐 Testing Access Control Implementation"

BASE_URL="https://localhost"

echo ""
echo "=== UNAUTHENTICATED ACCESS TESTS ==="
echo "All should return 401 Unauthorized"

echo -n "GET /api/documents: "
curl -s -k $BASE_URL/api/documents -o /dev/null -w "%{http_code}\n"

echo -n "GET /api/users: "
curl -s -k $BASE_URL/api/users -o /dev/null -w "%{http_code}\n"

echo -n "GET /api/validations: "
curl -s -k $BASE_URL/api/validations -o /dev/null -w "%{http_code}\n"

echo -n "GET /download/file.pdf: "
curl -s -k $BASE_URL/download/file.pdf -o /dev/null -w "%{http_code}\n"

echo ""
echo "=== AUTHENTICATED ACCESS TESTS ==="
echo "All should return 200 OK (or 404 if resource doesn't exist)"

TOKEN="<your-bearer-token>"

echo -n "GET /api/documents (with token): "
curl -s -k -H "Authorization: Bearer $TOKEN" $BASE_URL/api/documents -o /dev/null -w "%{http_code}\n"

echo -n "GET /api/auth/me (with token): "
curl -s -k -H "Authorization: Bearer $TOKEN" $BASE_URL/api/auth/me -o /dev/null -w "%{http_code}\n"

echo ""
echo "✅ Verification complete"
```

---

## Rollback Plan

If issues arise during implementation:

1. Create new branch: `git checkout -b backup/pre-auth-hardening`
2. Revert changes: `git revert HEAD~N..HEAD`
3. Deploy previous version
4. Investigate issues
5. Re-implement with fixes

---

**Document Version**: 1.0  
**Last Updated**: April 18, 2026  
**Prepared by**: Security Assessment Team
