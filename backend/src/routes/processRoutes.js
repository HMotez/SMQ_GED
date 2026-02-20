const express = require("express");
const router  = express.Router();
const { getProcesses } = require("../controllers/processController");

router.get("/", getProcesses);

module.exports = router;
