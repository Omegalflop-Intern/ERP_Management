/**
 * Super Admins Seed Script (MySQL/Knex)
 * --------------------------------------
 * Creates 2 platform-level Super Admin users with NO tenant_id.
 *
 * Usage:
 *   cd server
 *   node scripts/seedSuperAdmins.js
 *
 * Env vars (optional, falls back to defaults in development):
 *   SUPER_ADMIN_1_USERNAME  SUPER_ADMIN_1_EMAIL  SUPER_ADMIN_1_PASSWORD  SUPER_ADMIN_1_PHONE
 *   SUPER_ADMIN_2_USERNAME  SUPER_ADMIN_2_EMAIL  SUPER_ADMIN_2_PASSWORD  SUPER_ADMIN_2_PHONE
 */

import bcrypt from 'bcryptjs';
import { db } from '../config/db.knex.js';
import { seedDefaultRoles } from '../modules/role/role.service.js';

const isProd = process.env.NODE_ENV === 'production';

const getPassword = (envVar, label, fallback) => {
  if (process.env[envVar]) return process.env[envVar];
  if (isProd) throw new Error(`[SEED] ${envVar} is required in production.`);
  console.warn(`[SEED] ⚠️  Using default password "${fallback}" for ${label}.`);
  return fallback;
};

const ADMINS = [
  {
    username: process.env.SUPER_ADMIN_1_USERNAME || 'superadmin',
    email: process.env.SUPER_ADMIN_1_EMAIL || 'superadmin@platform.com',
    phone: process.env.SUPER_ADMIN_1_PHONE || '01999999991',
    fullName: 'Platform Super Admin',
    passwordEnvKey: 'SUPER_ADMIN_1_PASSWORD',
    defaultPassword: 'SuperAdmin@123',
  },
  {
    username: process.env.SUPER_ADMIN_2_USERNAME || 'sysadmin',
    email: process.env.SUPER_ADMIN_2_EMAIL || 'sysadmin@platform.com',
    phone: process.env.SUPER_ADMIN_2_PHONE || '01999999992',
    fullName: 'System Administrator',
    passwordEnvKey: 'SUPER_ADMIN_2_PASSWORD',
    defaultPassword: 'SysAdmin@123',
  },
];

const seedSuperAdmins = async () => {
  try {
    console.log('[SEED] Ensuring default system roles exist...');
    await seedDefaultRoles();

    let adminRole = await db('roles').where({ name: 'ADMIN', is_deleted: false }).first();
    if (!adminRole) {
      const [id] = await db('roles').insert({
        name: 'ADMIN',
        display_name: 'Administrator',
        permissions: JSON.stringify(['*']),
        is_system: true,
      });
      adminRole = { id, name: 'ADMIN' };
    }

    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║            🚀  Super Admin Seed Results                ║');
    console.log('╠════════════════════════════════════════════════════════╣');

    for (const admin of ADMINS) {
      const existing = await db('users')
        .where({ username: admin.username })
        .orWhere({ email: admin.email })
        .first();

      if (existing) {
        if (existing.tenant_id !== null) {
          await db('users').where({ id: existing.id }).update({ tenant_id: null });
          console.log(`║  ✅ Promoted "${admin.username}" to platform-level.           ║`);
        } else {
          console.log(`║  ✅ "${admin.username}" already exists — skipped.              ║`);
        }
        continue;
      }

      const password = getPassword(admin.passwordEnvKey, admin.username, admin.defaultPassword);
      const passwordHash = await bcrypt.hash(password, 10);

      await db('users').insert({
        username: admin.username,
        email: admin.email,
        phone: admin.phone,
        full_name: admin.fullName,
        password_hash: passwordHash,
        role_id: adminRole.id,
        role_name: 'ADMIN',
        is_verified: true,
        is_active: true,
        tenant_id: null,
      });

      console.log(`║  ✅ Created : ${admin.username.padEnd(43)}║`);
      console.log(`║     Email  : ${admin.email.padEnd(43)}║`);
      console.log(`║     Pass   : ${password.padEnd(43)}║`);
      console.log('║                                                        ║');
    }

    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('[SEED] ❌ Failed:', error.message);
    process.exit(1);
  }
};

seedSuperAdmins();
