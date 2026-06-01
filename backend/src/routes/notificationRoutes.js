// ============================================================
// routes/notificationRoutes.js — Sprint 5
// RÔLE : Gère les notifications intelligentes de l'utilisateur connecté.
//        Toutes les routes exigent une authentification (loadUser global).
//        Les notifications sont créées automatiquement par :
//          - Les changements de statut des documents
//          - Les nouvelles versions uploadées
//          - Les dates de révision dépassées (CRON 24h)
//          - Les désignations comme relecteur/validateur
//
// Endpoints :
//   GET   /api/notifications              → liste les notifications de l'utilisateur
//   GET   /api/notifications/unread-count → compteur badge cloche
//   PATCH /api/notifications/:id/read     → marquer une notif comme lue
//   PATCH /api/notifications/read-all     → tout marquer comme lu
//   POST  /api/notifications/trigger-expiration → déclencher manuellement le job
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
