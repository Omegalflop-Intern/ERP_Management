import bcrypt from 'bcryptjs';
import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';

function formatUser(row, roleRow) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    username: row.username,
    email: row.email,
    phone: row.phone || null,
    fullName: row.full_name,
    avatar: row.avatar || null,
    roleId: row.role_id,
    roleName: roleRow?.name || row.role_name,
    roleDisplayName: roleRow?.display_name || null,
    permissions: roleRow?.permissions || [],
    tenantId: row.tenant_id || null,
    commissionRate: row.commission_rate || 0,
    isActive: Boolean(row.is_active),
    isVerified: Boolean(row.is_verified),
    isSuperAdmin: !row.tenant_id && (roleRow?.name || row.role_name) === 'ADMIN',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const getProfile = async (userId) => {
  const row = await db('users')
    .leftJoin('roles', 'users.role_id', 'roles.id')
    .where({ 'users.id': userId, 'users.is_deleted': false })
    .select(
      'users.*',
      'roles.id as role_id_val',
      'roles.name as role_name_val',
      'roles.display_name as role_display_name_val',
      'roles.permissions as role_permissions_val'
    )
    .first();

  if (!row) throw ApiError.notFound('User not found');

  const roleRow = row.role_id_val ? {
    id: row.role_id_val,
    name: row.role_name_val,
    display_name: row.role_display_name_val,
    permissions: row.role_permissions_val,
  } : null;

  return formatUser(row, roleRow);
};

export const updateProfile = async (userId, data, file) => {
  const user = await getProfile(userId);

  const updateFields = {};

  if (data.fullName !== undefined) updateFields.full_name = data.fullName;
  if (data.name !== undefined && data.fullName === undefined) updateFields.full_name = data.name;
  if (data.phone !== undefined && data.phone !== user.phone) {
    if (data.phone && typeof data.phone === 'string' && data.phone.trim()) {
      const existing = await db('users').where({ phone: data.phone, is_deleted: false }).whereNot({ id: userId }).first();
      if (existing) throw ApiError.conflict('Phone number already exists');
      updateFields.phone = data.phone;
    } else if (!data.phone || !data.phone.trim()) {
      updateFields.phone = null;
    }
  }
  if (data.email !== undefined && data.email.toLowerCase() !== user.email) {
    const existing = await db('users').where({ email: data.email.toLowerCase(), is_deleted: false }).whereNot({ id: userId }).first();
    if (existing) throw ApiError.conflict('Email already exists');
    updateFields.email = data.email.toLowerCase();
  }
  if (data.username !== undefined && data.username.toLowerCase() !== user.username) {
    const existing = await db('users').where({ username: data.username.toLowerCase(), is_deleted: false }).whereNot({ id: userId }).first();
    if (existing) throw ApiError.conflict('Username already exists');
    updateFields.username = data.username.toLowerCase();
  }
  if (file) {
    updateFields.avatar = `/uploads/avatars/${file.filename}`;
  }

  if (Object.keys(updateFields).length === 0) {
    return getProfile(userId);
  }

  updateFields.updated_at = new Date();
  await db('users').where({ id: userId }).update(updateFields);

  return getProfile(userId);
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const row = await db('users').where({ id: userId, is_deleted: false }).first();
  if (!row) throw ApiError.notFound('User not found');

  const isMatch = await bcrypt.compare(currentPassword, row.password_hash);
  if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

  const newHash = await bcrypt.hash(newPassword, 10);
  await db('users').where({ id: userId }).update({ password_hash: newHash, updated_at: new Date() });

  return { message: 'Password changed successfully' };
};
