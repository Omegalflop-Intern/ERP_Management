import knex from 'knex';
import { env } from './env.config.js';

export const db = knex({
  client: 'mysql2',
  connection: {
    host: env.DB_HOST || 'localhost',
    port: env.DB_PORT && Number(env.DB_PORT) ? Number(env.DB_PORT) : 3306,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
    dateStrings: true,
  },
  pool: {
    min: 2,
    max: 20,
  },
  useNullAsDefault: true,
});

export async function checkDbConnection() {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Connected to MySQL/MariaDB database');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MySQL/MariaDB:', error.message);
    return false;
  }
}
