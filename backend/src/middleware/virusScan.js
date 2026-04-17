// ============================================================
// middleware/virusScan.js
// Analyse antivirus des fichiers uploadés via ClamAV (clamd)
// Protocole : INSTREAM sur TCP (port 3310)
// Comportement : si ClamAV indisponible → warning + upload autorisé
// ============================================================
"use strict";

const net = require("net");
const fs  = require("fs");

const CLAMAV_HOST    = process.env.CLAMAV_HOST    || "clamav";
const CLAMAV_PORT    = parseInt(process.env.CLAMAV_PORT || "3310", 10);
const CLAMAV_TIMEOUT = 15000; // 15 secondes max

// ─────────────────────────────────────────────────────────────
// scanBuffer — envoie un buffer à clamd via INSTREAM
// Retourne { clean: true } ou { clean: false, virus: "..." }
// ─────────────────────────────────────────────────────────────
function scanBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let response  = "";

    client.setTimeout(CLAMAV_TIMEOUT, () => {
      client.destroy();
      reject(new Error("ClamAV timeout"));
    });

    client.connect(CLAMAV_PORT, CLAMAV_HOST, () => {
      // Protocole INSTREAM : zINSTREAM\0 + chunks [4-byte size][data] + [0000]
      client.write("zINSTREAM\0");

      const sizeBuf = Buffer.alloc(4);
      sizeBuf.writeUInt32BE(buffer.length);
      client.write(sizeBuf);
      client.write(buffer);

      const termBuf = Buffer.alloc(4);
      termBuf.writeUInt32BE(0);
      client.write(termBuf);
    });

    client.on("data", (data) => {
      response += data.toString();
      if (response.includes("\0") || response.includes("\n")) {
        client.destroy();
        const trimmed = response.replace(/\0/g, "").trim();
        if (trimmed.endsWith("OK")) {
          resolve({ clean: true });
        } else {
          // Format : "stream: Eicar-Signature FOUND"
          const virusName = trimmed.replace("stream: ", "").replace(" FOUND", "");
          resolve({ clean: false, virus: virusName });
        }
      }
    });

    client.on("error", (err) => reject(err));
  });
}

// ─────────────────────────────────────────────────────────────
// virusScanMiddleware — middleware Express post-upload
// Doit être placé APRÈS multer (req.file doit être présent)
// ─────────────────────────────────────────────────────────────
const virusScanMiddleware = async (req, res, next) => {
  // Pas de fichier uploadé → passer
  if (!req.file) return next();

  const filePath = req.file.path;

  try {
    const buffer = fs.readFileSync(filePath);
    const result = await scanBuffer(buffer);

    if (!result.clean) {
      // Supprimer le fichier infecté immédiatement
      fs.unlinkSync(filePath);
      console.warn(`[ClamAV] Fichier infecté détecté et supprimé : ${req.file.originalname} — ${result.virus}`);
      return res.status(422).json({
        error: "Le fichier uploadé a été rejeté car il contient un virus ou un logiciel malveillant.",
        code:  "VIRUS_DETECTED",
      });
    }

    console.log(`[ClamAV] Fichier sain : ${req.file.originalname}`);
    next();
  } catch (err) {
    // ClamAV indisponible → autoriser l'upload mais logger l'avertissement
    console.warn(`[ClamAV] Service indisponible — upload autorisé sans scan : ${err.message}`);
    next();
  }
};

module.exports = { virusScanMiddleware };
