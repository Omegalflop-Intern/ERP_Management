import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';

export const ALL_PERMISSIONS = [
  'dashboard:view',
  'sales:view', 'sales:create', 'sales:delete',
  'products:view', 'products:create', 'products:edit', 'products:delete',
  'categories:view', 'categories:manage',
  'inventory:view', 'inventory:manage',
  'stock:view', 'stock:transfer',
  'customers:view', 'customers:manage',
  'suppliers:view', 'suppliers:manage',
  'purchases:view', 'purchases:manage',
  'accounting:view', 'accounting:manage',
  'employees:view', 'employees:manage',
  'attendance:view', 'attendance:manage',
  'leaves:view', 'leaves:manage',
  'payroll:view', 'payroll:manage',
  'repairs:view', 'repairs:manage',
  'warranties:view', 'warranties:manage',
  'wholesale:view', 'wholesale:manage',
  'notifications:view', 'notifications:manage',
  'reports:view',
  'users:view', 'users:manage',
  'roles:view', 'roles:manage',
  'branches:view', 'branches:manage',
  'settings:view', 'settings:manage',
  'tickets:view', 'tickets:manage',
];

function formatRole(row) {
  if (!row) return null;
  let permissions = row.permissions;
  if (typeof permissions === 'string') {
    try {
      permissions = JSON.parse(permissions);
    } catch {
      permissions = [];
    }
  }
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    name: row.name,
    displayName: row.display_name,
    description: row.description || '',
    permissions: Array.isArray(permissions) ? permissions : [],
    isSystem: Boolean(row.is_system),
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId) {
  if (tenantId) {
    query.where(function () {
      this.where('tenant_id', tenantId).orWhere(function () {
        this.whereNull('tenant_id').andWhere('is_system', true);
      });
    });
  }
}

export const getAllRoles = async (page = 1, limit = 50, tenantId = null) => {
  const countQuery = db('roles').where('is_deleted', false);
  applyTenantScope(countQuery, tenantId);
  const countResult = await countQuery.count({ total: '*' }).first();
  const total = Number(countResult?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('roles').where('is_deleted', false);
  applyTenantScope(dataQuery, tenantId);
  const rows = await dataQuery.orderBy('created_at', 'desc').limit(limit).offset(offset);

  const roles = rows.map(formatRole);
  return { roles, pagination: getPagination(total, page, limit) };
};

export const getAllRolesFlat = async (tenantId = null) => {
  const query = db('roles').where('is_deleted', false);
  applyTenantScope(query, tenantId);
  const rows = await query.orderBy('name', 'asc').select('id', 'name', 'display_name', 'permissions');
  return rows.map(formatRole);
};

export const getRoleById = async (id, tenantId = null) => {
  const query = db('roles').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId);
  const row = await query.first();
  if (!row) throw ApiError.notFound('Role not found');
  return formatRole(row);
};

export const getRoleByName = async (name, tenantId = null) => {
  const query = db('roles').where({ name: name.toUpperCase(), is_deleted: false });
  applyTenantScope(query, tenantId);
  const row = await query.first();
  return formatRole(row);
};

export const createRole = async (data) => {
  const upperName = data.name.toUpperCase();
  const nameQuery = db('roles').where({ name: upperName, is_deleted: false });
  applyTenantScope(nameQuery, data.tenantId || null);
  const existing = await nameQuery.first();
  if (existing) throw ApiError.conflict(`Role "${data.name}" already exists`);

  const [insertedId] = await db('roles').insert({
    tenant_id: data.tenantId || null,
    name: upperName,
    display_name: data.displayName,
    description: data.description || '',
    permissions: JSON.stringify(data.permissions || []),
    is_system: Boolean(data.isSystem),
    is_deleted: false,
  });

  return getRoleById(insertedId);
};

export const updateRole = async (id, data, tenantId = null) => {
  const role = await getRoleById(id, tenantId);
  if (!role) throw ApiError.notFound('Role not found');
  if (role.isSystem && data.name && data.name.toUpperCase() !== role.name) {
    throw ApiError.badRequest('Cannot rename system roles');
  }

  const updateFields = {};
  if (data.name) updateFields.name = data.name.toUpperCase();
  if (data.displayName !== undefined) updateFields.display_name = data.displayName;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.permissions !== undefined) updateFields.permissions = JSON.stringify(data.permissions);

  if (Object.keys(updateFields).length > 0) {
    const q = db('roles').where({ id });
    if (tenantId) {
      q.andWhere(function () {
        this.where('tenant_id', tenantId).orWhere(function () {
          this.whereNull('tenant_id').andWhere('is_system', true);
        });
      });
    }
    const updated = await q.update(updateFields);
    if (updated === 0) throw ApiError.notFound('Role not found or access denied');
  }

  return getRoleById(id, tenantId);
};

export const deleteRole = async (id, tenantId = null) => {
  const role = await getRoleById(id, tenantId);
  if (!role) throw ApiError.notFound('Role not found');
  if (role.isSystem) throw ApiError.badRequest('Cannot delete system roles');

  const delQ = db('roles').where({ id });
  if (tenantId) delQ.andWhere('tenant_id', tenantId);
  await delQ.update({ is_deleted: true });
  return { ...role, isDeleted: true };
};

export const seedDefaultRoles = async () => {
  const defaults = [
    { name: 'ADMIN', displayName: 'Administrator', description: 'Full system access', isSystem: true, permissions: ALL_PERMISSIONS },
    { name: 'MANAGER', displayName: 'Manager', description: 'Store manager with most access', isSystem: true, permissions: [
      'dashboard:view', 'sales:view', 'sales:create', 'sales:delete',
      'products:view', 'products:create', 'products:edit', 'products:delete',
      'categories:view', 'categories:manage', 'inventory:view', 'inventory:manage',
      'stock:view', 'stock:transfer', 'customers:view', 'customers:manage',
      'suppliers:view', 'suppliers:manage', 'purchases:view', 'purchases:manage',
      'accounting:view', 'accounting:manage', 'employees:view', 'employees:manage',
      'attendance:view', 'attendance:manage', 'leaves:view', 'leaves:manage',
      'payroll:view', 'payroll:manage', 'repairs:view', 'repairs:manage',
      'warranties:view', 'warranties:manage', 'reports:view',
      'users:view', 'settings:view',
    ]},
    { name: 'CASHIER', displayName: 'Cashier', description: 'Sales and basic operations', isSystem: true, permissions: [
      'dashboard:view', 'sales:view', 'sales:create',
      'products:view', 'customers:view', 'customers:manage',
      'repairs:view', 'warranties:view', 'attendance:view', 'leaves:view',
    ]},
    { name: 'TECHNICIAN', displayName: 'Technician', description: 'Repair and warranty operations', isSystem: true, permissions: [
      'dashboard:view', 'repairs:view', 'repairs:manage',
      'warranties:view', 'warranties:manage', 'products:view',
      'inventory:view', 'attendance:view', 'leaves:view',
    ]},
  ];

  for (const role of defaults) {
    const existing = await db('roles').where({ name: role.name, is_deleted: false }).first();
    if (!existing) {
      await db('roles').insert({
        tenant_id: null,
        name: role.name,
        display_name: role.displayName,
        description: role.description,
        permissions: JSON.stringify(role.permissions),
        is_system: true,
        is_deleted: false,
      });
    }
  }
};
