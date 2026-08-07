/**
 * Migration: Auto-generate subdomains for existing tenants.
 * Run once: node server/scripts/migrateSubdomains.js
 */
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile_shop_erp';

const tenantSchema = new mongoose.Schema({
  shopName: String,
  subdomain: String,
  isDeleted: Boolean,
}, { timestamps: true });

const Tenant = mongoose.model('Tenant', tenantSchema);

async function generateSubdomain(shopName) {
  const slug = shopName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);

  let finalSlug = slug;
  let counter = 1;
  while (await Tenant.findOne({ subdomain: finalSlug, isDeleted: false })) {
    finalSlug = `${slug}-${counter++}`;
  }
  return finalSlug;
}

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.\n');

  const tenants = await Tenant.find({ isDeleted: false, subdomain: { $exists: false } });
  console.log(`Found ${tenants.length} tenants without subdomains.\n`);

  for (const tenant of tenants) {
    const subdomain = await generateSubdomain(tenant.shopName);
    await Tenant.updateOne({ _id: tenant._id }, { $set: { subdomain } });
    console.log(`  ✓ ${tenant.shopName} → ${subdomain}.erp.com`);
  }

  console.log(`\nMigration complete. ${tenants.length} tenants updated.`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
