import { logSecurityEvent } from '../utils/auth/auditLog.js';

const failedAttempts = new Map();

const normalizeKey = (loginIdentifier, ip) => {
  const cleanId = (loginIdentifier || '').trim().toLowerCase();
  const cleanIp = ip || 'unknown';
  return `${cleanId}:${cleanIp}`;
};

export const trackFailedLogin = (req, loginIdentifier) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const key = normalizeKey(loginIdentifier, ip);
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 5;

  let attempts = failedAttempts.get(key) || { count: 0, firstAttempt: now, lastAttempt: now };

  if (now - attempts.firstAttempt > windowMs) {
    attempts = { count: 0, firstAttempt: now, lastAttempt: now };
  }

  attempts.count++;
  attempts.lastAttempt = now;
  failedAttempts.set(key, attempts);

  if (attempts.count >= maxAttempts) {
    logSecurityEvent({
      action: 'BRUTE_FORCE_DETECTED',
      ipAddress: ip,
      userAgent: req.headers['user-agent'] || '',
      details: {
        loginIdentifier: (loginIdentifier || '').trim().toLowerCase(),
        attempts: attempts.count,
        windowMinutes: 15,
      },
      severity: 'high',
    });

    failedAttempts.set(key, { count: 0, firstAttempt: now + windowMs, lastAttempt: now });
  }

  return attempts.count;
};

export const clearFailedLogin = (loginIdentifier, ip) => {
  const key = normalizeKey(loginIdentifier, ip);
  failedAttempts.delete(key);
};

export const getFailedLoginCount = (loginIdentifier, ip) => {
  const key = normalizeKey(loginIdentifier, ip);
  const attempts = failedAttempts.get(key);
  if (!attempts || Date.now() - attempts.firstAttempt > 15 * 60 * 1000) {
    return 0;
  }
  return attempts.count;
};

