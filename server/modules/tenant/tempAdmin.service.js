import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import crypto from 'crypto';

const generatePassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const symbols = '@#$%&*';
  let pass = 'Temp' + symbols[Math.floor(Math.random() * symbols.length)];
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
};

const generateUsername = (shopName) => {
  const slug = shopName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 15);
  const rand = crypto.randomBytes(2).toString('hex');
  return `support_${slug}_${rand}`;
};

function formatTempAdmin(row) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    createdBy: row.created_by,
    reason: row.reason || '',
    duration: Number(row.duration),
    expiresAt: row.expires_at,
    status: row.status,
    lastLoginAt: row.last_login_at || null,
    revokedAt: row.revoked_at || null,
    revokedBy: row.revoked_by || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const createTempAdmin = async ({ tenantId, duration, reason, createdBy }) => {
  const tenant = await db('tenants').where({ id: tenantId, is_deleted: false }).first();
  if (!tenant) throw ApiError.notFound('Shop not found');

  const username = generateUsername(tenant.shop_name);
  const password = generatePassword();

  const expiresAt = new Date(Date.now() + Number(duration));

  const [insertedId] = await db('temp_admins').insert({
    tenant_id: tenantId,
    user_id: 1, // placeholder until User module migration
    created_by: createdBy || 1,
    reason: reason || '',
    duration: Number(duration),
    expires_at: expiresAt,
    status: 'ACTIVE',
  });

  return {
    tempAdminId: String(insertedId),
    id: insertedId,
    username,
    password,
    expiresAt,
    shopName: tenant.shop_name,
  };
};

export const getActiveTempAdmins = async (tenantId) => {
  const rows = await db('temp_admins')
    .where({ tenant_id: tenantId, status: 'ACTIVE' })
    .where('expires_at', '>', new Date())
    .orderBy('created_at', 'desc');
  return rows.map(formatTempAdmin);
};

export const getAllActiveTempAdmins = async () => {
  const rows = await db('temp_admins')
    .where({ status: 'ACTIVE' })
    .where('expires_at', '>', new Date())
    .orderBy('created_at', 'desc');
  return rows.map(formatTempAdmin);
};

export const revokeTempAdmin = async (tempAdminId, revokedBy) => {
  const row = await db('temp_admins').where({ id: tempAdminId }).first();
  if (!row) throw ApiError.notFound('Temp admin not found');
  if (row.status !== 'ACTIVE') throw ApiError.badRequest('Already expired or revoked');

  await db('temp_admins').where({ id: tempAdminId }).update({
    status: 'REVOKED',
    revoked_at: new Date(),
    revoked_by: revokedBy || null,
  });

  const updated = await db('temp_admins').where({ id: tempAdminId }).first();
  return formatTempAdmin(updated);
};

export const cleanupExpiredTempAdmins = async () => {
  const count = await db('temp_admins')
    .where({ status: 'ACTIVE' })
    .where('expires_at', '<', new Date())
    .update({ status: 'EXPIRED' });
  return count;
};
