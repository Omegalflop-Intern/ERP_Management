import crypto from 'crypto';
import { env } from '../config/env.config.js';

const ALGORITHM = 'aes-256-gcm';
const rawSecret = env.JWT_SECRET || 'mobile-shop-erp-secret-key-salt-32';
if (env.NODE_ENV === 'production' && !env.JWT_SECRET) {
  console.error('[CRITICAL SECURITY WARNING]: JWT_SECRET is missing in production environment!');
}

const SECRET_KEY = crypto.scryptSync(rawSecret, 'salt', 32);

export const hashText = (text) => {
  if (!text || typeof text !== 'string') return text;
  const normalized = text.trim().toLowerCase();
  return crypto.createHmac('sha256', SECRET_KEY).update(normalized).digest('hex');
};

export const encryptText = (text) => {
  if (!text) return text;
  if (typeof text !== 'string') return text;
  if (text.startsWith('enc:')) return text;
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `enc:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    return text;
  }
};

export const decryptText = (text) => {
  if (!text || typeof text !== 'string' || !text.startsWith('enc:')) return text;
  try {
    const parts = text.split(':');
    if (parts.length !== 4) return text;
    const iv = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return text;
  }
};

