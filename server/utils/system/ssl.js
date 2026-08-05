import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Auto-generate self-signed TLS certificates for development.
 * Uses openssl (must be installed on the system).
 *
 * @param {object} opts
 * @param {string} opts.certDir  - Directory to store cert.pem and key.pem
 * @param {string} opts.host     - Subject alt name / CN (default: localhost)
 * @param {number} opts.validDays - Validity in days (default: 365)
 * @returns {{ certPath: string, keyPath: string, generated: boolean }}
 */
export function ensureSSLCerts({ certDir, host = 'localhost', validDays = 365 } = {}) {
  const dir = certDir || path.resolve(__dirname, '../../certs');
  const certPath = path.join(dir, 'cert.pem');
  const keyPath = path.join(dir, 'key.pem');

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    return { certPath, keyPath, generated: false };
  }

  // Ensure certs directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    // Generate CA private key + self-signed cert
    const opensslCmd = [
      'openssl req -x509 -newkey rsa:2048 -nodes',
      `-keyout "${keyPath}"`,
      `-out "${certPath}"`,
      `-days ${validDays}`,
      `-subj "/C=BD/ST=Dhaka/L=Dhaka/O=MobileShopERP/CN=${host}"`,
      `-addext "subjectAltName=DNS:${host},DNS:*.${host},IP:127.0.0.1,IP:0.0.0.0"`,
    ].join(' ');

    execSync(opensslCmd, { stdio: 'pipe', timeout: 15000 });

    // Ensure correct permissions on private key
    fs.chmodSync(keyPath, 0o600);

    console.log(`\x1b[32m[SSL]\x1b[0m Self-signed certificate generated: ${dir}`);
    return { certPath, keyPath, generated: true };
  } catch (err) {
    console.error(`\x1b[33m[SSL]\x1b[0m Failed to generate SSL certs: ${err.message}`);
    console.error('\x1b[33m[SSL]\x1b[0m Server will start without TLS. Install openssl or create certs manually.');
    return { certPath: null, keyPath: null, generated: false };
  }
}
