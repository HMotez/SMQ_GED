const pool = require("../db");

const getProcesses = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM processes ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur processes" });
  }
};

module.exports = { getProcesses };
