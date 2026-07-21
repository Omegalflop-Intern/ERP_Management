import { Role, ALL_PERMISSIONS } from './role.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';

export const getAllRoles = async (page = 1, limit = 50) => {
  const query = { isDeleted: false };
  const total = await Role.countDocuments(query);
  const roles = await paginate(Role.find(query).sort({ createdAt: -1 }), page, limit);
  return { roles, pagination: getPagination(total, page, limit) };
};

export const getAllRolesFlat = async () => {
  return Role.find({ isDeleted: false }).sort({ name: 1 }).select('name displayName permissions');
};

export const getRoleById = async (id) => {
  const role = await Role.findOne({ _id: id, isDeleted: false });
  if (!role) throw ApiError.notFound('Role not found');
  return role;
};

export const getRoleByName = async (name) => {
  return Role.findOne({ name: name.toUpperCase(), isDeleted: false });
};

export const createRole = async (data) => {
  const existing = await Role.findOne({ name: data.name.toUpperCase(), isDeleted: false });
  if (existing) throw ApiError.conflict(`Role "${data.name}" already exists`);
  return Role.create({ ...data, name: data.name.toUpperCase() });
};

export const updateRole = async (id, data) => {
  const role = await Role.findOne({ _id: id, isDeleted: false });
  if (!role) throw ApiError.notFound('Role not found');
  if (role.isSystem && data.name && data.name !== role.name) {
    throw ApiError.badRequest('Cannot rename system roles');
  }
  Object.assign(role, data);
  await role.save();
  return role;
};

export const deleteRole = async (id) => {
  const role = await Role.findOne({ _id: id, isDeleted: false });
  if (!role) throw ApiError.notFound('Role not found');
  if (role.isSystem) throw ApiError.badRequest('Cannot delete system roles');
  role.isDeleted = true;
  await role.save();
  return role;
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
      'repairs:view', 'warranties:view',
    ]},
    { name: 'TECHNICIAN', displayName: 'Technician', description: 'Repair and warranty operations', isSystem: true, permissions: [
      'dashboard:view', 'repairs:view', 'repairs:manage',
      'warranties:view', 'warranties:manage', 'products:view',
      'inventory:view',
    ]},
  ];

  for (const role of defaults) {
    const existing = await Role.findOne({ name: role.name, isDeleted: false });
    if (!existing) {
      await Role.create(role);
    }
  }
};
