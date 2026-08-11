/**
 * Super Admin Seed Script (MySQL/Knex)
 * -----------------------------------
 * Creates a platform-level Super Admin user that has NO tenant_id —
 * meaning they can access all tenant data and manage the SaaS platform.
 *
 * Usage:
 *   cd server
 *   node scripts/seedSuperAdmin.js
 */

import bcrypt from 'bcryptjs';
import { db } from '../config/db.knex.js';
import { seedDefaultRoles } from '../modules/role/role.service.js';

const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@platform.com';
const SUPER_ADMIN_PHONE = process.env.SUPER_ADMIN_PHONE || '01999999999';

const getPassword = () => {
  if (process.env.SUPER_ADMIN_PASSWORD) {
    return process.env.SUPER_ADMIN_PASSWORD;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[SEED] SUPER_ADMIN_PASSWORD environment variable is required in production. Set it in server/.env.'
    );
  }
  const defaultPassword = 'SuperAdmin@123';
  console.warn(`[SEED] ⚠️  Using default password "${defaultPassword}" for super admin.`);
  return defaultPassword;
};

const seedSuperAdmin = async () => {
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
      console.log('[SEED] Created ADMIN role.');
    }

    const existing = await db('users')
      .where({ username: SUPER_ADMIN_USERNAME })
      .orWhere({ email: SUPER_ADMIN_EMAIL })
      .first();

    if (existing) {
      if (existing.tenant_id !== null) {
        await db('users').where({ id: existing.id }).update({ tenant_id: null });
        console.log(`[SEED] ✅ Removed tenant_id from super admin "${existing.username}".`);
      } else {
        console.log(`[SEED] ✅ Super Admin "${existing.username}" already exists.`);
      }
      process.exit(0);
    }

    const password = getPassword();
    const passwordHash = await bcrypt.hash(password, 10);

    await db('users').insert({
      username: SUPER_ADMIN_USERNAME,
      email: SUPER_ADMIN_EMAIL,
      phone: SUPER_ADMIN_PHONE,
      full_name: 'Platform Super Admin',
      password_hash: passwordHash,
      role_id: adminRole.id,
      role_name: 'ADMIN',
      is_verified: true,
      is_active: true,
      tenant_id: null,
    });

    console.log('');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║          ✅  Super Admin Created Successfully          ║');
    console.log('╠═══════════════════════════════════════════════════════╣');
    console.log(`║  Username : ${SUPER_ADMIN_USERNAME.padEnd(43)}║`);
    console.log(`║  Email    : ${SUPER_ADMIN_EMAIL.padEnd(43)}║`);
    console.log(`║  Password : ${password.padEnd(43)}║`);
    console.log('║  TenantId : none (platform-level super admin)          ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('[SEED] ❌ Super Admin seed failed:', error.message);
    process.exit(1);
  }
};

seedSuperAdmin();
