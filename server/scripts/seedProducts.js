import mongoose from 'mongoose';
import { Product } from '../modules/product/product.model.js';
import { connectDB } from '../config/db.js';

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
    costPrice: 12999,
    sellingPrice: 15999,
    wholesalePrice: 14500,
    stockQuantity: 25,
    minStockAlert: 5,
    warrantyMonths: 12,
  },
  {
    name: 'Samsung Galaxy A25',
    brand: 'Samsung',
    category: 'Smartphone',
    model: 'Galaxy A25',
    sku: 'SAM-A25-001',
    ram: '6GB',
    storage: '128GB',
    color: 'Blue',
    costPrice: 18999,
    sellingPrice: 22999,
    wholesalePrice: 21000,
    stockQuantity: 18,
    minStockAlert: 5,
    warrantyMonths: 12,
  },
  {
    name: 'Samsung Galaxy S24',
    brand: 'Samsung',
    category: 'Smartphone',
    model: 'Galaxy S24',
    sku: 'SAM-S24-001',
    ram: '8GB',
    storage: '256GB',
    color: 'Phantom Black',
    costPrice: 59999,
    sellingPrice: 74999,
    wholesalePrice: 70000,
    stockQuantity: 8,
    minStockAlert: 3,
    warrantyMonths: 24,
  },
  {
    name: 'iPhone 15',
    brand: 'Apple',
    category: 'Smartphone',
    model: 'iPhone 15',
    sku: 'APL-15-001',
    ram: '6GB',
    storage: '128GB',
    color: 'Black',
    costPrice: 79999,
    sellingPrice: 99999,
    wholesalePrice: 95000,
    stockQuantity: 12,
    minStockAlert: 3,
    warrantyMonths: 12,
  },
  {
    name: 'iPhone 15 Pro',
    brand: 'Apple',
    category: 'Smartphone',
    model: 'iPhone 15 Pro',
    sku: 'APL-15P-001',
    ram: '8GB',
    storage: '256GB',
    color: 'Titanium Black',
    costPrice: 119999,
    sellingPrice: 144999,
    wholesalePrice: 138000,
    stockQuantity: 6,
    minStockAlert: 2,
    warrantyMonths: 12,
  },
  {
    name: 'Xiaomi Redmi Note 13',
    brand: 'Xiaomi',
    category: 'Smartphone',
    model: 'Redmi Note 13',
    sku: 'XMI-N13-001',
    ram: '6GB',
    storage: '128GB',
    color: 'Midnight Black',
    costPrice: 13999,
    sellingPrice: 17999,
    wholesalePrice: 16500,
    stockQuantity: 30,
    minStockAlert: 8,
    warrantyMonths: 12,
  },
  {
    name: 'Xiaomi Poco X6',
    brand: 'Xiaomi',
    category: 'Smartphone',
    model: 'Poco X6',
    sku: 'XMI-X6-001',
    ram: '8GB',
    storage: '256GB',
    color: 'White',
    costPrice: 21999,
    sellingPrice: 26999,
    wholesalePrice: 25000,
    stockQuantity: 15,
    minStockAlert: 5,
    warrantyMonths: 12,
  },
  {
    name: 'Realme C67',
    brand: 'Realme',
    category: 'Smartphone',
    model: 'C67',
    sku: 'RML-C67-001',
    ram: '6GB',
    storage: '128GB',
    color: 'Black Rock',
    costPrice: 11999,
    sellingPrice: 14999,
    wholesalePrice: 13500,
    stockQuantity: 22,
    minStockAlert: 5,
    warrantyMonths: 12,
  },
  {
    name: 'Oppo A58',
    brand: 'Oppo',
    category: 'Smartphone',
    model: 'A58',
    sku: 'OPP-A58-001',
    ram: '6GB',
    storage: '128GB',
    color: 'Starry Black',
    costPrice: 13499,
    sellingPrice: 16499,
    wholesalePrice: 15000,
    stockQuantity: 20,
    minStockAlert: 5,
    warrantyMonths: 12,
  },
  {
    name: 'Vivo Y27',
    brand: 'Vivo',
    category: 'Smartphone',
    model: 'Y27',
    sku: 'VVY-Y27-001',
    ram: '6GB',
    storage: '128GB',
    color: 'Midnight Purple',
    costPrice: 12499,
    sellingPrice: 15499,
    wholesalePrice: 14000,
    stockQuantity: 17,
    minStockAlert: 5,
    warrantyMonths: 12,
  },
  {
    name: 'Samsung Galaxy Buds2',
    brand: 'Samsung',
    category: 'Accessory',
    model: 'Galaxy Buds2',
    sku: 'SAM-BUDS2-001',
    costPrice: 4999,
    sellingPrice: 6999,
    wholesalePrice: 6000,
    stockQuantity: 40,
    minStockAlert: 10,
    warrantyMonths: 12,
  },
  {
    name: 'Spigen Case iPhone 15',
    brand: 'Spigen',
    category: 'Accessory',
    model: 'Tough Armor',
    sku: 'SPG-15-001',
    costPrice: 899,
    sellingPrice: 1499,
    wholesalePrice: 1200,
    stockQuantity: 50,
    minStockAlert: 15,
    warrantyMonths: 6,
  },
  {
    name: 'Samsung 25W Charger',
    brand: 'Samsung',
    category: 'Accessory',
    model: 'EP-TA800',
    sku: 'SAM-CHG25-001',
    costPrice: 1299,
    sellingPrice: 1999,
    wholesalePrice: 1700,
    stockQuantity: 35,
    minStockAlert: 10,
    warrantyMonths: 6,
  },
  {
    name: 'Tempered Glass Samsung A15',
    brand: 'Generic',
    category: 'Accessory',
    model: 'TG-A15',
    sku: 'TG-A15-001',
    costPrice: 99,
    sellingPrice: 299,
    wholesalePrice: 200,
    stockQuantity: 100,
    minStockAlert: 30,
    warrantyMonths: 1,
  },
  {
    name: 'JBL Tune 510BT Headphone',
    brand: 'JBL',
    category: 'Accessory',
    model: 'Tune 510BT',
    sku: 'JBL-510-001',
    costPrice: 3499,
    sellingPrice: 4999,
    wholesalePrice: 4500,
    stockQuantity: 15,
    minStockAlert: 5,
    warrantyMonths: 12,
  },
];

const seedProducts = async () => {
  try {
    await connectDB();

    const shouldClear = process.argv.includes('--clear');
    if (shouldClear) {
      console.log('[CLEAR] Removing all existing products...');
      await Product.deleteMany({});
      console.log('[CLEAR] All products removed.');
    }

    let created = 0;
    let skipped = 0;

    for (const productData of sampleProducts) {
      const existing = await Product.findOne({ sku: productData.sku });
      if (existing) {
        console.log(`Product '${productData.name}' (${productData.sku}) already exists, skipping...`);
        skipped++;
        continue;
      }

      await Product.create(productData);
      console.log(`Created product: ${productData.name} (${productData.sku}) - Stock: ${productData.stockQuantity}`);
      created++;
    }

    console.log(`\nSeed completed! Created: ${created}, Skipped: ${skipped}`);
  } catch (error) {
    console.error('Product seed failed:', error);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

seedProducts();
