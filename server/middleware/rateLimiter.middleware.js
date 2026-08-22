import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // 1000 requests per 15 minutes per IP for active ERP use
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 failed login attempts per 15 minutes per login identifier + IP
  skipSuccessfulRequests: true, // Crucial: successful logins & authenticated operations do NOT consume attempts
  keyGenerator: (req) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const login = (req.body?.login || req.body?.email || req.body?.username || '').trim().toLowerCase();
    return login ? `${ip}_${login}` : ip;
  },
  validate: { keyGeneratorIpFallback: false, xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many failed login attempts for this account/device. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});


