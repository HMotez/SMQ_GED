const express = require("express");
const { loadUser, requireRole } = require("../middleware/roleMiddleware");
const { getIncidents, updateIncident, createIncident } = require("../controllers/incidentController");

const router = express.Router();

router.get(  "/",    loadUser, requireRole("Admin"), getIncidents);
router.post( "/",    loadUser, requireRole("Admin"), createIncident);
router.put(  "/:id", loadUser, requireRole("Admin"), updateIncident);

module.exports = router;
