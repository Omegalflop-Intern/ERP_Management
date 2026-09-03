import { db } from '../../config/db.knex.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../../utils/auth/generateToken.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { sendOTPEmail, sendPasswordResetEmail } from '../../config/mailer.js';

// Bug #29 fixed: Use crypto.randomInt for cryptographically secure OTP generation.
// Math.random() is predictable and should never be used for security codes.
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Bug #32 fixed: sendOTP now accepts and uses recipientName for personalised emails
export const sendOTP = async (recipient, otpCode, recipientName = '') => {
  if (recipient && recipient.includes('@')) {
    return sendOTPEmail(recipient, otpCode, recipientName);
  }
  const { sendSMS } = await import('../../config/sms.js');
  return sendSMS(recipient, `Your ERP verification OTP is: ${otpCode}`);
};

export const verifyPassword = async (password, hash) => {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
};

export function formatUser(row) {
  if (!row) return null;
  let permissions = [];
  if (row.role_permissions) {
    try {
      permissions = typeof row.role_permissions === 'string' ? JSON.parse(row.role_permissions) : row.role_permissions;
    } catch { permissions = []; }
  }
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    subdomain: row.subdomain || row.tenant_subdomain || null,
    customDomain: row.customDomain || row.tenant_custom_domain || null,
    username: row.username,
    fullName: row.full_name || '',
    email: row.email,
    phone: row.phone || '',
    avatar: row.avatar || null,
    profilePhoto: row.avatar || null,
    profile_photo: row.avatar || null,
    roleId: row.role_id,
    role: row.role_id,
    roleName: row.role_name || '',
    roleDisplayName: row.role_display_name || '',
    permissions,
    isSuperAdmin: !row.tenant_id && (row.role_name || '').toUpperCase() === 'ADMIN',
    isActive: Boolean(row.is_active),
    isVerified: Boolean(row.is_verified),
    mfaEnabled: Boolean(row.is_mfa_enabled),
    isMfaEnabled: Boolean(row.is_mfa_enabled),
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const findUserByLogin = async (identifier, tenantId = null) => {
  const term = (identifier || '').trim().toLowerCase();
  const query = db('users')
    .leftJoin('roles', 'users.role_id', 'roles.id')
    .leftJoin('tenants', 'users.tenant_id', 'tenants.id')
    .where((b) => b.where('users.username', term).orWhere('users.email', term))
    .where('users.is_deleted', false)
    .select(
      'users.*',
      'roles.name as role_name_val',
      'roles.display_name as role_display_name_val',
      'roles.permissions as role_permissions',
      'tenants.subdomain as tenant_subdomain',
      'tenants.custom_domain as tenant_custom_domain',
      'tenants.status as tenant_status',
      'tenants.is_deleted as tenant_is_deleted'
    );

  if (tenantId) {
    query.where((b) => b.where('users.tenant_id', tenantId).orWhereNull('users.tenant_id'));
  }

  const row = await query.first();

  if (!row) return null;

  // Enforce tenant check for non-SuperAdmin users
  if (row.tenant_id) {
    if (Boolean(row.tenant_is_deleted) || !row.tenant_status || row.tenant_status !== 'ACTIVE') {
      if (row.tenant_status === 'SUSPENDED') {
        throw ApiError.forbidden('Your shop account has been suspended. Please contact support.');
      }
      throw ApiError.forbidden('Associated shop account has been deleted or does not exist. Access denied.');
    }
  }

  row.role_name = row.role_name_val || row.role_name;
  row.role_display_name = row.role_display_name_val || row.role_display_name;
  row.subdomain = row.tenant_subdomain || null;
  row.customDomain = row.tenant_custom_domain || null;
  row._id = String(row.id);
  row.passwordHash = row.password_hash;
  row.isActive = Boolean(row.is_active);
  row.isVerified = Boolean(row.is_verified);
  row.isMfaEnabled = Boolean(row.is_mfa_enabled);
  row.tenantId = row.tenant_id || null;
  return row;
};

export const createSessionRecord = async (userId, refreshToken, ipAddress = '', userAgent = '') => {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const [insertedId] = await db('sessions').insert({
    user_id: userId,
    refresh_token: refreshToken,
    ip_address: ipAddress,
    user_agent: userAgent,
    is_valid: true,
    expires_at: expiresAt,
  });
  return insertedId;
};

export const invalidateSession = async (refreshToken) => {
  if (!refreshToken) return;
  await db('sessions').where({ refresh_token: refreshToken }).update({ is_valid: false });
};

export const listUserSessions = async (userId) => {
  const rows = await db('sessions').where({ user_id: userId, is_valid: true }).orderBy('created_at', 'desc').limit(20);
  return rows.map(r => ({
    _id: String(r.id),
    id: r.id,
    ipAddress: r.ip_address,
    userAgent: r.user_agent,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
  }));
};

export const invalidateAllUserSessions = async (userId) => {
  await db('sessions').where({ user_id: userId, is_valid: true }).update({ is_valid: false });
  return true;
};

export const loginDirect = async (identifier, password, ipAddress = '', userAgent = '', tenantId = null) => {
  const userRow = await findUserByLogin(identifier, tenantId);
  if (!userRow) throw ApiError.unauthorized('Invalid username or password');

  // Enforce tenant status and subscription expiration check
  if (userRow.tenant_id) {
    const tenant = await db('tenants').where({ id: userRow.tenant_id, is_deleted: false }).first();
    if (!tenant) throw ApiError.forbidden('Associated shop account no longer exists');

    if (tenant.expires_at && new Date(tenant.expires_at) < new Date()) {
      await db('tenants').where({ id: tenant.id }).update({
        status: 'SUSPENDED',
        paused_reason: 'SUBSCRIPTION_EXPIRED',
        paused_at: new Date(),
      });
      await db('users').where({ tenant_id: tenant.id }).update({ is_active: false });
      throw ApiError.forbidden('Your shop subscription has expired. Please contact platform admin to renew.');
    }

    if (tenant.status !== 'ACTIVE') {
      throw ApiError.forbidden(`Your shop account is currently ${tenant.status.toLowerCase()}. Access denied.`);
    }
  }

  if (!userRow.is_active) throw ApiError.forbidden('Account is deactivated');

  const isMatch = await bcrypt.compare(password, userRow.password_hash);
  if (!isMatch) throw ApiError.unauthorized('Invalid username or password');

  const payload = {
    userId: String(userRow.id),
    id: userRow.id,
    username: userRow.username,
    role: userRow.role_id,
    roleName: userRow.role_name,
    tenantId: userRow.tenant_id || null,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await createSessionRecord(userRow.id, refreshToken, ipAddress, userAgent);

  return {
    user: formatUser(userRow),
    accessToken,
    refreshToken,
  };
};

export const loginInitiate = async (identifier, password, tenantId = null) => {
  const userRow = await findUserByLogin(identifier, tenantId);
  if (!userRow) throw ApiError.unauthorized('Invalid username or password');
  if (!userRow.is_active) throw ApiError.forbidden('Account is deactivated');

  const isMatch = await bcrypt.compare(password, userRow.password_hash);
  if (!isMatch) throw ApiError.unauthorized('Invalid username or password');

  // loginInitiate also needs secure OTP (Bug #29 fixed consistently here too)
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const otpQ = db('users').where({ id: userRow.id });
  if (tenantId) otpQ.andWhere('tenant_id', tenantId);
  await otpQ.update({
    otp_code: otpCode,
    otp_expires_at: new Date(Date.now() + 10 * 60 * 1000),
    otp_attempts: 0,
  });

  await sendOTP(userRow.email, otpCode, userRow.full_name || userRow.username);
  return { email: userRow.email, requiresOtp: true };
};

export const verifyOTP = async (email, otpCode, tenantId = null) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const query = db('users').where({ email: normalizedEmail, is_deleted: false });
  if (tenantId) query.where('tenant_id', tenantId);
  const row = await query.first();
  if (!row) throw ApiError.notFound('User not found');

  if (row.otp_code !== otpCode || !row.otp_expires_at || new Date(row.otp_expires_at) < new Date()) {
    throw ApiError.badRequest('Invalid or expired OTP code');
  }

  const verQ = db('users').where({ id: row.id });
  if (tenantId) verQ.andWhere('tenant_id', tenantId);
  await verQ.update({
    is_verified: true,
    otp_code: null,
    otp_expires_at: null,
    otp_attempts: 0,
  });

  return findUserByLogin(row.email);
};

export const refreshAccessToken = async (refreshToken) => {
  const decoded = verifyToken(refreshToken);
  const query = db('users')
    .leftJoin('roles', 'users.role_id', 'roles.id')
    .leftJoin('tenants', 'users.tenant_id', 'tenants.id')
    .where({ 'users.id': decoded.id || decoded.userId, 'users.is_deleted': false, 'users.is_active': true })
    .select(
      'users.*',
      'roles.name as role_name_val',
      'roles.display_name as role_display_name_val',
      'tenants.status as tenant_status',
      'tenants.is_deleted as tenant_is_deleted'
    );

  if (decoded.tenantId) {
    query.where('users.tenant_id', decoded.tenantId);
  }

  const row = await query.first();

  if (!row) throw ApiError.unauthorized('User session expired or user deactivated');

  if (row.tenant_id) {
    if (Boolean(row.tenant_is_deleted) || !row.tenant_status || row.tenant_status !== 'ACTIVE') {
      throw ApiError.unauthorized('Associated shop account is no longer active');
    }
  }

  const payload = {
    userId: String(row.id),
    id: row.id,
    username: row.username,
    role: row.role_id,
    roleName: row.role_name_val || row.role_name,
    tenantId: row.tenant_id || null,
  };

  const accessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);
  return { accessToken, refreshToken: newRefreshToken };
};

export const forgotPassword = async (email, tenantId = null) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const query = db('users').where({ email: normalizedEmail, is_deleted: false });
  if (tenantId) query.where('tenant_id', tenantId);
  const row = await query.first();
  if (!row) throw ApiError.notFound('No account found with this email');

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  const fpQ = db('users').where({ id: row.id });
  if (tenantId) fpQ.andWhere('tenant_id', tenantId);
  await fpQ.update({
    password_reset_token: resetTokenHash,
    password_reset_expires: new Date(Date.now() + 60 * 60 * 1000),
  });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const resetLink = `${clientUrl}/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail(row.email, resetLink, row.full_name || row.username);
  } catch (err) {
    console.error('[ForgotPassword] Failed to send email:', err.message);
  }

  return { email: row.email };
};

export const resetPassword = async (token, newPassword) => {
  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const row = await db('users')
    .where({ password_reset_token: resetTokenHash, is_deleted: false })
    .where('password_reset_expires', '>', new Date())
    .first();

  if (!row) throw ApiError.badRequest('Invalid or expired reset token');

  const newHash = await bcrypt.hash(newPassword, 10);
  const rpQ = db('users').where({ id: row.id });
  await rpQ.update({
    password_hash: newHash,
    password_reset_token: null,
    password_reset_expires: null,
  });

  return findUserByLogin(row.email);
};

export const issueTokens = (user) => {
  const payload = {
    userId: String(user.id || user._id),
    id: user.id || user._id,
    username: user.username,
    role: user.role_id || user.role || 1,
    roleName: user.role_name || user.roleName || 'ADMIN',
    tenantId: user.tenant_id || user.tenantId || null,
  };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  return { accessToken, refreshToken };
};

export const sanitizeUser = (user) => {
  return formatUser(user);
};

export const verifyEmail = async (email, otpCode, tenantId = null) => {
  return verifyOTP(email, otpCode, tenantId);
};

// Bug #13/#14/#18 fixed: resendVerificationOTP was generating OTP and sending it by email
// but never saving otp_code + otp_expires_at to the DB. Verification always failed.
export const resendVerificationOTP = async (email, tenantId = null) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const query = db('users').where({ email: normalizedEmail, is_deleted: false });
  if (tenantId) query.where('tenant_id', tenantId);
  const user = await query.first();
  if (!user) throw ApiError.notFound('User not found');

  const otpCode = generateOTP();
  // Save OTP to DB so verifyOTP can validate it
  const otpSaveQ = db('users').where({ id: user.id });
  if (tenantId) otpSaveQ.andWhere('tenant_id', tenantId);
  await otpSaveQ.update({
    otp_code: otpCode,
    otp_expires_at: new Date(Date.now() + 10 * 60 * 1000),
    otp_attempts: 0,
  });

  await sendOTP(user.email, otpCode, user.full_name || user.username);
  return { email: user.email };
};
