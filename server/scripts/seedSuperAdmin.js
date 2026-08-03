/**
 * Super Admin Seed Script
 * -------------------------
 * Creates a platform-level Super Admin user that has NO tenantId —
 * meaning they can access all tenant data and manage the SaaS platform.
 *
 * Usage:
 *   cd server
 *   node scripts/seedSuperAdmin.js
 *
 * Environment variables:
 *   SUPER_ADMIN_USERNAME   (default: superadmin)
 *   SUPER_ADMIN_EMAIL      (default: superadmin@platform.com)
 *   SUPER_ADMIN_PASSWORD   (required in production, default: SuperAdmin@123 in dev)
 *   SUPER_ADMIN_PHONE      (default: 01999999999)
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { User } from '../modules/user/user.model.js';
import { Role } from '../modules/role/role.model.js';
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
      '[SEED] SUPER_ADMIN_PASSWORD environment variable is required in production. ' +
        'Set it in server/.env before running this script.'
    );
  }
  const defaultPassword = 'SuperAdmin@123';
  console.warn(`[SEED] ⚠️  Using default password "${defaultPassword}" for super admin.`);
  console.warn('[SEED] Set SUPER_ADMIN_PASSWORD in server/.env for production use.');
  return defaultPassword;
};

const seedSuperAdmin = async () => {
  try {
    await connectDB();

    console.log('[SEED] Ensuring default system roles exist...');
    await seedDefaultRoles();

    // Super Admin must have ADMIN role with wildcard permissions
    let adminRole = await Role.findOne({ name: 'ADMIN', isDeleted: false });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'ADMIN',
        displayName: 'Administrator',
        permissions: ['*'],
        isSystem: true,
      });
      console.log('[SEED] Created ADMIN role with wildcard permissions.');
    }

    // Check if super admin already exists
    const existing = await User.findOne({
      $or: [{ username: SUPER_ADMIN_USERNAME }, { email: SUPER_ADMIN_EMAIL }],
    });

    if (existing) {
      // Ensure existing super admin has no tenantId (must be platform-level)
      if (existing.tenantId) {
        console.warn(
          `[SEED] ⚠️  User "${existing.username}" exists but has a tenantId. ` +
            'Super Admins must NOT have a tenantId. Removing it...'
        );
        existing.tenantId = undefined;
        await existing.save();
        console.log(`[SEED] ✅ Removed tenantId from "${existing.username}".`);
      } else {
        console.log(
          `[SEED] ✅ Super Admin "${existing.username}" already exists and is correctly configured.`
        );
      }
      return;
    }

    const password = getPassword();
    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({
      username: SUPER_ADMIN_USERNAME,
      email: SUPER_ADMIN_EMAIL,
      phone: SUPER_ADMIN_PHONE,
      fullName: 'Platform Super Admin',
      passwordHash,
      role: adminRole._id,
      roleName: 'ADMIN',
      isVerified: true,
      isActive: true,
      // tenantId intentionally omitted — this is the platform super admin
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
    console.log('[SEED] ⚠️  Change the password immediately after first login!');
  } catch (error) {
    console.error('[SEED] ❌ Super Admin seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

seedSuperAdmin();
