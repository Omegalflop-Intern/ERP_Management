import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { restoreDatabaseDump, listDatabaseDumps } from '../utils/system/backupRestore.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile_shop_erp';

async function run() {
  try {
    const backupDir = path.join(__dirname, '../../backups');
    const targetArg = process.argv[2];

    let targetFile = targetArg;

    if (!targetFile) {
      const dumps = await listDatabaseDumps();
      // Pick the largest/latest valid dump (ignoring small empty dumps if possible)
      const validDumps = dumps.map(f => {
        const p = path.join(backupDir, f);
        const stat = fs.statSync(p);
        return { name: f, size: stat.size };
      }).sort((a, b) => b.size - a.size);

      if (validDumps.length === 0) {
        console.error('No backup dump files found in backups/ directory!');
        process.exit(1);
      }

      targetFile = validDumps[0].name;
      console.log(`No backup file specified. Automatically selected largest backup dump: ${targetFile} (${targetFile ? (validDumps[0].size / 1024).toFixed(1) : 0} KB)`);
    }

    console.log('Connecting to MongoDB...', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected! Restoring database JSON dump...');

    const result = await restoreDatabaseDump(targetFile);

    console.log('\n✅ RESTORE SUCCESSFUL!');
    console.log('-------------------------------------------');
    console.log('Backup File Restored:', result.filePath);
    console.log('Collections Restored:', result.restoredCollectionsCount);
    console.log('Total Documents Restored:', result.restoredTotalDocs);
    console.log('-------------------------------------------\n');
  } catch (err) {
    console.error('❌ Restore failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
