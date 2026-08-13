import bcrypt from 'bcryptjs';
import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';
import { generateOTP, sendOTP } from '../auth/auth.service.js';
import emitter, { EVENTS } from '../../events/index.js';

export function formatUser(row, roleRow = null, branchRow = null) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    username: row.username,
    email: row.email,
    phone: row.phone || null,
    fullName: row.full_name || '',
    avatar: row.avatar || null,
    role: roleRow ? {
      _id: String(roleRow.id),
      id: roleRow.id,
      name: roleRow.name,
      displayName: roleRow.display_name,
      permissions: typeof roleRow.permissions === 'string' ? JSON.parse(roleRow.permissions) : (roleRow.permissions || []),
    } : (row.role_id ? String(row.role_id) : null),
    roleName: row.role_name,
    isActive: Boolean(row.is_active),
    isVerified: Boolean(row.is_verified),
    branchId: row.branch_id ? String(row.branch_id) : null,
    branchName: branchRow?.name || row.branch_name || (row.branch_id ? `Branch #${row.branch_id}` : 'Main Branch (All Outlets)'),
    branch: branchRow ? {
      _id: String(branchRow.id),
      id: branchRow.id,
      name: branchRow.name,
    } : (row.branch_id ? { _id: String(row.branch_id), id: row.branch_id, name: row.branch_name || `Branch #${row.branch_id}` } : null),
    tenantId: row.tenant_id || null,
    commissionRate: Number(row.commission_rate || 0),
    isMfaEnabled: Boolean(row.is_mfa_enabled),
    failedLoginAttempts: Number(row.failed_login_attempts || 0),
    lockUntil: row.lock_until || null,
    lastLoginAt: row.last_login_at || null,
    isDeleted: Boolean(row.is_deleted),
    isTempAdmin: Boolean(row.is_temp_admin),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId) {
  if (tenantId) {
    query.where('users.tenant_id', tenantId);
  }
}

export const getAllUsers = async (page = 1, limit = 20, search = '', tenantId = null, branchId = null) => {
  const countQuery = db('users').where('users.is_deleted', false);
  applyTenantScope(countQuery, tenantId);
  if (branchId) countQuery.where('users.branch_id', branchId);

  if (search) {
    const term = `%${search}%`;
    countQuery.where((b) => {
      b.where('username', 'like', term)
        .orWhere('email', 'like', term)
        .orWhere('full_name', 'like', term)
        .orWhere('phone', 'like', term);
    });
  }

  const countResult = await countQuery.count({ total: '*' }).first();
  const total = Number(countResult?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('users')
    .leftJoin('roles', 'users.role_id', 'roles.id')
    .leftJoin('branches', 'users.branch_id', 'branches.id')
    .where('users.is_deleted', false)
    .select(
      'users.*',
      'roles.id as role_id_val',
      'roles.name as role_name_val',
      'roles.display_name as role_display_name_val',
      'roles.permissions as role_permissions_val',
      'branches.id as branch_id_val',
      'branches.name as branch_name'
    );
  applyTenantScope(dataQuery, tenantId);
  if (branchId) dataQuery.where('users.branch_id', branchId);

  if (search) {
    const term = `%${search}%`;
    dataQuery.where((b) => {
      b.where('users.username', 'like', term)
        .orWhere('users.email', 'like', term)
        .orWhere('users.full_name', 'like', term)
        .orWhere('users.phone', 'like', term);
    });
  }

  const rows = await dataQuery.orderBy('users.created_at', 'desc').limit(limit).offset(offset);

  const users = rows.map((row) => {
    const roleRow = row.role_id_val ? {
      id: row.role_id_val,
      name: row.role_name_val,
      display_name: row.role_display_name_val,
      permissions: row.role_permissions_val,
    } : null;
    const branchRow = row.branch_id_val ? {
      id: row.branch_id_val,
      name: row.branch_name,
    } : null;
    return formatUser(row, roleRow, branchRow);
  });

  return { users, pagination: getPagination(total, page, limit) };
};

export const getUserById = async (id, tenantId = null) => {
  const dataQuery = db('users')
    .leftJoin('roles', 'users.role_id', 'roles.id')
    .where({ 'users.id': id, 'users.is_deleted': false })
    .select(
      'users.*',
      'roles.id as role_id_val',
      'roles.name as role_name_val',
      'roles.display_name as role_display_name_val',
      'roles.permissions as role_permissions_val'
    );
  applyTenantScope(dataQuery, tenantId);

  const row = await dataQuery.first();
  if (!row) throw ApiError.notFound('User not found');

  const roleRow = row.role_id_val ? {
    id: row.role_id_val,
    name: row.role_name_val,
    display_name: row.role_display_name_val,
    permissions: row.role_permissions_val,
  } : null;

  return formatUser(row, roleRow);
};

export const createUser = async (data, tenantId = null) => {
  if (data.phone && typeof data.phone === 'string' && !data.phone.trim()) {
    delete data.phone;
  }

  const effectiveTenantId = tenantId || data.tenantId || null;
  if (effectiveTenantId) {
    const tenant = await db('tenants').where({ id: effectiveTenantId }).select('max_branches', 'max_users', 'plan').first();
    if (tenant) {
      const countRes = await db('users').where({ tenant_id: effectiveTenantId, is_deleted: false }).count({ count: '*' }).first();
      const currentCount = Number(countRes?.count || 0);
      const userLimit = tenant.max_users || 5;
      if (currentCount >= userLimit) {
        throw ApiError.forbidden(
          `Your plan (${tenant.plan || 'STARTER'}) allows a maximum of ${userLimit} user${userLimit === 1 ? '' : 's'}. Please upgrade subscription.`
        );
      }

      // Check per-branch user limit (5 users per branch for STARTER / BASIC plans)
      const targetBranchId = data.branchId || data.branch_id || data.branch;
      if (targetBranchId) {
        const branchUserCountRes = await db('users')
          .where({ branch_id: targetBranchId, is_deleted: false })
          .count({ count: '*' })
          .first();
        const branchUserCount = Number(branchUserCountRes?.count || 0);
        const planName = (tenant.plan || 'STARTER').toUpperCase();
        const perBranchUserLimit = planName === 'STARTER' ? 5 : 999;
        if (branchUserCount >= perBranchUserLimit) {
          throw ApiError.forbidden(
            `This branch has reached the limit of ${perBranchUserLimit} users per outlet for the ${planName} plan. Upgrade to expand limits.`
          );
        }
      }
    }
  }

  const usernameLower = data.username.toLowerCase().trim();
  const emailLower = data.email.toLowerCase().trim();

  const existingQuery = db('users').where('is_deleted', false).where((b) => {
    b.where({ username: usernameLower }).orWhere({ email: emailLower });
  });
  applyTenantScope(existingQuery, effectiveTenantId);
  const existingUser = await existingQuery.first();

  if (existingUser) {
    if (existingUser.username === usernameLower) throw ApiError.conflict('Username already exists');
    if (existingUser.email === emailLower) throw ApiError.conflict('Email already exists');
  }

  if (data.phone) {
    const phoneQuery = db('users').where({ phone: data.phone, is_deleted: false });
    applyTenantScope(phoneQuery, effectiveTenantId);
    const existingPhone = await phoneQuery.first();
    if (existingPhone) throw ApiError.conflict('Phone number already exists');
  }

  let role = null;
  if (data.role) {
    const roleQuery = db('roles').where({ is_deleted: false });
    if (effectiveTenantId) {
      roleQuery.where(function () {
        this.where('tenant_id', effectiveTenantId).orWhere(function () {
          this.whereNull('tenant_id').andWhere('is_system', true);
        });
      });
    }
    role = await roleQuery.where({ id: data.role }).first();
    if (!role) {
      const byName = db('roles').where({ is_deleted: false });
      if (effectiveTenantId) {
        byName.where(function () {
          this.where('tenant_id', effectiveTenantId).orWhere(function () {
            this.whereNull('tenant_id').andWhere('is_system', true);
          });
        });
      }
      role = await byName.where({ name: String(data.role).toUpperCase() }).first();
    }
  }
  if (!role) throw ApiError.badRequest('Invalid role');

  const passwordHash = await bcrypt.hash(data.password, 10);
  const otpCode = generateOTP();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const [insertedId] = await db('users').insert({
    username: usernameLower,
    email: emailLower,
    phone: data.phone || null,
    password_hash: passwordHash,
    role_id: role.id,
    role_name: role.name,
    full_name: data.fullName || data.name || '',
    avatar: data.avatar || null,
    is_active: data.isActive !== undefined ? Boolean(data.isActive) : true,
    is_verified: false,
    branch_id: data.branchId || null,
    tenant_id: effectiveTenantId,
    commission_rate: data.commissionRate || 0,
    otp_code: otpCode,
    otp_expires_at: otpExpiresAt,
    is_deleted: false,
  });

  sendOTP(emailLower, otpCode, data.fullName || usernameLower).catch((err) => {
    console.error(`[USER] Failed to send verification OTP to ${emailLower}:`, err.message);
  });

  const user = await getUserById(insertedId, effectiveTenantId);
  emitter.emit(EVENTS.USER_CREATED, { ...user, tenantId: effectiveTenantId });
  return user;
};

export const updateUser = async (id, data, tenantId = null) => {
  if (data.phone && typeof data.phone === 'string' && !data.phone.trim()) {
    data.phone = undefined;
  }

  const user = await getUserById(id, tenantId);
  if (!user) throw ApiError.notFound('User not found');

  const updateFields = {};

  if (data.username && data.username.toLowerCase() !== user.username) {
    const subQuery = db('users').where({ username: data.username.toLowerCase(), is_deleted: false }).whereNot({ id });
    applyTenantScope(subQuery, tenantId);
    const existing = await subQuery.first();
    if (existing) throw ApiError.conflict('Username already exists');
    updateFields.username = data.username.toLowerCase();
  }

  if (data.email && data.email.toLowerCase() !== user.email) {
    const subQuery = db('users').where({ email: data.email.toLowerCase(), is_deleted: false }).whereNot({ id });
    applyTenantScope(subQuery, tenantId);
    const existing = await subQuery.first();
    if (existing) throw ApiError.conflict('Email already exists');
    updateFields.email = data.email.toLowerCase();
  }

  if (data.phone && data.phone !== user.phone) {
    const subQuery = db('users').where({ phone: data.phone, is_deleted: false }).whereNot({ id });
    applyTenantScope(subQuery, tenantId);
    const existing = await subQuery.first();
    if (existing) throw ApiError.conflict('Phone number already exists');
    updateFields.phone = data.phone;
  }

  if (data.role) {
    const roleQuery = db('roles').where({ is_deleted: false });
    if (tenantId) {
      roleQuery.where(function () {
        this.where('tenant_id', tenantId).orWhere(function () {
          this.whereNull('tenant_id').andWhere('is_system', true);
        });
      });
    }
    let role = await roleQuery.where({ id: data.role }).first();
    if (!role) {
      const byName = db('roles').where({ is_deleted: false });
      if (tenantId) {
        byName.where(function () {
          this.where('tenant_id', tenantId).orWhere(function () {
            this.whereNull('tenant_id').andWhere('is_system', true);
          });
        });
      }
      role = await byName.where({ name: String(data.role).toUpperCase() }).first();
    }
    if (!role) throw ApiError.badRequest('Invalid role');
    updateFields.role_id = role.id;
    updateFields.role_name = role.name;
  }

  if (data.fullName !== undefined) updateFields.full_name = data.fullName;
  if (data.name !== undefined && data.fullName === undefined) updateFields.full_name = data.name;
  if (data.avatar !== undefined) updateFields.avatar = data.avatar;
  if (data.isActive !== undefined) updateFields.is_active = Boolean(data.isActive);
  if (data.branchId !== undefined) updateFields.branch_id = data.branchId;
  if (data.commissionRate !== undefined) updateFields.commission_rate = data.commissionRate;

  if (Object.keys(updateFields).length > 0) {
    const q = db('users').where({ id });
    if (tenantId) q.andWhere('tenant_id', tenantId);
    await q.update(updateFields);
  }

  const updatedUser = await getUserById(id, tenantId);
  emitter.emit(EVENTS.USER_MUTATED, { ...updatedUser, tenantId: updatedUser?.tenantId || tenantId });
  return updatedUser;
};

export const deleteUser = async (id, tenantId = null) => {
  const user = await getUserById(id, tenantId);
  if (!user) throw ApiError.notFound('User not found');

  const q1 = db('users').where({ id });
  if (tenantId) q1.andWhere('tenant_id', tenantId);
  await q1.update({ is_deleted: true });
  const result = { ...user, isDeleted: true };
  emitter.emit(EVENTS.USER_MUTATED, { ...result, tenantId: user?.tenantId || tenantId });
  return result;
};

export const toggleVerification = async (id, tenantId = null) => {
  const user = await getUserById(id, tenantId);
  if (!user) throw ApiError.notFound('User not found');

  const newStatus = !user.isVerified;
  const q2 = db('users').where({ id });
  if (tenantId) q2.andWhere('tenant_id', tenantId);
  await q2.update({ is_verified: newStatus });

  const updatedUser = await getUserById(id, tenantId);
  emitter.emit(EVENTS.USER_MUTATED, { ...updatedUser, tenantId: updatedUser?.tenantId || tenantId });
  return updatedUser;
};

export const changePassword = async (id, currentPassword, newPassword, tenantId = null) => {
  const user = await getUserById(id, tenantId);
  if (!user) throw ApiError.notFound('User not found');

  const pwQuery = db('users').where({ id, is_deleted: false });
  if (tenantId) pwQuery.andWhere('tenant_id', tenantId);
  const row = await pwQuery.first();
  const isMatch = await bcrypt.compare(currentPassword, row.password_hash);
  if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

  const newHash = await bcrypt.hash(newPassword, 10);
  const q3 = db('users').where({ id });
  if (tenantId) q3.andWhere('tenant_id', tenantId);
  await q3.update({ password_hash: newHash });

  return getUserById(id, tenantId);
};

export const getMyProfile = async (userId, tenantId = null) => {
  return getUserById(userId, tenantId);
};

export const updateMyProfile = async (userId, data, file, tenantId = null) => {
  if (file) {
    data.avatar = `/uploads/avatars/${file.filename}`;
  }
  return updateUser(userId, data, tenantId);
};
