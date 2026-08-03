import { Tenant } from './tenant.model.js';
import { User } from '../user/user.model.js';
import { Role } from '../role/role.model.js';
import { Transaction } from '../sale/sale.model.js';
import { Product } from '../product/product.model.js';
import { Customer } from '../customer/customer.model.js';
import { Supplier } from '../supplier/supplier.model.js';
import { Expense } from '../expense/expense.model.js';
import { RepairTicket } from '../repair/repair.model.js';
import { Branch } from '../branch/branch.model.js';
import { Settings } from '../settings/settings.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { generateOTP, sendOTP } from '../auth/auth.service.js';
import bcrypt from 'bcryptjs';

export const getAllTenants = async (search = '') => {
  const query = { isDeleted: false };
  if (search) {
    query.$or = [
      { shopName: { $regex: search, $options: 'i' } },
      { ownerName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  const tenants = await Tenant.find(query).sort({ createdAt: -1 }).lean();

  // Aggregate stats per tenant for SaaS Admin Overview
  const tenantsWithStats = await Promise.all(
    tenants.map(async (t) => {
      const userCount = await User.countDocuments({ tenantId: t._id, isDeleted: false });
      let totalSales = 0;
      let totalRevenue = 0;
      try {
        const saleStats = await Transaction.aggregate([
          { $match: { tenantId: t._id, isDeleted: false } },
          { $group: { _id: null, totalRevenue: { $sum: '$netTotal' }, totalSales: { $sum: 1 } } },
        ]);
        totalSales = saleStats[0]?.totalSales || 0;
        totalRevenue = saleStats[0]?.totalRevenue || 0;
      } catch (e) {
        // Fallback
      }
      return {
        ...t,
        stats: {
          userCount,
          totalSales,
          totalRevenue,
        },
      };
    })
  );

  return tenantsWithStats;
};

export const getTenantById = async (id) => {
  const tenant = await Tenant.findOne({ _id: id, isDeleted: false });
  if (!tenant) throw ApiError.notFound('Shop tenant account not found');
  return tenant;
};

export const createTenant = async (data) => {
  const emailLower = data.email.toLowerCase().trim();

  // Check any tenant regardless of isDeleted status
  const existingTenant = await Tenant.findOne({ email: emailLower });
  if (existingTenant) {
    throw ApiError.conflict(`A shop tenant with email "${emailLower}" already exists in the system.`);
  }

  // Check any user regardless of isDeleted status
  const existingUser = await User.findOne({ email: emailLower });
  if (existingUser) {
    throw ApiError.conflict(`A user account with email "${emailLower}" already exists.`);
  }

  const username = data.username?.trim().toLowerCase() || emailLower.split('@')[0];

  // Check if username exists for super admin users (tenantId: null)
  const existingUsername = await User.findOne({ username, tenantId: null });
  if (existingUsername) {
    throw ApiError.conflict(`Username "${username}" is already taken. Please choose another username.`);
  }

  let tenant;
  try {
    tenant = await Tenant.create({
      shopName: data.shopName,
      ownerName: data.ownerName,
      email: emailLower,
      phone: data.phone,
      plan: data.plan || 'STARTER',
      status: 'ACTIVE', // Direct Super Admin creation starts active
      kycDocuments: {
        nidNumber: data.nidNumber || '',
        tradeLicenseNumber: data.tradeLicenseNumber || '',
        kycStatus: 'APPROVED',
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      throw ApiError.conflict(`Email "${emailLower}" or shop data already exists in the system.`);
    }
    throw err;
  }

  // Seed default settings for this new tenant so they have their own isolated config
  try {
    await Settings.seedDefaultsForTenant(tenant._id, data.shopName);
  } catch (settingsErr) {
    console.error(`[TENANT] Failed to seed default settings for tenant ${tenant._id}:`, settingsErr.message);
  }

  // Create corresponding Shop Owner User account
  if (data.password) {
    let adminRole = await Role.findOne({ name: 'ADMIN', isDeleted: false });
    if (!adminRole) {
      adminRole = await Role.create({ name: 'ADMIN', displayName: 'Administrator', permissions: ['*'] });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const otpCode = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      username,
      email: emailLower,
      fullName: data.ownerName,
      phone: data.phone,
      passwordHash,
      role: adminRole._id,
      roleName: 'ADMIN',
      tenantId: tenant._id,
       isVerified: false,
      otpCode,
      otpExpiresAt,
    });

    sendOTP(user.email, otpCode, user.fullName || user.username).catch((err) => {
      console.error(`[TENANT] Failed to send OTP to ${user.email}:`, err.message);
    });
  }

  return tenant;
};

export const updateTenantStatus = async (id, status, rejectionReason) => {
  const tenant = await Tenant.findById(id);
  if (!tenant) throw ApiError.notFound('Shop account not found');

  if (status === 'DELETED') {
    // Hard Delete Tenant from database
    await Tenant.findByIdAndDelete(id);

    // Hard Delete all linked users, products, sales, customers, suppliers, expenses, repairs, and branches
    try {
      await User.deleteMany({ tenantId: id });
      await Product.deleteMany({ tenantId: id });
      await Transaction.deleteMany({ tenantId: id });
      await Customer.deleteMany({ tenantId: id });
      await Supplier.deleteMany({ tenantId: id });
      await Expense.deleteMany({ tenantId: id });
      await RepairTicket.deleteMany({ tenantId: id });
      await Branch.deleteMany({ tenantId: id });
    } catch (cleanErr) {
      console.error(`[TENANT] Error cleaning associated data for tenant ${id}:`, cleanErr.message);
    }

    return { _id: id, isDeleted: true };
  }

  tenant.status = status;
  if (status === 'ACTIVE') {
    // Automatically verify shop owner users when active
    await User.updateMany({ tenantId: tenant._id, roleName: 'ADMIN' }, { isVerified: true });
  }
  if (rejectionReason) {
    tenant.kycDocuments.rejectionReason = rejectionReason;
  }
  await tenant.save();

  return tenant;
};

export const verifyKyc = async (id, status, rejectionReason) => {
  const tenant = await Tenant.findOne({ _id: id, isDeleted: false });
  if (!tenant) throw ApiError.notFound('Shop account not found');

  tenant.kycDocuments.kycStatus = status;
  tenant.kycDocuments.reviewedAt = new Date();

  if (status === 'APPROVED') {
    tenant.status = 'ACTIVE';
    tenant.kycDocuments.rejectionReason = undefined;
    // Mark Shop Owner users as verified on KYC approval
    await User.updateMany({ tenantId: tenant._id, roleName: 'ADMIN' }, { isVerified: true });
  } else if (status === 'REJECTED') {
    tenant.kycDocuments.rejectionReason = rejectionReason || 'Documents rejected by administrator';
  }

  await tenant.save();
  return tenant;
};

export const uploadKycDocuments = async (id, files) => {
  const tenant = await Tenant.findOne({ _id: id, isDeleted: false });
  if (!tenant) throw ApiError.notFound('Shop account not found');

  if (files?.nidFront?.[0]) tenant.kycDocuments.nidFront = `/uploads/tenants/kyc/${files.nidFront[0].filename}`;
  if (files?.nidBack?.[0]) tenant.kycDocuments.nidBack = `/uploads/tenants/kyc/${files.nidBack[0].filename}`;
  if (files?.tradeLicenseFile?.[0]) tenant.kycDocuments.tradeLicenseFile = `/uploads/tenants/kyc/${files.tradeLicenseFile[0].filename}`;
  if (files?.tinCertificate?.[0]) tenant.kycDocuments.tinCertificate = `/uploads/tenants/kyc/${files.tinCertificate[0].filename}`;

  tenant.kycDocuments.kycStatus = 'PENDING';
  tenant.status = 'PENDING_KYC';

  await tenant.save();
  return tenant;
};

export const uploadTenantLogo = async (id, file) => {
  const tenant = await Tenant.findOne({ _id: id, isDeleted: false });
  if (!tenant) throw ApiError.notFound('Shop account not found');

  if (file) {
    tenant.logo = `/uploads/tenants/logos/${file.filename}`;
    await tenant.save();
  }

  return tenant;
};
