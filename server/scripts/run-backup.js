import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createDatabaseDump } from '../utils/system/backupRestore.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile_shop_erp';

async function run() {
  try {
    console.log('Connecting to MongoDB...', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected! Creating database JSON dump...');
    const result = await createDatabaseDump();
    console.log('SUCCESS! Backup generated at:', result.filePath);
    console.log('Total collections backed up:', result.collectionCount);
  } catch (err) {
    console.error('Backup error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
