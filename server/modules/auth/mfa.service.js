import crypto from 'crypto';
import { ApiError } from '../../utils/http/ApiError.js';

const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const base32Encode = (buffer) => {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += base32Chars[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += base32Chars[(value << (5 - bits)) & 31];
  }
  return output;
};

const base32Decode = (string) => {
  const cleanString = string.toUpperCase().replace(/=/g, '').replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (let i = 0; i < cleanString.length; i++) {
    const val = base32Chars.indexOf(cleanString[i]);
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
};

export const generateMfaSecret = (username) => {
  const secretBuffer = crypto.randomBytes(20);
  const secret = base32Encode(secretBuffer);
  const otpauthUrl = `otpauth://totp/MobileShopERP:${encodeURIComponent(username)}?secret=${secret}&issuer=MobileShopERP`;
  return { secret, otpauthUrl };
};

export const generateTOTP = (secret, timeStep = 30) => {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep);

  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(buffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0xf;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = (code % 1000000).toString().padStart(6, '0');
  return otp;
};

export const verifyTOTP = (secret, token, window = 1) => {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const currentCounter = Math.floor(epoch / 30);

  for (let i = -window; i <= window; i++) {
    const counter = currentCounter + i;
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(counter));

    const hmac = crypto.createHmac('sha1', key);
    hmac.update(buffer);
    const digest = hmac.digest();

    const offset = digest[digest.length - 1] & 0xf;
    const code =
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);

    const generatedOtp = (code % 1000000).toString().padStart(6, '0');
    if (generatedOtp === token) {
      return true;
    }
  }
  return false;
};

export const generateBackupCodes = (count = 8) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
};
