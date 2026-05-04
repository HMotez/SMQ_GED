/**
 * Global Error Handler Middleware
 * ════════════════════════════════════════════════════════════════
 * Purpose: Catch all unhandled errors and return generic messages
 * - Logs detailed errors server-side
 * - Returns safe, generic error messages to client
 * - Hides file paths, stack traces, and internal details
 * ════════════════════════════════════════════════════════════════
 */

const logger = require("../utils/logger");

/**
 * Error Handler Middleware
 * Must be registered LAST in express middleware chain
 */
const errorHandler = (err, req, res, next) => {
  // Log detailed error server-side
  logger.error("UNHANDLED ERROR", {
    message: err.message,
    stack: err.stack,
    code: err.code,
    path: req.path,
    method: req.method,
    userAgent: req.get("user-agent"),
    ip: req.ip,
  });

  // Determine HTTP status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Generic error message for client (never expose internal details)
  const clientMessage = getGenericErrorMessage(statusCode, err);

  // Send generic response
  res.status(statusCode).json({
    error: clientMessage,
    code: err.code || "INTERNAL_ERROR",
    timestamp: new Date().toISOString(),
    // DO NOT include: stack trace, file paths, SQL queries, etc.
  });
};

/**
 * Map HTTP status codes to generic error messages
 * Never reveal internal details to the client
 */
function getGenericErrorMessage(statusCode, err) {
  const genericMessages = {
    400: "La requête est invalide. Vérifiez vos données.",
    401: "Authentification requise. Veuillez vous connecter.",
    403: "Accès refusé. Vous n'avez pas les permissions nécessaires.",
    404: "La ressource demandée n'existe pas.",
    409: "La ressource existe déjà ou entre en conflit avec les données existantes.",
    413: "Le fichier est trop volumineux. Taille maximale : 50 MB.",
    422: "Les données fournies sont invalides ou incomplètes.",
    429: "Trop de requêtes. Réessayez dans quelques instants.",
    500: "Une erreur serveur s'est produite. Nos équipes ont été notifiées.",
    503: "Le service est temporairement indisponible. Réessayez plus tard.",
  };

  return genericMessages[statusCode] || genericMessages[500];
}

/**
 * 404 Error Handler
 * Catches all undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route non trouvée: ${req.method} ${req.path}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFoundHandler };
