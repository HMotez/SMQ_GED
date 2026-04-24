/**
 * Logger Utility
 * ════════════════════════════════════════════════════════════════
 * Purpose: Centralized logging for errors and important events
 * Logs to console and can be extended to file/database logging
 * ════════════════════════════════════════════════════════════════
 */

const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../../logs");
const ERROR_LOG = path.join(LOG_DIR, "errors.log");
const APP_LOG = path.join(LOG_DIR, "app.log");

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Format timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Write to log file
 */
function writeToFile(file, level, category, data) {
  const logEntry = {
    timestamp: getTimestamp(),
    level,
    category,
    ...data,
  };

  const logLine = JSON.stringify(logEntry) + "\n";

  fs.appendFile(file, logLine, (err) => {
    if (err) console.error("Failed to write log:", err);
  });
}

/**
 * Error Logging
 */
const error = (category, data = {}) => {
  const logData = {
    level: "ERROR",
    category,
    ...data,
  };

  console.error(
    `[${getTimestamp()}] ERROR [${category}]`,
    JSON.stringify(data)
  );

  writeToFile(ERROR_LOG, "ERROR", category, data);
};

/**
 * Info Logging
 */
const info = (category, data = {}) => {
  const logData = {
    level: "INFO",
    category,
    ...data,
  };

  console.log(
    `[${getTimestamp()}] INFO [${category}]`,
    JSON.stringify(data)
  );

  writeToFile(APP_LOG, "INFO", category, data);
};

/**
 * Warning Logging
 */
const warn = (category, data = {}) => {
  const logData = {
    level: "WARN",
    category,
    ...data,
  };

  console.warn(
    `[${getTimestamp()}] WARN [${category}]`,
    JSON.stringify(data)
  );

  writeToFile(APP_LOG, "WARN", category, data);
};

/**
 * Security Event Logging
 */
const security = (event, data = {}) => {
  const logData = {
    level: "SECURITY",
    category: "SECURITY",
    event,
    ...data,
  };

  console.warn(
    `[${getTimestamp()}] SECURITY [${event}]`,
    JSON.stringify(data)
  );

  writeToFile(ERROR_LOG, "SECURITY", event, data);
};

module.exports = {
  error,
  info,
  warn,
  security,
};
