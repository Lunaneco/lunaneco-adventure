// The game loads only its own scripts and assets. Inline styles are needed for
// HUD positions/progress bars; inline scripts and eval are deliberately absent.
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'", "script-src 'self'", "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:",
  "font-src 'self'", "media-src 'self' blob:", "connect-src 'self' blob:",
  "worker-src 'self'", "manifest-src 'self'", "object-src 'none'",
  "base-uri 'none'", "form-action 'none'",
].join('; ');

export const SECURITY_HEADERS = {
  'Content-Security-Policy': `${CONTENT_SECURITY_POLICY}; frame-ancestors 'none'`,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()',
};
