import { TempAdmin } from './tempAdmin.model.js';
import { Tenant } from './tenant.model.js';
import { User } from '../user/user.model.js';
import { Role } from '../role/role.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import bcrypt from 'bcryptjs';
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

export const createTempAdmin = async ({ tenantId, duration, reason, createdBy }) => {
  const tenant = await Tenant.findOne({ _id: tenantId, isDeleted: false });
  if (!tenant) throw ApiError.notFound('Shop not found');

  let adminRole = await Role.findOne({ name: 'ADMIN', isDeleted: false });
  if (!adminRole) {
    adminRole = await Role.create({ name: 'ADMIN', displayName: 'Administrator', permissions: ['*'] });
  }

  const username = generateUsername(tenant.shopName);
  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    username,
    email: `${username}@temp.erp.com`,
    fullName: 'Temporary Support Admin',
    passwordHash,
    role: adminRole._id,
    roleName: 'ADMIN',
    tenantId,
    isVerified: true,
    isActive: true,
    isTempAdmin: true,
  });

  const tempAdmin = await TempAdmin.create({
    tenantId,
    userId: user._id,
    createdBy,
    reason: reason || '',
    duration,
    expiresAt: new Date(Date.now() + duration),
  });

  return {
    tempAdminId: tempAdmin._id,
    username,
    password,
    expiresAt: tempAdmin.expiresAt,
    shopName: tenant.shopName,
  };
};

export const getActiveTempAdmins = async (tenantId) => {
  return TempAdmin.find({ tenantId, status: 'ACTIVE', expiresAt: { $gt: new Date() } })
    .populate('userId', 'username fullName email')
    .populate('createdBy', 'fullName username')
    .sort({ createdAt: -1 })
    .lean();
};

export const getAllActiveTempAdmins = async () => {
  return TempAdmin.find({ status: 'ACTIVE', expiresAt: { $gt: new Date() } })
    .populate('tenantId', 'shopName')
    .populate('userId', 'username fullName email')
    .populate('createdBy', 'fullName username')
    .sort({ createdAt: -1 })
    .lean();
};

export const revokeTempAdmin = async (tempAdminId, revokedBy) => {
  const tempAdmin = await TempAdmin.findById(tempAdminId);
  if (!tempAdmin) throw ApiError.notFound('Temp admin not found');
  if (tempAdmin.status !== 'ACTIVE') throw ApiError.badRequest('Already expired or revoked');

  await User.findByIdAndUpdate(tempAdmin.userId, { isActive: false });

  tempAdmin.status = 'REVOKED';
  tempAdmin.revokedAt = new Date();
  tempAdmin.revokedBy = revokedBy;
  await tempAdmin.save();

  return tempAdmin;
};

export const cleanupExpiredTempAdmins = async () => {
  const expired = await TempAdmin.find({
    status: 'ACTIVE',
    expiresAt: { $lt: new Date() },
  });

  for (const ta of expired) {
    await User.findByIdAndUpdate(ta.userId, { isActive: false });
    ta.status = 'EXPIRED';
    await ta.save();
  }

  return expired.length;
};
