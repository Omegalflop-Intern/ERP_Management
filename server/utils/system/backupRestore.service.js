import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createDatabaseDump = async () => {
  const backupDir = path.join(__dirname, '../../../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const collections = await mongoose.connection.db.listCollections().toArray();
  const dumpData = {};

  for (const coll of collections) {
    const docs = await mongoose.connection.db.collection(coll.name).find({}).toArray();
    dumpData[coll.name] = docs;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(backupDir, `dump_${timestamp}.json`);

  fs.writeFileSync(filePath, JSON.stringify(dumpData, null, 2));

  return {
    success: true,
    fileName: `dump_${timestamp}.json`,
    filePath,
    collectionCount: collections.length,
  };
};

export const listDatabaseDumps = async () => {
  const backupDir = path.join(__dirname, '../../../backups');
  if (!fs.existsSync(backupDir)) return [];
  const files = fs.readdirSync(backupDir);
  return files.filter(f => f.startsWith('dump_') && f.endsWith('.json'));
};
