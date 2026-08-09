import bcrypt from 'bcryptjs';
import { db } from '../../config/db.knex.js';
import { seedDefaultRoles } from '../../modules/role/role.service.js';
import { seedSubscriptionPlans } from '../../modules/plans/plans.service.js';

const SEED_PASSWORD = process.env.SEED_PASSWORD || 'admin123';

const admins = [
  { username: 'salahuddin', email: 'salahuddin@erp.com', phone: '01710000001', fullName: 'Salahuddin' },
  { username: 'admin2', email: 'admin2@erp.com', phone: '01710000002', fullName: 'Admin Two' },
  { username: 'admin3', email: 'admin3@erp.com', phone: '01710000003', fullName: 'Admin Three' },
  { username: 'admin4', email: 'admin4@erp.com', phone: '01710000004', fullName: 'Admin Four' },
  { username: 'admin5', email: 'admin5@erp.com', phone: '01710000005', fullName: 'Admin Five' },
];

const seed = async () => {
  try {
    console.log('[SEED] Seeding default system roles...');
    await seedDefaultRoles();

    console.log('[SEED] Seeding default subscription plans...');
    await seedSubscriptionPlans();

    const adminRole = await db('roles').where({ name: 'ADMIN' }).first();
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

    for (const u of admins) {
      const existing = await db('users').where({ username: u.username }).first();
      if (!existing) {
        await db('users').insert({
          username: u.username,
          email: u.email,
          phone: u.phone,
          full_name: u.fullName,
          password_hash: passwordHash,
          role_id: adminRole?.id || 1,
          role_name: 'ADMIN',
          is_active: true,
          is_verified: true,
          is_deleted: false,
        });
        console.log(`[SEED] Created admin '${u.username}' (password: ${SEED_PASSWORD})`);
      } else {
        console.log(`[SEED] User '${u.username}' already exists, skipping`);
      }
    }

    console.log('✅ Seeding completed successfully!');
    console.log(`[SEED] Login credentials — password: ${SEED_PASSWORD}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
