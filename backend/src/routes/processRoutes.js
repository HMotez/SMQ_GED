const express = require("express");
const router = express.Router();
const { getProcessByFolder } = require("../controllers/processController");

router.get("/by-folder/:folderId", getProcessByFolder);

module.exports = router;
