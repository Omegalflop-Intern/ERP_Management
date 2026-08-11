import { db } from '../../config/db.knex.js';

/**
 * Runs a callback inside a Knex MySQL transaction.
 */
export const runInTransaction = async (callback) => {
  return db.transaction(async (trx) => {
    return callback(trx);
  });
};
