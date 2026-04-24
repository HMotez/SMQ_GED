/**
 * securityHeaders.js — Global Security Headers Middleware
 * Applies security headers to all backend API responses
 * Complements Nginx frontend security configuration
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
