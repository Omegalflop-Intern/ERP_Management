import { db } from '../config/db.knex.js';

const sampleProducts = [
  {
    name: 'Samsung Galaxy A15',
    brand: 'Samsung',
    category: 'Smartphone',
    model: 'Galaxy A15',
    sku: 'SAM-A15-001',
    ram: '4GB',
    storage: '128GB',
    color: 'Black',
    cost_price: 12999,
    selling_price: 15999,
    wholesale_price: 14500,
    stock_quantity: 25,
    min_stock_alert: 5,
    warranty_months: 12,
  },
  {
    name: 'Anker 20W Fast Charger',
    brand: 'Anker',
    category: 'Accessory',
    model: '20W PD',
    sku: 'ANK-20W-001',
    cost_price: 1199,
    selling_price: 1799,
    wholesale_price: 1500,
    stock_quantity: 40,
    min_stock_alert: 10,
    warranty_months: 18,
  },
  {
    name: 'JBL Tune 510BT Headphone',
    brand: 'JBL',
    category: 'Accessory',
    model: 'Tune 510BT',
    sku: 'JBL-510-001',
    cost_price: 3499,
    selling_price: 4999,
    wholesale_price: 4500,
    stock_quantity: 15,
    min_stock_alert: 5,
    warranty_months: 12,
  },
];

const seedProducts = async () => {
  try {
    const shouldClear = process.argv.includes('--clear');
    if (shouldClear) {
      console.log('[CLEAR] Removing all existing products...');
      await db('products').delete();
      console.log('[CLEAR] All products removed.');
    }

    let created = 0;
    let skipped = 0;

    for (const p of sampleProducts) {
      const existing = await db('products').where({ sku: p.sku }).first();
      if (existing) {
        console.log(`Product '${p.name}' (${p.sku}) already exists, skipping...`);
        skipped++;
        continue;
      }

      await db('products').insert({
        name: p.name,
        brand: p.brand,
        category: p.category,
        model: p.model,
        sku: p.sku,
        ram: p.ram || null,
        storage: p.storage || null,
        color: p.color || null,
        cost_price: p.cost_price,
        selling_price: p.selling_price,
        wholesale_price: p.wholesale_price,
        stock_quantity: p.stock_quantity,
        min_stock_alert: p.min_stock_alert,
        warranty_months: p.warranty_months,
      });
      console.log(`Created product: ${p.name} (${p.sku}) - Stock: ${p.stock_quantity}`);
      created++;
    }

    console.log(`\nSeed completed! Created: ${created}, Skipped: ${skipped}`);
    process.exit(0);
  } catch (error) {
    console.error('Product seed failed:', error.message);
    process.exit(1);
  }
};

seedProducts();
