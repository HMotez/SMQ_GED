/**
 * middleware/securityHeaders.js
 * RÔLE : Applique les en-têtes HTTP de sécurité sur toutes les
 *        réponses API du backend.
 *        Protège contre les attaques web courantes :
 *          - HSTS           → force HTTPS pendant 1 an
 *          - X-Frame-Options → anti-clickjacking (DENY sauf fichiers)
 *          - X-Content-Type → anti-MIME sniffing
 *          - CSP            → anti-XSS, restreint les sources autorisées
 *          - Referrer-Policy → limite les fuites d'information
 *          - Permissions-Policy → désactive caméra/micro/géoloc
 *        Complète la configuration sécurité de Nginx en frontend.
 */

// File-serving routes that must be embeddable in iframes
const FILE_ROUTES = ["/files/", "/preview/", "/download/", "/convert/"];

module.exports = (req, res, next) => {
  const isFileRoute = FILE_ROUTES.some(p => req.path.startsWith(p));

  // Strict-Transport-Security (HSTS) — Force HTTPS for 1 year
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // X-Content-Type-Options — Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // X-Frame-Options: file routes must be frameable from same origin
  res.setHeader("X-Frame-Options", isFileRoute ? "SAMEORIGIN" : "DENY");

  // X-XSS-Protection — Enable browser XSS filters
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer-Policy — Control referrer information leakage
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions-Policy — Disable dangerous browser features
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), accelerometer=(), " +
    "gyroscope=(), magnetometer=(), usb=()"
  );

  // Content-Security-Policy
  // File routes: allow framing from same origin so PDF preview iframes work
  // API routes: deny all framing (clickjacking protection)
  const frameAncestors = isFileRoute ? "frame-ancestors 'self'" : "frame-ancestors 'none'";
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self' https: wss:; " +
    `${frameAncestors}; ` +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "upgrade-insecure-requests"
  );

  next();
};
