import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Tenant } from '../modules/tenant/tenant.model.js';
import { User } from '../modules/user/user.model.js';
import { Role } from '../modules/role/role.model.js';
import { Product } from '../modules/product/product.model.js';
import { connectDB } from '../config/db.js';

const shopData = {
  shopName: 'Salah Telecom',
  ownerName: 'Salahuddin',
  email: 'salah@salah-telecom.com',
  phone: '01700000001',
  plan: 'PRO',
  status: 'ACTIVE',
  maxBranches: 5,
  maxUsers: 20,
  kycDocuments: {
    nidNumber: '1234567890123',
    tradeLicenseNumber: 'TRAD-2024-001',
    kycStatus: 'APPROVED',
    reviewedAt: new Date(),
  },
};

const ownerData = {
  username: 'salah',
  email: 'salah@salah-telecom.com',
  phone: '01700000001',
  fullName: 'Salahuddin',
  roleName: 'ADMIN',
  isVerified: true,
  password: 'salah123',
};

const seedShop = async () => {
  try {
    await connectDB();

    // Check if shop already exists
    const existingTenant = await Tenant.findOne({ shopName: shopData.shopName });
    if (existingTenant) {
      console.log(`Shop '${shopData.shopName}' already exists with ID: ${existingTenant._id}`);
      console.log('Updating products to associate with this shop...');
      
      const result = await Product.updateMany(
        { tenantId: { $exists: false } },
        { $set: { tenantId: existingTenant._id } }
      );
      console.log(`Updated ${result.modifiedCount} products with tenantId.`);
      
      await mongoose.connection.close();
      return;
    }

    // Create tenant (shop)
    console.log('[SEED] Creating shop:', shopData.shopName);
    const tenant = await Tenant.create(shopData);
    console.log(`[SEED] Shop created: ${tenant.shopName} (ID: ${tenant._id})`);

    // Find ADMIN role
    const adminRole = await Role.findOne({ name: 'ADMIN' });
    if (!adminRole) {
      console.error('ADMIN role not found! Run seed first.');
      process.exitCode = 1;
      return;
    }

    // Create shop owner
    console.log('[SEED] Creating shop owner:', ownerData.username);
    const passwordHash = await bcrypt.hash(ownerData.password, 10);
    const owner = await User.create({
      username: ownerData.username,
      email: ownerData.email,
      phone: ownerData.phone,
      fullName: ownerData.fullName,
      passwordHash,
      role: adminRole._id,
      roleName: adminRole.name,
      tenantId: tenant._id,
      isVerified: ownerData.isVerified,
    });
    console.log(`[SEED] Owner created: ${owner.username} (ID: ${owner._id})`);

    // Associate all products with this tenant
    console.log('[SEED] Associating products with shop...');
    const productResult = await Product.updateMany(
      { tenantId: { $exists: false } },
      { $set: { tenantId: tenant._id } }
    );
    console.log(`[SEED] ${productResult.modifiedCount} products associated with ${tenant.shopName}`);

    console.log('\n=== SHOP CREATED SUCCESSFULLY ===');
    console.log(`Shop: ${tenant.shopName}`);
    console.log(`Plan: ${tenant.plan}`);
    console.log(`Status: ${tenant.status}`);
    console.log(`Owner: ${owner.username}`);
    console.log(`Login: ${ownerData.email} / ${ownerData.password}`);
    console.log('================================\n');

  } catch (error) {
    console.error('Shop seed failed:', error);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

seedShop();
