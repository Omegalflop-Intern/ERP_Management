import db from '../config/db.config.js';

/**
 * Scoped read: fetches a single row by id, filtered by tenant_id if provided.
 * Returns undefined if not found.
 */
export const scopedFind = (table, { id, tenantId }) => {
  const q = db(table).where({ id }).whereNull('deleted_at');
  if (tenantId) q.andWhere('tenant_id', tenantId);
  return q.first();
};

/**
 * Scoped update: updates a row by id, filtered by tenant_id if provided.
 */
export const scopedUpdate = (table, { id, tenantId }, fields) => {
  const q = db(table).where({ id });
  if (tenantId) q.andWhere('tenant_id', tenantId);
  return q.update(fields);
};

/**
 * Scoped soft-delete: sets deleted_at on a row by id, filtered by tenant_id if provided.
 */
export const scopedSoftDelete = (table, { id, tenantId }, deletedAt = new Date()) => {
  const q = db(table).where({ id });
  if (tenantId) q.andWhere('tenant_id', tenantId);
  return q.update({ deleted_at: deletedAt, is_deleted: true });
};

/**
 * Scoped increment: increments a column on a row by id, filtered by tenant_id if provided.
 */
export const scopedIncrement = (table, { id, tenantId }, column, amount = 1) => {
  const q = db(table).where({ id });
  if (tenantId) q.andWhere('tenant_id', tenantId);
  return q.increment(column, amount);
};

/**
 * Scoped decrement: decrements a column on a row by id, filtered by tenant_id if provided.
 */
export const scopedDecrement = (table, { id, tenantId }, column, amount = 1) => {
  const q = db(table).where({ id });
  if (tenantId) q.andWhere('tenant_id', tenantId);
  return q.decrement(column, amount);
};
