import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import fs from 'fs';
import path from 'path';

export const defaultSettings = [
  { key: 'companyName', value: 'OmniManage Store', category: 'company' },
  { key: 'companySlogan', value: 'Your Trusted Mobile & Electronics ERP', category: 'company' },
  { key: 'companyAddress', value: 'Dhanmondi, Dhaka, Bangladesh', category: 'company' },
  { key: 'companyPhone', value: '+880 1700-000000', category: 'company' },
  { key: 'companyEmail', value: 'sales@omnimanage.bd', category: 'company' },
  { key: 'companyLogo', value: '', category: 'company' },
  { key: 'binVat', value: 'BIN: 004829103-0101', category: 'company' },
  { key: 'currency', value: 'BDT', category: 'finance' },
  { key: 'currencySymbol', value: '৳', category: 'finance' },
  { key: 'defaultVatRate', value: 15, category: 'finance' },
  { key: 'taxEnabled', value: false, category: 'finance' },
  { key: 'lowStockThreshold', value: 5, category: 'inventory' },
  { key: 'autoReorderEnabled', value: false, category: 'inventory' },
  { key: 'defaultWarrantyMonths', value: 12, category: 'warranty' },
  { key: 'invoiceFooter', value: 'Thank you for shopping with us!', category: 'invoice' },
  { key: 'invoiceTerms', value: '1. Original receipt & intact IMEI sticker required for warranty claims. 2. Software, liquid or physical damage excluded.', category: 'invoice' },
  { key: 'printEngine', value: 'VECTOR', category: 'printing' },
  { key: 'printerProfiles', value: [
      { name: 'Default A4', paper: 'A4', autoPrint: false, copies: 1 },
      { name: 'Thermal Counter', paper: '80mm', autoHeight: true, copies: 1 },
    ], category: 'printing' },
  { key: 'receiptMaker', value: { paperSize: '80mm', showLogo: true, customHeader: 'Welcome to Mobile Shop', customFooter: 'Warranty valid for 12 months with invoice.' }, category: 'printing' },
  { key: 'approvalRules', value: { maxExpenseWithoutApproval: 5000, maxDiscountWithoutApproval: 1000 }, category: 'security' },
  { key: 'timezone', value: 'Asia/Dhaka', category: 'system' },
  { key: 'dateFormat', value: 'YYYY-MM-DD', category: 'system' },
  { key: 'platformName', value: 'OmniManage ERP', category: 'platform' },
  { key: 'platformPhone', value: '+880 1700-000000', category: 'platform' },
  { key: 'platformWhatsApp', value: '+880 1700-000000', category: 'platform' },
  { key: 'platformEmail', value: 'support@omnimanage.bd', category: 'platform' },
  { key: 'platformAddress', value: 'Dhanmondi, Dhaka - 1209, Bangladesh', category: 'platform' },
  { key: 'platformSocials', value: { facebook: 'https://facebook.com/omnimanage', twitter: 'https://x.com/omnimanage', linkedin: 'https://linkedin.com/company/omnimanage', youtube: 'https://youtube.com/@omnimanage', instagram: 'https://instagram.com/omnimanage' }, category: 'platform' },
];

export const getPublicSettings = async () => {
  const globalRows = await db('settings').where({ tenant_id: null });
  const result = {
    platformName: 'OmniManage ERP',
    platformPhone: '+880 1700-000000',
    platformWhatsApp: '+880 1700-000000',
    platformEmail: 'support@omnimanage.bd',
    platformAddress: 'Dhanmondi, Dhaka - 1209, Bangladesh',
    platformSocials: {
      facebook: 'https://facebook.com/omnimanage',
      twitter: 'https://x.com/omnimanage',
      linkedin: 'https://linkedin.com/company/omnimanage',
      youtube: 'https://youtube.com/@omnimanage',
      instagram: 'https://instagram.com/omnimanage',
    },
    activationInstructions: 'Thank you for registering your shop! Please contact our platform support team to activate your shop outlet.',
    bkashNumber: '01700000000',
    nagadNumber: '01700000000',
  };

  globalRows.forEach((s) => {
    result[s.key] = parseValue(s.value);
  });
  return result;
};

export const updatePlatformSettings = async (updates) => {
  for (const [key, value] of Object.entries(updates)) {
    const existing = await db('settings').where({ key, tenant_id: null }).first();
    if (existing) {
      await db('settings').where({ id: existing.id }).update({
        value: JSON.stringify(value),
        updated_at: db.fn.now(),
      });
    } else {
      await db('settings').insert({
        tenant_id: null,
        key,
        value: JSON.stringify(value),
        category: 'platform',
      });
    }
  }
  return getPublicSettings();
};

export const seedDefaults = async () => {
  for (const s of defaultSettings) {
    const existing = await db('settings').where({ key: s.key, tenant_id: null }).first();
    if (!existing) {
      await db('settings').insert({
        tenant_id: null,
        key: s.key,
        value: JSON.stringify(s.value),
        category: s.category,
      });
    }
  }
};

export const seedDefaultsForTenant = async (tenantId, shopName) => {
  if (!tenantId) return;
  for (const s of defaultSettings) {
    const existing = await db('settings').where({ key: s.key, tenant_id: tenantId }).first();
    if (!existing) {
      const val = s.key === 'companyName' && shopName ? shopName : s.value;
      await db('settings').insert({
        tenant_id: tenantId,
        key: s.key,
        value: JSON.stringify(val),
        category: s.category,
      });
    }
  }
};

function parseValue(val) {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
}

export const getAllSettings = async (category, tenantId = null) => {
  let query = db('settings');
  if (category) query = query.where({ category });

  if (tenantId) {
    const globalRows = await db('settings').where({ tenant_id: null }).where(category ? { category } : {}).orderBy('key', 'asc');
    const tenantRows = await db('settings').where({ tenant_id: tenantId }).where(category ? { category } : {}).orderBy('key', 'asc');

    const result = {};
    globalRows.forEach(s => { result[s.key] = parseValue(s.value); });
    tenantRows.forEach(s => { result[s.key] = parseValue(s.value); });
    return result;
  }

  const globalRows = await db('settings').where({ tenant_id: null }).where(category ? { category } : {}).orderBy('key', 'asc');
  const result = {};
  globalRows.forEach(s => { result[s.key] = parseValue(s.value); });
  return result;
};

export const getSettingsArray = async (category, tenantId = null) => {
  const query = db('settings').where({ tenant_id: tenantId || null });
  if (category) query.where({ category });
  const rows = await query.orderBy('key', 'asc');
  return rows.map(r => ({
    _id: String(r.id),
    id: r.id,
    tenantId: r.tenant_id,
    key: r.key,
    value: parseValue(r.value),
    category: r.category,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
};

export const updateSettings = async (updates, userId, tenantId = null) => {
  const results = [];
  for (const [key, value] of Object.entries(updates)) {
    const targetTenantId = tenantId || null;
    const existing = await db('settings').where({ key, tenant_id: targetTenantId }).first();

    if (existing) {
      await db('settings').where({ id: existing.id }).update({
        value: JSON.stringify(value),
        updated_by: userId || null,
      });
    } else {
      await db('settings').insert({
        tenant_id: targetTenantId,
        key,
        value: JSON.stringify(value),
        category: 'general',
        updated_by: userId || null,
      });
    }

    const updated = await db('settings').where({ key, tenant_id: targetTenantId }).first();
    results.push({
      _id: String(updated.id),
      id: updated.id,
      tenantId: updated.tenant_id,
      key: updated.key,
      value: parseValue(updated.value),
      category: updated.category,
      updatedBy: updated.updated_by,
    });
  }
  return results;
};

export const getSetting = async (key, tenantId = null) => {
  if (tenantId) {
    const tenantSetting = await db('settings').where({ key, tenant_id: tenantId }).first();
    if (tenantSetting) return parseValue(tenantSetting.value);

    const globalSetting = await db('settings').where({ key, tenant_id: null }).first();
    return globalSetting ? parseValue(globalSetting.value) : undefined;
  }

  const globalSetting = await db('settings').where({ key, tenant_id: null }).first();
  return globalSetting ? parseValue(globalSetting.value) : undefined;
};

export const exportDatabaseBackup = async (tenantId = null) => {
  const tables = ['roles', 'tenants', 'subscription_plans', 'temp_admins', 'users', 'sessions', 'branches', 'settings'];
  const backupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    system: 'Mobile Shop ERP',
    tables: {},
  };

  for (const table of tables) {
    const hasTable = await db.schema.hasTable(table);
    if (hasTable) {
      let q = db(table).select('*');
      if (tenantId) q = q.where('tenant_id', tenantId);
      const rows = await q;
      backupData.tables[table] = rows;
    }
  }

  return backupData;
};

let _autoBackupInitialised = false;

export const runManualBackup = async () => {
  const backupData = await exportDatabaseBackup();
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `auto_backup_${dateStr}.json`;
  const filePath = path.join(backupDir, filename);
  const latestPath = path.join(backupDir, 'latest_auto_backup.json');

  const jsonStr = JSON.stringify(backupData, null, 2);
  fs.writeFileSync(filePath, jsonStr, 'utf-8');
  fs.writeFileSync(latestPath, jsonStr, 'utf-8');

  return filename;
};

export const listServerBackups = async () => {
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) return [];
  const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.json'));
  return files.map((filename) => {
    const stats = fs.statSync(path.join(backupDir, filename));
    return {
      filename,
      sizeBytes: stats.size,
      sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
      createdAt: stats.birthtime || stats.mtime,
    };
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const initAutoBackup = () => {
  if (_autoBackupInitialised) return;
  _autoBackupInitialised = true;
};
