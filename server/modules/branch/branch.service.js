import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';

export function formatBranch(row, managerRow = null) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    name: row.name,
    address: row.address || '',
    phone: row.phone || '',
    email: row.email || '',
    manager: managerRow ? {
      _id: String(managerRow.id),
      id: managerRow.id,
      fullName: managerRow.full_name || '',
      username: managerRow.username,
    } : (row.manager_id ? String(row.manager_id) : null),
    isActive: Boolean(row.is_active),
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId) {
  if (tenantId) {
    query.where('branches.tenant_id', tenantId);
  }
}

export const getAllBranches = async (page = 1, limit = 50, tenantId = null) => {
  const countQuery = db('branches').where('branches.is_deleted', false);
  applyTenantScope(countQuery, tenantId);
  const countResult = await countQuery.count({ total: '*' }).first();
  const total = Number(countResult?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('branches')
    .leftJoin('users', 'branches.manager_id', 'users.id')
    .where('branches.is_deleted', false)
    .select(
      'branches.*',
      'users.id as mgr_id',
      'users.full_name as mgr_full_name',
      'users.username as mgr_username'
    );
  applyTenantScope(dataQuery, tenantId);

  const rows = await dataQuery.orderBy('branches.created_at', 'desc').limit(limit).offset(offset);

  const branches = rows.map((row) => {
    const mgr = row.mgr_id ? { id: row.mgr_id, full_name: row.mgr_full_name, username: row.mgr_username } : null;
    return formatBranch(row, mgr);
  });

  return { branches, pagination: getPagination(total, page, limit) };
};

export const getAllBranchesFlat = async (tenantId = null) => {
  const query = db('branches').where({ 'branches.is_deleted': false, 'branches.is_active': true });
  applyTenantScope(query, tenantId);
  const rows = await query.orderBy('branches.name', 'asc').select('branches.id', 'branches.name', 'branches.address');
  return rows.map((r) => formatBranch(r));
};

export const getBranchById = async (id, tenantId = null) => {
  const dataQuery = db('branches')
    .leftJoin('users', 'branches.manager_id', 'users.id')
    .where({ 'branches.id': id, 'branches.is_deleted': false })
    .select(
      'branches.*',
      'users.id as mgr_id',
      'users.full_name as mgr_full_name',
      'users.username as mgr_username'
    );
  applyTenantScope(dataQuery, tenantId);

  const row = await dataQuery.first();
  if (!row) throw ApiError.notFound('Branch not found');

  const mgr = row.mgr_id ? { id: row.mgr_id, full_name: row.mgr_full_name, username: row.mgr_username } : null;
  return formatBranch(row, mgr);
};

export const createBranch = async (data, tenantId = null) => {
  const effectiveTenantId = tenantId || data.tenantId || null;
  if (effectiveTenantId) {
    const tenant = await db('tenants').where({ id: effectiveTenantId }).select('max_branches', 'plan').first();
    if (tenant) {
      const countRes = await db('branches').where({ tenant_id: effectiveTenantId, is_deleted: false }).count({ count: '*' }).first();
      const currentCount = Number(countRes?.count || 0);
      const limit = tenant.max_branches || 2;
      if (currentCount >= limit) {
        throw ApiError.forbidden(
          `Your plan (${tenant.plan || 'STARTER'}) allows a maximum of ${limit} branch${limit === 1 ? '' : 'es'}. Please upgrade your subscription.`
        );
      }
    }
  }

  const existingQuery = db('branches').where({ is_deleted: false }).whereRaw('LOWER(name) = ?', [data.name.toLowerCase()]);
  applyTenantScope(existingQuery, effectiveTenantId);
  const existing = await existingQuery.first();
  if (existing) throw ApiError.conflict(`Branch "${data.name}" already exists`);

  const [insertedId] = await db('branches').insert({
    tenant_id: effectiveTenantId,
    name: data.name,
    address: data.address || '',
    phone: data.phone || '',
    email: data.email || '',
    manager_id: data.manager || data.managerId || null,
    is_active: data.isActive !== undefined ? Boolean(data.isActive) : true,
    is_deleted: false,
  });

  return getBranchById(insertedId, effectiveTenantId);
};

export const updateBranch = async (id, data, tenantId = null) => {
  const branch = await getBranchById(id, tenantId);
  if (!branch) throw ApiError.notFound('Branch not found');

  const updateFields = {};
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.address !== undefined) updateFields.address = data.address;
  if (data.phone !== undefined) updateFields.phone = data.phone;
  if (data.email !== undefined) updateFields.email = data.email;
  if (data.manager !== undefined) updateFields.manager_id = data.manager;
  if (data.managerId !== undefined) updateFields.manager_id = data.managerId;
  if (data.isActive !== undefined) updateFields.is_active = Boolean(data.isActive);

  if (Object.keys(updateFields).length > 0) {
    const q = db('branches').where({ id });
    if (tenantId) q.andWhere('tenant_id', tenantId);
    await q.update(updateFields);
  }

  return getBranchById(id, tenantId);
};

export const deleteBranch = async (id, tenantId = null) => {
  const branch = await getBranchById(id, tenantId);
  if (!branch) throw ApiError.notFound('Branch not found');

  const delQ = db('branches').where({ id });
  if (tenantId) delQ.andWhere('tenant_id', tenantId);
  await delQ.update({ is_deleted: true });
  return { ...branch, isDeleted: true };
};
