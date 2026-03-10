// ============================================================
// routes/notificationRoutes.js — Sprint 5
// ============================================================
const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/notificationController");
const { loadUser } = require("../middleware/roleMiddleware");

// Toutes les routes nécessitent un utilisateur authentifié
router.use(loadUser);

// GET /api/notifications/unread-count  (avant /:id pour éviter le conflit)
router.get("/unread-count", ctrl.getUnreadCount);

// GET /api/notifications
router.get("/", ctrl.getUserNotifications);

// PATCH /api/notifications/read-all  (avant /:id/read)
router.patch("/read-all", ctrl.markAllAsRead);

// POST /api/notifications/trigger-expiration  (Admin — test manuel)
router.post("/trigger-expiration", ctrl.triggerExpirationJob);

// PATCH /api/notifications/:id/read
router.patch("/:id/read", ctrl.markAsRead);

module.exports = router;
