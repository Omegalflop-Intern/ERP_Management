import { db } from '../../config/db.knex.js';
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

  // Fetch all tables from MySQL database
  const tablesResult = await db.raw('SHOW TABLES');
  const tableKey = Object.keys(tablesResult[0][0] || {})[0];
  const tables = tablesResult[0].map(row => row[tableKey]);

  const dumpData = {};

  for (const tableName of tables) {
    const rows = await db(tableName).select('*');
    dumpData[tableName] = rows;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(backupDir, `dump_${timestamp}.json`);

  fs.writeFileSync(filePath, JSON.stringify(dumpData, null, 2));

  return {
    success: true,
    fileName: `dump_${timestamp}.json`,
    filePath,
    collectionCount: tables.length,
  };
};

export const listDatabaseDumps = async () => {
  const backupDir = path.join(__dirname, '../../../backups');
  if (!fs.existsSync(backupDir)) return [];
  const files = fs.readdirSync(backupDir);
  return files.filter(f => f.startsWith('dump_') && f.endsWith('.json'));
};
