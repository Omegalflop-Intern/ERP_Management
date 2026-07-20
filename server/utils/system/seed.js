import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../../modules/user/user.model.js';
import { Role } from '../../modules/role/role.model.js';
import { connectDB } from '../../config/db.js';

const getEnvPassword = (role, defaultPassword) => {
  const envKey = `SEED_PASSWORD_${role.toUpperCase()}`;
  const envPass = process.env[envKey];
  if (envPass) return envPass;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Environment variable ${envKey} is required in production`);
  }
  console.warn(`[SEED] Using default password for ${role}. Set ${envKey} env var in production.`);
  return defaultPassword;
};

const seedUsers = [
  { username: 'admin', email: 'admin@brothers-erp.com', phone: '01700000000', roleName: 'ADMIN' },
  { username: 'mamun', email: 'mamun@brothers-erp.com', phone: '01711111111', roleName: 'CASHIER' },
  { username: 'manager', email: 'manager@brothers-erp.com', phone: '01722222222', roleName: 'MANAGER' },
  { username: 'technician', email: 'tech@brothers-erp.com', phone: '01733333333', roleName: 'TECHNICIAN' },
];

const seed = async () => {
  try {
    await connectDB();

    for (const userData of seedUsers) {
      const existing = await User.findOne({ username: userData.username });
      if (existing) {
        console.log(`User '${userData.username}' already exists, skipping...`);
        continue;
      }

      const role = await Role.findOne({ name: userData.roleName });
      if (!role) {
        console.log(`Role '${userData.roleName}' not found, skipping user '${userData.username}'...`);
        continue;
      }

      const password = getEnvPassword(userData.roleName, userData.roleName.toLowerCase() + '123');
      const passwordHash = await bcrypt.hash(password, 10);
      await User.create({
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
        fullName: userData.fullName,
        passwordHash,
        role: role._id,
        roleName: role.name,
      });
      console.log(`Created user: ${userData.username} (${role.name})`);
    }

    console.log('Seed completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
