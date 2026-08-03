import mongoose from 'mongoose';
import { Settings } from '../modules/settings/settings.model.js';

const fixSettings = async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/mobile_shop_erp');
  const settings = mongoose.connection.db.collection('settings');

  const allDocs = await settings.find({}).toArray();
  console.log('Total settings docs:', allDocs.length);

  const keyCounts = {};
  allDocs.forEach(d => { keyCounts[d.key] = (keyCounts[d.key] || 0) + 1; });
  const duplicates = Object.entries(keyCounts).filter(([, v]) => v > 1);
  console.log('Duplicate keys:', duplicates.length > 0 ? duplicates : 'None');

  // Remove docs where tenantId is truly missing (not null)
  const result = await settings.deleteMany({ tenantId: { $exists: false } });
  console.log('Removed docs with missing tenantId:', result.deletedCount);

  // Re-seed defaults (now sets tenantId: null explicitly)
  await Settings.seedDefaults();
  console.log('Defaults re-seeded');

  const finalDocs = await settings.find({}).toArray();
  console.log('Final settings count:', finalDocs.length);

  await mongoose.disconnect();
};

fixSettings();
