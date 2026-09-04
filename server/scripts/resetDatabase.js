import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../config/db.knex.js';
import { env } from '../config/env.config.js';
import { runAutoMigrations } from './runMigration.js';
import { seedDefaultRoles } from '../modules/role/role.service.js';
import { seedSubscriptionPlans } from '../modules/plans/plans.service.js';
import { seedDefaultAccounts } from '../modules/accounting/accounting.service.js';
import { seedDefaultsForTenant } from '../modules/settings/settings.service.js';

const SEED_PASSWORD = process.env.SEED_PASSWORD || 'admin123';

const superAdmins = [
  { username: 'salahuddin', email: 'salahuddin@erp.com', phone: '01710000001', fullName: 'Salahuddin (Super Admin)' },
  { username: 'admin2', email: 'admin2@erp.com', phone: '01710000002', fullName: 'Admin Two' },
];

export async function resetAndSeedDatabase() {
  console.log('⚠️ [DB RESET] Starting database wipe & re-initialization...');

  try {
    // 1. Disable FK checks and drop all existing tables
    await db.raw('SET FOREIGN_KEY_CHECKS = 0;');
    const [tables] = await db.raw(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = ?',
      [env.DB_NAME]
    );

    for (const t of tables) {
      const tableName = t.TABLE_NAME || t.table_name;
      if (tableName) {
        console.log(`  🗑️ Dropping table: ${tableName}`);
        await db.raw(`DROP TABLE IF EXISTS \`${tableName}\`;`);
      }
    }
    await db.raw('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('✅ All existing tables dropped.');

    // 2. Re-run all migrations in sequence
    console.log('🔄 Rebuilding database schema with auto migrations...');
    await runAutoMigrations({ verbose: false });
    console.log('✅ All 30 migrations applied successfully!');

    // 3. Seed platform defaults
    console.log('🌱 Seeding initial platform roles & subscription plans...');
    await seedDefaultRoles();
    await seedSubscriptionPlans();
    await seedDefaultAccounts(null);

    const adminRole = await db('roles').where({ name: 'ADMIN' }).first();
    const managerRole = await db('roles').where({ name: 'MANAGER' }).first();
    const cashierRole = await db('roles').where({ name: 'CASHIER' }).first();
    const techRole = await db('roles').where({ name: 'TECHNICIAN' }).first();
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

    // 4. Seed Super Admins (tenant_id: null)
    for (const u of superAdmins) {
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
        tenant_id: null,
      });
      console.log(`  👤 Created Super Admin: ${u.username}`);
    }

    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // ─────────────────────────────────────────────────────────────────────────
    // 5. SEED SHOP 1: OmniGadget Store (Subdomain: 'gadget')
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n🏬 Seeding Shop 1: OmniGadget Store (subdomain: "gadget")...');
    const [shop1Id] = await db('tenants').insert({
      shop_name: 'OmniGadget Store',
      owner_name: 'Salahuddin',
      email: 'salahuddin.gadget@gmail.com',
      phone: '01711111111',
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
      kyc_status: 'APPROVED',
      max_users: 999,
      subdomain: 'gadget',
      custom_domain: null,
      nid_number: '19951234567890123',
      trade_license_number: 'TRAD/DNCC/2026/08912',
      expires_at: oneYearLater,
      is_deleted: false,
    });

    await seedDefaultAccounts(shop1Id);
    await seedDefaultsForTenant(shop1Id, {
      shopName: 'OmniGadget Store',
      phone: '01711111111',
      email: 'support@omnigadget.com',
      address: 'Shop #402, Level 4, Jamuna Future Park, Kuril, Dhaka',
    });

    // Shop 1 Users
    const shop1Users = [
      { username: 'gadgetadmin', email: 'admin@gadget.com', phone: '01711111111', fullName: 'Salahuddin (Shop Owner)', roleId: adminRole.id, roleName: 'ADMIN', designation: 'Shop Owner / CEO', dept: 'Executive', salary: 100000 },
      { username: 'gadgetmanager', email: 'manager@gadget.com', phone: '01711111112', fullName: 'Kamrul Hasan', roleId: managerRole.id, roleName: 'MANAGER', designation: 'Store Manager', dept: 'Management', salary: 45000 },
      { username: 'gadgetcashier', email: 'cashier@gadget.com', phone: '01711111113', fullName: 'Nafis Iqbal', roleId: cashierRole.id, roleName: 'CASHIER', designation: 'POS Cashier', dept: 'Sales', salary: 25000 },
      { username: 'gadgettech', email: 'tech@gadget.com', phone: '01711111114', fullName: 'Tareq Rahman', roleId: techRole.id, roleName: 'TECHNICIAN', designation: 'Lead Service Engineer', dept: 'Support', salary: 35000 },
    ];

    for (let i = 0; i < shop1Users.length; i++) {
      const u = shop1Users[i];
      const [uId] = await db('users').insert({
        tenant_id: shop1Id,
        username: u.username,
        email: u.email,
        phone: u.phone,
        full_name: u.fullName,
        password_hash: passwordHash,
        role_id: u.roleId,
        role_name: u.roleName,
        is_active: true,
        is_verified: true,
        is_deleted: false,
      });

      await db('employees').insert({
        tenant_id: shop1Id,
        user_id: uId,
        employee_id: `OG-EMP-${String(i + 1).padStart(3, '0')}`,
        name: u.fullName,
        phone: u.phone,
        email: u.email,
        designation: u.designation,
        department: u.dept,
        branch: 'Main Branch',
        salary: u.salary,
        joining_date: new Date('2025-01-01'),
        blood_group: 'B+',
        is_active: true,
        is_deleted: false,
      });
    }

    // Shop 1 Catalog Categories
    const shop1Categories = ['Smartphones', 'Audio & Sound', 'Smart Watches', 'Fast Chargers & Cables', 'Power Banks & Accessories'];
    for (const cat of shop1Categories) {
      await db('catalog_items').insert({
        tenant_id: shop1Id,
        name: cat,
        type: 'CATEGORY',
        is_deleted: false,
      });
    }

    // Shop 1 Customers & Suppliers
    const [c1Id] = await db('customers').insert({
      tenant_id: shop1Id,
      name: 'Tanvir Ahmed',
      phone: '01712345678',
      email: 'tanvir@gmail.com',
      address: 'House 14, Road 7, Dhanmondi, Dhaka',
      customer_type: 'INDIVIDUAL',
      total_purchases: 155000,
      due_balance: 0,
      is_deleted: false,
    });
    const [c2Id] = await db('customers').insert({
      tenant_id: shop1Id,
      name: 'Nusrat Jahan',
      phone: '01812345678',
      email: 'nusrat@gmail.com',
      address: 'Road 54, Gulshan 2, Dhaka',
      customer_type: 'INDIVIDUAL',
      total_purchases: 26500,
      due_balance: 0,
      is_deleted: false,
    });

    const [s1Id] = await db('suppliers').insert({
      tenant_id: shop1Id,
      name: 'Apple Authorised BD Distributor',
      phone: '01799887766',
      email: 'supply@appledist-bd.com',
      company: 'Executive Gadgets Ltd.',
      address: 'Motijheel C/A, Dhaka',
      total_purchases: 850000,
      due_balance: 0,
      payment_terms: 'NET_30',
      is_deleted: false,
    });
    const [s2Id] = await db('suppliers').insert({
      tenant_id: shop1Id,
      name: 'Smart Technologies BD',
      phone: '01899887766',
      email: 'sales@smartbd.com',
      company: 'Smart Tech Distribution',
      address: 'BCS Computer City, IDB Bhaban, Dhaka',
      total_purchases: 420000,
      due_balance: 0,
      payment_terms: 'CASH',
      is_deleted: false,
    });

    // Shop 1 Products
    const [p1] = await db('products').insert({
      tenant_id: shop1Id,
      name: 'iPhone 15 Pro Max 256GB',
      brand: 'Apple',
      category: 'Smartphones',
      model: '15 Pro Max',
      sku: 'IPH15PM-256-NT',
      barcode: '195949038291',
      ram: '8GB',
      storage: '256GB',
      color: 'Natural Titanium',
      cost_price: 135000,
      selling_price: 155000,
      wholesale_price: 148000,
      stock_quantity: 8,
      min_stock_alert: 2,
      warranty_months: 12,
      is_active: true,
      is_deleted: false,
    });

    const [p2] = await db('products').insert({
      tenant_id: shop1Id,
      name: 'Samsung Galaxy S24 Ultra 512GB',
      brand: 'Samsung',
      category: 'Smartphones',
      model: 'Galaxy S24 Ultra',
      sku: 'SAM-S24U-512-TB',
      barcode: '8806095350182',
      ram: '12GB',
      storage: '512GB',
      color: 'Titanium Black',
      cost_price: 125000,
      selling_price: 145000,
      wholesale_price: 138000,
      stock_quantity: 6,
      min_stock_alert: 2,
      warranty_months: 12,
      is_active: true,
      is_deleted: false,
    });

    const [p3] = await db('products').insert({
      tenant_id: shop1Id,
      name: 'Apple AirPods Pro (2nd Gen) USB-C',
      brand: 'Apple',
      category: 'Audio & Sound',
      model: 'AirPods Pro 2',
      sku: 'APP2-USBC-WHT',
      barcode: '195949052518',
      color: 'White',
      cost_price: 22000,
      selling_price: 26500,
      wholesale_price: 24500,
      stock_quantity: 15,
      min_stock_alert: 3,
      warranty_months: 12,
      is_active: true,
      is_deleted: false,
    });

    const [p4] = await db('products').insert({
      tenant_id: shop1Id,
      name: 'Anker Prime 65W GaN Fast Wall Charger',
      brand: 'Anker',
      category: 'Fast Chargers & Cables',
      model: 'A2668',
      sku: 'ANK-65W-GAN-BLK',
      barcode: '194644141288',
      color: 'Black',
      cost_price: 2800,
      selling_price: 3900,
      wholesale_price: 3300,
      stock_quantity: 25,
      min_stock_alert: 5,
      warranty_months: 18,
      is_active: true,
      is_deleted: false,
    });

    const [p5] = await db('products').insert({
      tenant_id: shop1Id,
      name: 'Xiaomi Watch 2 Pro (WearOS)',
      brand: 'Xiaomi',
      category: 'Smart Watches',
      model: 'Watch 2 Pro',
      sku: 'XIA-W2P-SLV',
      barcode: '6941812739112',
      color: 'Silver Brown',
      cost_price: 18500,
      selling_price: 22500,
      wholesale_price: 20500,
      stock_quantity: 10,
      min_stock_alert: 2,
      warranty_months: 12,
      is_active: true,
      is_deleted: false,
    });

    // IMEI records for iPhones and Samsungs
    const imeis = [
      { product_id: p1, imei: '358291048291001', color: 'Natural Titanium', storage: '256GB', cost: 135000, sell: 155000 },
      { product_id: p1, imei: '358291048291002', color: 'Natural Titanium', storage: '256GB', cost: 135000, sell: 155000 },
      { product_id: p1, imei: '358291048291003', color: 'Natural Titanium', storage: '256GB', cost: 135000, sell: 155000 },
      { product_id: p2, imei: '359102847192001', color: 'Titanium Black', storage: '512GB', cost: 125000, sell: 145000 },
      { product_id: p2, imei: '359102847192002', color: 'Titanium Black', storage: '512GB', cost: 125000, sell: 145000 },
    ];
    for (const item of imeis) {
      await db('inventory_units').insert({
        tenant_id: shop1Id,
        imei_or_serial: item.imei,
        product_id: item.product_id,
        supplier_id: s1Id,
        status: 'Available',
        purchase_price: item.cost,
        current_selling_price: item.sell,
        warranty_months: 12,
        color: item.color,
        storage: item.storage,
        is_deleted: false,
      });
    }

    // Shop 1 Sample Completed Sale
    await db('transactions').insert({
      tenant_id: shop1Id,
      invoice_number: 'OG-INV-2026-001',
      tx_type: 'SALE',
      sale_type: 'RETAIL',
      status: 'COMPLETED',
      customer_id: c1Id,
      customer_name: 'Tanvir Ahmed',
      customer_phone: '01712345678',
      customer_email: 'tanvir@gmail.com',
      customer_address: 'House 14, Road 7, Dhanmondi, Dhaka',
      line_items: JSON.stringify([
        { productId: p1, name: 'iPhone 15 Pro Max 256GB', sku: 'IPH15PM-256-NT', qty: 1, unitPrice: 155000, totalPrice: 155000, imeiOrSerial: '358291048291099' },
      ]),
      sub_total: 155000,
      discount: 0,
      tax: 0,
      net_total: 155000,
      payment_breakdown: JSON.stringify({ cash: 55000, bank: 100000, dueAmount: 0 }),
      cashier_username: 'gadgetcashier',
      seller_name: 'Nafis Iqbal',
      public_token: crypto.randomBytes(16).toString('hex'),
      is_deleted: false,
    });

    // Shop 1 Expenses
    await db('expenses').insert([
      { tenant_id: shop1Id, title: 'Showroom Monthly Rent (Jamuna Future Park)', category: 'Rent', amount: 35000, payment_method: 'bank', notes: 'Paid via Prime Bank' },
      { tenant_id: shop1Id, title: 'Electricity & Utility Bill', category: 'Utilities', amount: 4500, payment_method: 'bkash', notes: 'DESCO Bill' },
      { tenant_id: shop1Id, title: 'High-speed Fiber Internet (100Mbps)', category: 'Utilities', amount: 1500, payment_method: 'cash', notes: 'Dot Internet' },
    ]);

    // Shop 1 Repair Ticket
    await db('repair_tickets').insert({
      tenant_id: shop1Id,
      ticket_number: 'OG-RPR-1001',
      customer_name: 'Jahid Hassan',
      customer_phone: '01700112233',
      device_model: 'iPhone 13 Pro',
      imei_or_serial: '357192837192004',
      issue_description: 'Display flickering & broken front glass after drop',
      estimated_cost: 14500,
      advance_paid: 5000,
      status: 'IN_PROGRESS',
      technician_name: 'Tareq Rahman',
      is_deleted: false,
    });

    console.log('✅ Shop 1 (OmniGadget Store) seeded successfully.');

    // ─────────────────────────────────────────────────────────────────────────
    // 6. SEED SHOP 2: BytePulse Tech Hub (Subdomain: 'bytepulse')
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n🏬 Seeding Shop 2: BytePulse Tech Hub (subdomain: "bytepulse")...');
    const [shop2Id] = await db('tenants').insert({
      shop_name: 'BytePulse Tech Hub',
      owner_name: 'Rahim Chowdhury',
      email: 'rahim@bytepulse.com',
      phone: '01822222222',
      plan: 'PRO',
      status: 'ACTIVE',
      kyc_status: 'APPROVED',
      max_users: 20,
      subdomain: 'bytepulse',
      custom_domain: null,
      nid_number: '19929876543210987',
      trade_license_number: 'TRAD/DSCC/2026/04519',
      expires_at: oneYearLater,
      is_deleted: false,
    });

    await seedDefaultAccounts(shop2Id);
    await seedDefaultsForTenant(shop2Id, {
      shopName: 'BytePulse Tech Hub',
      phone: '01822222222',
      email: 'support@bytepulse.com',
      address: 'Shop #205, Level 2, Multiplan Center, Elephant Road, Dhaka',
    });

    // Shop 2 Users
    const shop2Users = [
      { username: 'byteadmin', email: 'admin@bytepulse.com', phone: '01822222222', fullName: 'Rahim Chowdhury (Shop Owner)', roleId: adminRole.id, roleName: 'ADMIN', designation: 'Managing Director', dept: 'Executive', salary: 85000 },
      { username: 'bytemanager', email: 'manager@bytepulse.com', phone: '01822222223', fullName: 'Asif Mahmud', roleId: managerRole.id, roleName: 'MANAGER', designation: 'Operations Manager', dept: 'Management', salary: 40000 },
      { username: 'bytecashier', email: 'cashier@bytepulse.com', phone: '01822222224', fullName: 'Mehedi Hasan', roleId: cashierRole.id, roleName: 'CASHIER', designation: 'Store Cashier', dept: 'Sales', salary: 22000 },
    ];

    for (let i = 0; i < shop2Users.length; i++) {
      const u = shop2Users[i];
      const [uId] = await db('users').insert({
        tenant_id: shop2Id,
        username: u.username,
        email: u.email,
        phone: u.phone,
        full_name: u.fullName,
        password_hash: passwordHash,
        role_id: u.roleId,
        role_name: u.roleName,
        is_active: true,
        is_verified: true,
        is_deleted: false,
      });

      await db('employees').insert({
        tenant_id: shop2Id,
        user_id: uId,
        employee_id: `BP-EMP-${String(i + 1).padStart(3, '0')}`,
        name: u.fullName,
        phone: u.phone,
        email: u.email,
        designation: u.designation,
        department: u.dept,
        branch: 'Multiplan Branch',
        salary: u.salary,
        joining_date: new Date('2025-03-01'),
        blood_group: 'A+',
        is_active: true,
        is_deleted: false,
      });
    }

    // Shop 2 Categories
    const shop2Categories = ['Gaming Laptops', 'Mechanical Keyboards', 'Gaming Mice & Pads', 'Headphones & ANC', 'Drones & Action Cameras'];
    for (const cat of shop2Categories) {
      await db('catalog_items').insert({
        tenant_id: shop2Id,
        name: cat,
        type: 'CATEGORY',
        is_deleted: false,
      });
    }

    // Shop 2 Customers & Suppliers
    const [c3Id] = await db('customers').insert({
      tenant_id: shop2Id,
      name: 'Sadman Sakib',
      phone: '01755555555',
      email: 'sadman@gamers.bd',
      address: 'House 32, Road 4, Mirpur DOHS, Dhaka',
      customer_type: 'INDIVIDUAL',
      total_purchases: 36500,
      due_balance: 0,
      is_deleted: false,
    });
    const [c4Id] = await db('customers').insert({
      tenant_id: shop2Id,
      name: 'Mahir Faisal',
      phone: '01855555555',
      email: 'mahir.tech@gmail.com',
      address: 'Block E, Banani, Dhaka',
      customer_type: 'INDIVIDUAL',
      total_purchases: 38500,
      due_balance: 0,
      is_deleted: false,
    });

    const [s3Id] = await db('suppliers').insert({
      tenant_id: shop2Id,
      name: 'Star Tech Import & Distribution',
      phone: '01711223344',
      email: 'corporate@startech.com.bd',
      company: 'Star Tech & Engineering Ltd.',
      address: 'Multiplan Center, Dhaka',
      total_purchases: 950000,
      due_balance: 0,
      payment_terms: 'NET_15',
      is_deleted: false,
    });
    const [s4Id] = await db('suppliers').insert({
      tenant_id: shop2Id,
      name: 'UCC Distribution Bangladesh',
      phone: '01811223344',
      email: 'info@ucc-bd.com',
      company: 'Uni-Cap Computer Ltd.',
      address: 'Eastern Plus Shopping Complex, Dhaka',
      total_purchases: 540000,
      due_balance: 0,
      payment_terms: 'CASH',
      is_deleted: false,
    });

    // Shop 2 Products
    const [bp1] = await db('products').insert({
      tenant_id: shop2Id,
      name: 'ASUS ROG Zephyrus G14 OLED (2024)',
      brand: 'ASUS',
      category: 'Gaming Laptops',
      model: 'GA403UI',
      sku: 'ROG-G14-2024-OLED',
      barcode: '4711387519281',
      ram: '32GB LPDDR5X',
      storage: '1TB NVMe Gen4',
      color: 'Platinum White',
      cost_price: 185000,
      selling_price: 215000,
      wholesale_price: 205000,
      stock_quantity: 4,
      min_stock_alert: 1,
      warranty_months: 24,
      is_active: true,
      is_deleted: false,
    });

    const [bp2] = await db('products').insert({
      tenant_id: shop2Id,
      name: 'Keychron Q1 Pro Wireless Custom Mechanical Keyboard',
      brand: 'Keychron',
      category: 'Mechanical Keyboards',
      model: 'Q1 Pro',
      sku: 'KEY-Q1P-RGB-RED',
      barcode: '4895248831920',
      color: 'Carbon Black',
      cost_price: 16500,
      selling_price: 21000,
      wholesale_price: 19000,
      stock_quantity: 12,
      min_stock_alert: 3,
      warranty_months: 12,
      is_active: true,
      is_deleted: false,
    });

    const [bp3] = await db('products').insert({
      tenant_id: shop2Id,
      name: 'Logitech G PRO X SUPERLIGHT 2 Wireless Mouse',
      brand: 'Logitech G',
      category: 'Gaming Mice & Pads',
      model: 'SUPERLIGHT 2',
      sku: 'LOG-GPX-SL2-MAG',
      barcode: '097855187321',
      color: 'Magenta',
      cost_price: 12000,
      selling_price: 15500,
      wholesale_price: 14000,
      stock_quantity: 18,
      min_stock_alert: 4,
      warranty_months: 24,
      is_active: true,
      is_deleted: false,
    });

    const [bp4] = await db('products').insert({
      tenant_id: shop2Id,
      name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
      brand: 'Sony',
      category: 'Headphones & ANC',
      model: 'WH-1000XM5',
      sku: 'SNY-XM5-SLV',
      barcode: '027242923508',
      color: 'Silver',
      cost_price: 32000,
      selling_price: 38500,
      wholesale_price: 35500,
      stock_quantity: 8,
      min_stock_alert: 2,
      warranty_months: 12,
      is_active: true,
      is_deleted: false,
    });

    const [bp5] = await db('products').insert({
      tenant_id: shop2Id,
      name: 'DJI Mini 4 Pro Drone (Fly More Combo Plus)',
      brand: 'DJI',
      category: 'Drones & Action Cameras',
      model: 'Mini 4 Pro FMC+',
      sku: 'DJI-M4P-FMC-PLS',
      barcode: '190021094821',
      color: 'Gray',
      cost_price: 95000,
      selling_price: 115000,
      wholesale_price: 108000,
      stock_quantity: 5,
      min_stock_alert: 2,
      warranty_months: 12,
      is_active: true,
      is_deleted: false,
    });

    // Serial numbers for ROG laptops
    await db('inventory_units').insert([
      { tenant_id: shop2Id, imei_or_serial: 'ROG-G14-SN-8829101', product_id: bp1, supplier_id: s3Id, status: 'Available', purchase_price: 185000, current_selling_price: 215000, warranty_months: 24, color: 'Platinum White', is_deleted: false },
      { tenant_id: shop2Id, imei_or_serial: 'ROG-G14-SN-8829102', product_id: bp1, supplier_id: s3Id, status: 'Available', purchase_price: 185000, current_selling_price: 215000, warranty_months: 24, color: 'Platinum White', is_deleted: false },
    ]);

    // Shop 2 Sample Completed Sale
    await db('transactions').insert({
      tenant_id: shop2Id,
      invoice_number: 'BP-INV-2026-001',
      tx_type: 'SALE',
      sale_type: 'RETAIL',
      status: 'COMPLETED',
      customer_id: c3Id,
      customer_name: 'Sadman Sakib',
      customer_phone: '01755555555',
      customer_email: 'sadman@gamers.bd',
      customer_address: 'House 32, Road 4, Mirpur DOHS, Dhaka',
      line_items: JSON.stringify([
        { productId: bp2, name: 'Keychron Q1 Pro Custom Keyboard', sku: 'KEY-Q1P-RGB-RED', qty: 1, unitPrice: 21000, totalPrice: 21000 },
        { productId: bp3, name: 'Logitech G PRO X SUPERLIGHT 2', sku: 'LOG-GPX-SL2-MAG', qty: 1, unitPrice: 15500, totalPrice: 15500 },
      ]),
      sub_total: 36500,
      discount: 0,
      tax: 0,
      net_total: 36500,
      payment_breakdown: JSON.stringify({ bkash: 36500, dueAmount: 0 }),
      cashier_username: 'bytecashier',
      seller_name: 'Mehedi Hasan',
      public_token: crypto.randomBytes(16).toString('hex'),
      is_deleted: false,
    });

    // Shop 2 Expenses
    await db('expenses').insert([
      { tenant_id: shop2Id, title: 'Multiplan Shop Rent', category: 'Rent', amount: 28000, payment_method: 'bank', notes: 'Monthly Commercial Rent' },
      { tenant_id: shop2Id, title: 'Dedicated Leased Internet', category: 'Utilities', amount: 2000, payment_method: 'bkash', notes: 'Link3 Technologies' },
    ]);

    console.log('✅ Shop 2 (BytePulse Tech Hub) seeded successfully.');

    // ─────────────────────────────────────────────────────────────────────────
    // SUMMARY
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n===============================================================');
    console.log('🎉 DATABASE RESET & MULTI-TENANT SEEDING COMPLETE!');
    console.log('===============================================================');
    console.log(`🔑 Master Password for all seeded users: ${SEED_PASSWORD}\n`);
    console.log('👑 1. SUPER ADMIN (Platform Manager):');
    console.log('   • URL:      http://localhost:3000/login');
    console.log('   • Username: salahuddin (or admin2)');
    console.log('   • Password: ' + SEED_PASSWORD);
    console.log('\n🏬 2. SHOP 1 - OmniGadget Store:');
    console.log('   • Subdomain URL: http://gadget.localhost:3000/login');
    console.log('   • Admin:         gadgetadmin   / ' + SEED_PASSWORD);
    console.log('   • Manager:       gadgetmanager / ' + SEED_PASSWORD);
    console.log('   • Cashier:       gadgetcashier / ' + SEED_PASSWORD);
    console.log('   • Tech:          gadgettech    / ' + SEED_PASSWORD);
    console.log('\n🏬 3. SHOP 2 - BytePulse Tech Hub:');
    console.log('   • Subdomain URL: http://bytepulse.localhost:3000/login');
    console.log('   • Admin:         byteadmin     / ' + SEED_PASSWORD);
    console.log('   • Manager:       bytemanager   / ' + SEED_PASSWORD);
    console.log('   • Cashier:       bytecashier   / ' + SEED_PASSWORD);
    console.log('===============================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Database reset & seed failed:', err);
    process.exit(1);
  }
}

resetAndSeedDatabase();
