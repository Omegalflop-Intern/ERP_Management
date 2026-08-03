import { Settings } from './settings.model.js';

export const getAllSettings = async (category, tenantId = null) => {
  const query = {};
  if (category) query.category = category;

  if (tenantId) {
    // Fetch both global (tenantId: null) and tenant-specific settings.
    // Tenant-specific values override global ones when the same key exists for both.
    const globalQuery = { ...query, tenantId: null };
    const tenantQuery = { ...query, tenantId };

    const [globalSettings, tenantSettings] = await Promise.all([
      Settings.find(globalQuery).sort({ key: 1 }),
      Settings.find(tenantQuery).sort({ key: 1 }),
    ]);

    // Build merged map: global first, then tenant overrides
    const result = {};
    globalSettings.forEach(s => { result[s.key] = s.value; });
    tenantSettings.forEach(s => { result[s.key] = s.value; }); // tenant overrides global
    return result;
  }

  // Super admin (no tenantId) — return only global settings
  const settings = await Settings.find({ ...query, tenantId: null }).sort({ key: 1 });
  const result = {};
  settings.forEach(s => { result[s.key] = s.value; });
  return result;
};

export const getSettingsArray = async (category, tenantId = null) => {
  const query = {};
  if (category) query.category = category;
  if (tenantId) {
    // Return tenant-specific rows; caller merges with global if needed
    return Settings.find({ ...query, tenantId }).sort({ key: 1 });
  }
  return Settings.find({ ...query, tenantId: null }).sort({ key: 1 });
};

export const updateSettings = async (updates, userId, tenantId = null) => {
  const results = [];
  for (const [key, value] of Object.entries(updates)) {
    if (tenantId) {
      // Always upsert a tenant-scoped row — never touch the global default
      const setting = await Settings.findOneAndUpdate(
        { key, tenantId },
        { $set: { value, updatedBy: userId, tenantId } },
        { upsert: true, new: true }
      );
      results.push(setting);
    } else {
      // Super admin updating global defaults (tenantId = null)
      const setting = await Settings.findOneAndUpdate(
        { key, tenantId: null },
        { $set: { value, updatedBy: userId, tenantId: null } },
        { upsert: true, new: true }
      );
      results.push(setting);
    }
  }
  return results;
};

export const getSetting = async (key, tenantId = null) => {
  if (tenantId) {
    // Prefer tenant-specific, fall back to global
    const tenantSetting = await Settings.findOne({ key, tenantId });
    if (tenantSetting) return tenantSetting.value;
    const globalSetting = await Settings.findOne({ key, tenantId: null });
    return globalSetting?.value;
  }
  const s = await Settings.findOne({ key, tenantId: null });
  return s?.value;
};

import mongoose from 'mongoose';
import { ApiError } from '../../utils/http/ApiError.js';

export const exportDatabaseBackup = async () => {
  const collections = await mongoose.connection.db.listCollections().toArray();
  const backupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    system: 'Mobile Shop ERP',
    collections: {},
  };

  for (const coll of collections) {
    const name = coll.name;
    if (name.startsWith('system.')) continue;
    const docs = await mongoose.connection.db.collection(name).find({}).toArray();
    backupData.collections[name] = docs;
  }

  return backupData;
};

const ALLOWED_RESTORE_COLLECTIONS = [
  'users', 'roles', 'products', 'inventoryunits', 'sales', 'saleitems',
  'invoices', 'payments', 'suppliers', 'purchaseorders', 'purchaseitems',
  'customers', 'customerdues', 'employees', 'attendances', 'leaves',
  'payrolls', 'accounts', 'journalentries', 'expenses', 'warranties',
  'wholesaleorders', 'wholesaleprices', 'notifications', 'settings',
  'auditlogs', 'branches', 'catalogitems', 'imeiunits', 'stocktransfers',
  'repairs', 'investors', 'loans',
];

const MAX_BACKUP_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export const restoreDatabaseBackup = async (backupData) => {
  if (!backupData || typeof backupData !== 'object' || !backupData.collections) {
    throw ApiError.badRequest('Invalid database backup file format');
  }

  const jsonSize = JSON.stringify(backupData).length;
  if (jsonSize > MAX_BACKUP_SIZE_BYTES) {
    throw ApiError.badRequest('Backup file too large (max 50MB)');
  }

  const collections = backupData.collections;
  let restoredCount = 0;

  for (const [name, docs] of Object.entries(collections)) {
    if (!ALLOWED_RESTORE_COLLECTIONS.includes(name)) continue;
    if (!Array.isArray(docs) || docs.length === 0) continue;

    const coll = mongoose.connection.db.collection(name);
    await coll.deleteMany({});

    const parsedDocs = docs.map(doc => {
      const cleanDoc = { ...doc };
      if (cleanDoc._id && typeof cleanDoc._id === 'string' && cleanDoc._id.length === 24) {
        cleanDoc._id = new mongoose.Types.ObjectId(cleanDoc._id);
      }
      return cleanDoc;
    });

    await coll.insertMany(parsedDocs);
    restoredCount += parsedDocs.length;
  }

  return { restoredCount, collectionsCount: Object.keys(collections).length };
};

import fs from 'fs';
import path from 'path';

// Weekly auto-backup — runs once every 7 days.
// Guard flag prevents duplicate intervals when --watch restarts the module.
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

  // Keep only the last 8 weekly backups
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('auto_backup_'))
    .sort();
  if (files.length > 8) {
    for (const old of files.slice(0, files.length - 8)) {
      fs.unlinkSync(path.join(backupDir, old));
    }
  }

  console.log(`[AUTO-BACKUP] Backup saved: backups/${filename}`);
  return filename;
};

export const initAutoBackup = () => {
  if (_autoBackupInitialised) {
    console.log('[AUTO-BACKUP] Scheduler already running — skipping duplicate init.');
    return;
  }
  _autoBackupInitialised = true;

  const WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Schedule the first run for 7 days from now, then repeat weekly.
  // No immediate run on startup — backups only happen on the schedule or via the manual button.
  setInterval(async () => {
    try {
      await runManualBackup();
    } catch (err) {
      console.error('[AUTO-BACKUP] Weekly auto-backup failed:', err.message);
    }
  }, WEEK_MS);

  console.log('[AUTO-BACKUP] Weekly backup scheduler started. Next backup in 7 days.');
};

