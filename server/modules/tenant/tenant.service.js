import bcrypt from 'bcryptjs';
import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { seedDefaultsForTenant, updateSettings } from '../settings/settings.service.js';
import { syncUserToEmployee } from '../employee/employee.service.js';

export function formatTenant(row) {
  if (!row) return null;

  const planName = (row.plan || 'STARTER').toUpperCase();
  let defaultBranches = 2;
  let defaultUsers = 5;

  if (planName === 'ENTERPRISE') {
    defaultBranches = 999;
    defaultUsers = 999;
  } else if (planName === 'PRO' || planName === 'BUSINESS') {
    defaultBranches = 5;
    defaultUsers = 20;
  } else if (planName === 'FREE') {
    defaultBranches = 1;
    defaultUsers = 2;
  }

  return {
    _id: String(row.id),
    id: row.id,
    shopName: row.shop_name,
    logo: row.logo || null,
    ownerName: row.owner_name,
    username: row.owner_username || row.username || '',
    email: row.email,
    phone: row.phone,
    plan: planName,
    status: row.status || 'PENDING_KYC',
    maxBranches: Number(row.max_branches ?? defaultBranches),
    maxUsers: Number(row.max_users ?? defaultUsers),
    expiresAt: row.expires_at,
    notes: row.notes || '',
    kycDocuments: {
      nidNumber: row.nid_number || '',
      nidFront: row.nid_front || null,
      nidBack: row.nid_back || null,
      tradeLicenseNumber: row.trade_license_number || '',
      tradeLicenseFile: row.trade_license_file || null,
      tinCertificate: row.tin_certificate || null,
      ownerPhoto: row.owner_photo || null,
      kycStatus: row.kyc_status || 'PENDING',
      rejectionReason: row.rejection_reason || undefined,
      reviewedAt: row.reviewed_at || null,
    },
    isDeleted: Boolean(row.is_deleted),
    pausedReason: row.paused_reason || null,
    pausedAt: row.paused_at || null,
    gracePeriodDays: Number(row.grace_period_days || 0),
    lastWarningSent: row.last_warning_sent || null,
    subdomain: row.subdomain || null,
    customDomain: row.custom_domain || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const checkSubdomainAvailability = async (slug) => {
  const clean = slug?.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
  if (!clean || clean.length < 3) {
    return { available: false, slug: clean, reason: 'Minimum 3 characters required' };
  }
  if (clean.startsWith('-') || clean.endsWith('-')) {
    return { available: false, slug: clean, reason: 'Cannot start or end with hyphen' };
  }
  const taken = await db('tenants').where({ subdomain: clean, is_deleted: false }).first();
  return { available: !taken, slug: clean };
};

export const getTenantStats = async () => {
  const totalRes = await db('tenants').where({ is_deleted: false }).count('* as count').first();
  const activeRes = await db('tenants').where({ is_deleted: false, status: 'ACTIVE' }).count('* as count').first();
  const pausedRes = await db('tenants').where({ is_deleted: false, status: 'PAUSED' }).count('* as count').first();
  const pendingKycRes = await db('tenants').where({ is_deleted: false, status: 'PENDING_KYC' }).count('* as count').first();

  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const expiringSoonRes = await db('tenants')
    .where({ is_deleted: false })
    .whereBetween('expires_at', [now, thirtyDaysLater])
    .count('* as count')
    .first();

  const counts = {
    total: Number(totalRes?.count || 0),
    active: Number(activeRes?.count || 0),
    paused: Number(pausedRes?.count || 0),
    pendingKyc: Number(pendingKycRes?.count || 0),
    expiringSoon: Number(expiringSoonRes?.count || 0),
  };

  const recentRows = await db('tenants')
    .where({ is_deleted: false })
    .orderBy('created_at', 'desc')
    .limit(5);

  const expiringRows = await db('tenants')
    .where({ is_deleted: false })
    .whereBetween('expires_at', [now, thirtyDaysLater])
    .orderBy('expires_at', 'asc')
    .limit(10);

  // Compute real monthly status history for the past 6 months
  const monthlyTrend = [];
  const currentMonthDate = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - i, 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthLabel = d.toLocaleString('en-US', { month: 'short' });

    const activeCountRes = await db('tenants')
      .where({ is_deleted: false })
      .where('created_at', '<=', endOfMonth)
      .where({ status: 'ACTIVE' })
      .count('* as count')
      .first();

    const inactiveCountRes = await db('tenants')
      .where({ is_deleted: false })
      .where('created_at', '<=', endOfMonth)
      .whereNot({ status: 'ACTIVE' })
      .count('* as count')
      .first();

    monthlyTrend.push({
      month: monthLabel,
      activeShops: Number(activeCountRes?.count || 0),
      inactiveShops: Number(inactiveCountRes?.count || 0),
    });
  }

  return {
    counts,
    totalRevenue: 0,
    monthlyTrend,
    recentTenants: recentRows.map(formatTenant),
    expiringSoonList: expiringRows.map(formatTenant),
  };
};

export const getAllTenants = async (search = '') => {
  let query = db('tenants').where({ is_deleted: false });

  if (search) {
    const term = `%${search}%`;
    query = query.where((b) => {
      b.where('shop_name', 'like', term)
        .orWhere('owner_name', 'like', term)
        .orWhere('email', 'like', term);
    });
  }

  const rows = await query.orderBy('created_at', 'desc');
  const tenantIds = rows.map((r) => r.id);

  const ownerUsers =
    tenantIds.length > 0
      ? await db('users')
          .whereIn('tenant_id', tenantIds)
          .where({ is_deleted: false })
          .orderBy('id', 'asc')
      : [];

  const userMap = {};
  for (const u of ownerUsers) {
    if (!userMap[u.tenant_id]) {
      userMap[u.tenant_id] = u;
    }
  }

  return rows.map((r) =>
    formatTenant({
      ...r,
      owner_username: userMap[r.id]?.username || '',
    })
  );
};

export const getTenantById = async (id) => {
  const row = await db('tenants').where({ id, is_deleted: false }).first();
  if (!row) throw ApiError.notFound('Shop tenant account not found');

  const ownerUser = await db('users')
    .where({ tenant_id: id, is_deleted: false })
    .orderBy('id', 'asc')
    .first();

  return formatTenant({
    ...row,
    owner_username: ownerUser?.username || '',
  });
};

export const updateTenant = async (id, data) => {
  const row = await db('tenants').where({ id, is_deleted: false }).first();
  if (!row) throw ApiError.notFound('Shop tenant account not found');

  const updateFields = {};

  if (data.subdomain !== undefined) {
    const sub = data.subdomain ? data.subdomain.trim().toLowerCase() : null;
    if (sub) {
      const exists = await db('tenants')
        .where({ subdomain: sub, is_deleted: false })
        .whereNot({ id })
        .first();
      if (exists) throw ApiError.conflict(`Subdomain "${sub}" is already taken.`);
    }
    updateFields.subdomain = sub;
  }

  if (data.customDomain !== undefined) {
    const domain = data.customDomain ? data.customDomain.trim().toLowerCase() : null;
    if (domain) {
      const exists = await db('tenants')
        .where({ custom_domain: domain, is_deleted: false })
        .whereNot({ id })
        .first();
      if (exists) throw ApiError.conflict(`Custom domain "${domain}" is already in use.`);
    }
    updateFields.custom_domain = domain;
  }

  if (data.shopName !== undefined) updateFields.shop_name = data.shopName;
  if (data.ownerName !== undefined) updateFields.owner_name = data.ownerName;

  if (data.email !== undefined && data.email.trim()) {
    const emailLower = data.email.trim().toLowerCase();
    const emailExists = await db('tenants')
      .where({ email: emailLower, is_deleted: false })
      .whereNot({ id })
      .first();
    if (emailExists) throw ApiError.conflict(`Email "${emailLower}" is already used by another shop.`);
    updateFields.email = emailLower;
  }

  if (data.phone !== undefined) updateFields.phone = data.phone;
  if (data.plan !== undefined) updateFields.plan = data.plan;
  if (data.maxBranches !== undefined) updateFields.max_branches = data.maxBranches;
  if (data.maxUsers !== undefined) updateFields.max_users = data.maxUsers;
  if (data.expiresAt !== undefined) updateFields.expires_at = data.expiresAt ? new Date(data.expiresAt) : null;
  if (data.notes !== undefined) updateFields.notes = data.notes;
  if (data.nidNumber !== undefined) updateFields.nid_number = data.nidNumber;
  if (data.tradeLicenseNumber !== undefined) updateFields.trade_license_number = data.tradeLicenseNumber;

  if (Object.keys(updateFields).length > 0) {
    await db('tenants').where({ id }).update(updateFields);
  }

  // Sync associated primary owner user in users table
  const ownerUser = await db('users')
    .where({ tenant_id: id, is_deleted: false })
    .orderBy('id', 'asc')
    .first();

  if (ownerUser) {
    const userUpdate = {};

    if (data.username !== undefined && data.username.trim()) {
      const cleanUsername = data.username.trim().toLowerCase();
      const userExists = await db('users')
        .where({ username: cleanUsername, is_deleted: false })
        .whereNot({ id: ownerUser.id })
        .first();
      if (userExists) throw ApiError.conflict(`Username "${cleanUsername}" is already taken by another account.`);
      userUpdate.username = cleanUsername;
    }

    if (data.email !== undefined && data.email.trim()) {
      userUpdate.email = data.email.trim().toLowerCase();
    }

    if (data.ownerName !== undefined) {
      userUpdate.full_name = data.ownerName;
    }

    if (data.phone !== undefined) {
      userUpdate.phone = data.phone;
    }

    if (data.password !== undefined && data.password.trim()) {
      const passwordHash = await bcrypt.hash(data.password.trim(), 10);
      userUpdate.password_hash = passwordHash;
    }

    if (Object.keys(userUpdate).length > 0) {
      await db('users').where({ id: ownerUser.id }).update(userUpdate);
    }
  }

  if (data.shopName || data.phone || data.email || data.address || data.platformAddress) {
    await seedDefaultsForTenant(id, {
      shopName: data.shopName,
      phone: data.phone,
      email: data.email,
      address: data.address || data.platformAddress,
    });
  }

  return getTenantById(id);
};

/**
 * Helper: Generate unique subdomain slug
 */
async function generateUniqueSubdomain(shopName, initialSubdomain) {
  let slug = initialSubdomain?.trim().toLowerCase() || null;
  if (!slug) {
    slug = shopName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
  }

  if (slug) {
    let finalSlug = slug;
    let counter = 1;
    while (await db('tenants').where({ subdomain: finalSlug, is_deleted: false }).first()) {
      finalSlug = `${slug}-${counter++}`;
    }
    return finalSlug;
  }
  return null;
}

/**
 * Helper: Provision default ADMIN account for shop owner
 */
async function createShopOwnerAdminUser(tenantId, data, isSuperAdmin = false) {
  const emailLower = data.email.toLowerCase().trim();
  // Bug #6 fixed: Removed hardcoded '123456' default password. Password is now required.
  // In production, the caller (super admin form or self-registration) must always provide one.
  if (!data.password || data.password.trim().length < 6) {
    throw ApiError.badRequest('A secure password (min 6 characters) is required to create the shop admin account.');
  }
  const rawPassword = data.password;
  const passwordHash = await bcrypt.hash(rawPassword, 10);
  const baseUsername = (data.username || emailLower.split('@')[0] || `owner_${tenantId}`)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');

  let username = baseUsername;
  let counter = 1;
  while (await db('users').where({ username }).first()) {
    username = `${baseUsername}_${counter++}`;
  }

  const adminRole = await db('roles').where({ name: 'ADMIN' }).first();
  await db('users').insert({
    tenant_id: tenantId,
    username,
    email: emailLower,
    phone: data.phone || '',
    full_name: data.ownerName || data.shopName,
    password_hash: passwordHash,
    role_id: adminRole?.id || 1,
    role_name: 'ADMIN',
    is_active: isSuperAdmin ? true : false,
    is_verified: isSuperAdmin ? true : false,
    is_deleted: false,
  });
}

export const createTenant = async (data, isSuperAdmin = false) => {
  const emailLower = data.email.toLowerCase().trim();

  const existingTenant = await db('tenants').where({ email: emailLower }).first();
  if (existingTenant) {
    throw ApiError.conflict(`A shop tenant with email "${emailLower}" already exists in the system.`);
  }

  const subdomain = await generateUniqueSubdomain(data.shopName, data.subdomain);

  const customDomain = data.customDomain?.trim().toLowerCase() || null;
  if (customDomain) {
    const exists = await db('tenants').where({ custom_domain: customDomain, is_deleted: false }).first();
    if (exists) throw ApiError.conflict(`Custom domain "${customDomain}" is already in use.`);
  }

  let expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  if (!expiresAt) {
    const durationDays = data.durationDays ? Number(data.durationDays) : 30;
    expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  }

  const planName = (data.plan || 'STARTER').toUpperCase();
  let maxBranches = data.maxBranches !== undefined ? Number(data.maxBranches) : 2;
  let maxUsers = data.maxUsers !== undefined ? Number(data.maxUsers) : 5;
  if (data.maxBranches === undefined) {
    if (planName === 'ENTERPRISE') maxBranches = 999;
    else if (planName === 'PRO' || planName === 'BUSINESS') maxBranches = 5;
    else if (planName === 'FREE') maxBranches = 1;
  }
  if (data.maxUsers === undefined) {
    if (planName === 'ENTERPRISE') maxUsers = 999;
    else if (planName === 'PRO' || planName === 'BUSINESS') maxUsers = 20;
    else if (planName === 'FREE') maxUsers = 2;
  }

  const [insertedId] = await db('tenants').insert({
    shop_name: data.shopName,
    owner_name: data.ownerName,
    email: emailLower,
    phone: data.phone,
    plan: planName,
    max_branches: maxBranches,
    max_users: maxUsers,
    subdomain,
    custom_domain: customDomain,
    status: initialStatus,
    nid_number: data.nidNumber || '',
    trade_license_number: data.tradeLicenseNumber || '',
    expires_at: expiresAt,
    kyc_status: initialKycStatus,
    is_deleted: false,
  });

  // Provision shop owner ADMIN account
  await createShopOwnerAdminUser(insertedId, data, isSuperAdmin);

  // Automatically provision default Main Outlet branch for the new shop
  const [mainBranchId] = await db('branches').insert({
    tenant_id: insertedId,
    name: `${data.shopName} Main Outlet`,
    address: data.platformAddress || 'Main Shop Outlet',
    phone: data.phone || '',
    email: emailLower,
    is_active: true,
    is_deleted: false,
  });

  // Link owner user to default main branch
  await db('users').where({ tenant_id: insertedId }).update({ branch_id: mainBranchId });

  // Automatically sync shop owner admin user into Employees list
  const ownerUser = await db('users').where({ tenant_id: insertedId }).first();
  if (ownerUser) {
    await syncUserToEmployee(ownerUser.id, ownerUser, insertedId);
  }

  // Automatically provision default settings for the new shop tenant
  await seedDefaultsForTenant(insertedId, data);

  return getTenantById(insertedId);
};

export const purgeTenantData = async (tenantId) => {
  const tId = Number(tenantId);
  if (!tId || isNaN(tId)) return;

  // 1. Delete all active user sessions for this tenant
  const userIds = await db('users').where({ tenant_id: tId }).pluck('id');
  if (userIds.length > 0) {
    await db('sessions').whereIn('user_id', userIds).delete().catch(() => {});
  }

  // 2. Cascade delete all tenant-specific records across all tables with FK checks disabled
  const tenantTables = [
    'sale_items',
    'sale_payments',
    'sales',
    'purchase_order_items',
    'purchase_orders',
    'inventory_units',
    'imei_records',
    'stock_transfers',
    'products',
    'accounts',
    'attendances',
    'audit_logs',
    'branches',
    'catalog_items',
    'contact_messages',
    'customers',
    'document_vaults',
    'employees',
    'expenses',
    'expense_categories',
    'investor_transactions',
    'investors',
    'journal_entries',
    'leaves',
    'ledger_entries',
    'loan_repayments',
    'loans',
    'notifications',
    'payrolls',
    'repair_tickets',
    'settings',
    'suppliers',
    'temp_admins',
    'ticket_replies',
    'tickets',
    'transactions',
    'users',
    'warranty_claims',
    'wholesale_orders',
    'wholesale_prices',
  ];

  try {
    await db.raw('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of tenantTables) {
      try {
        await db(table).where({ tenant_id: tId }).delete();
      } catch (e) {
        // Table might not exist or doesn't have tenant_id column
      }
    }
    // 3. Finally hard delete the shop row from tenants table
    await db('tenants').where({ id: tId }).delete();
  } finally {
    await db.raw('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
  }
};

export const updateTenantStatus = async (id, status, rejectionReason) => {
  const row = await db('tenants').where({ id }).first();
  if (!row) throw ApiError.notFound('Shop account not found');

  if (status === 'DELETED') {
    await purgeTenantData(id);
    return { _id: String(id), id, isDeleted: true };
  }

  const updateFields = { status };
  if (rejectionReason) {
    updateFields.rejection_reason = rejectionReason;
  }
  await db('tenants').where({ id }).update(updateFields);

  if (status === 'ACTIVE') {
    await db('users').where({ tenant_id: id }).update({ is_active: true, is_verified: true, is_deleted: false });
  } else {
    // If PAUSED, SUSPENDED, PENDING_KYC, disable users
    await db('users').where({ tenant_id: id }).update({ is_active: false });
    const tenantUserIds = await db('users').where({ tenant_id: id }).pluck('id');
    if (tenantUserIds.length > 0) {
      await db('sessions').whereIn('user_id', tenantUserIds).delete().catch(() => {});
    }
  }

  return { ...formatTenant(row), ...updateFields };
};

export const verifyKyc = async (id, status, rejectionReason) => {
  const row = await db('tenants').where({ id, is_deleted: false }).first();
  if (!row) throw ApiError.notFound('Shop tenant account not found');

  const isApproved = status === 'APPROVED';
  const newTenantStatus = isApproved ? 'ACTIVE' : (status === 'REJECTED' ? 'REJECTED' : row.status);

  await db('tenants').where({ id }).update({
    kyc_status: status,
    status: newTenantStatus,
    rejection_reason: status === 'REJECTED' ? rejectionReason : null,
    reviewed_at: new Date(),
  });

  if (isApproved) {
    await db('users').where({ tenant_id: id }).update({
      is_active: true,
      is_verified: true,
      is_deleted: false,
    });
  } else if (status === 'REJECTED') {
    await db('users').where({ tenant_id: id }).update({ is_active: false });
  }

  return getTenantById(id);
};

export const getPublicTenantBySubdomain = async (subdomain) => {
  const clean = subdomain?.toLowerCase().trim();
  if (!clean) return null;
  const row = await db('tenants')
    .where({ is_deleted: false, status: 'ACTIVE' })
    .andWhere((b) => {
      b.where({ subdomain: clean }).orWhere({ custom_domain: clean });
    })
    .first();
  if (!row) return null;
  return {
    id: row.id,
    shopName: row.shop_name,
    subdomain: row.subdomain,
    logo: row.logo || null,
  };
};

export const uploadTenantLogo = async (id, file) => {
  const row = await db('tenants').where({ id, is_deleted: false }).first();
  if (!row) throw ApiError.notFound('Shop tenant account not found');
  if (!file) throw ApiError.badRequest('No logo file provided');

  const logoUrl = `/uploads/tenants/logos/${file.filename}`;
  await db('tenants').where({ id }).update({ logo: logoUrl });

  // Sync with tenant settings companyLogo as well
  await updateSettings({ companyLogo: logoUrl }, null, id);

  return getTenantById(id);
};

export const bulkDeleteTenants = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) return { deletedCount: 0 };
  const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
  for (const tId of numericIds) {
    await purgeTenantData(tId);
  }
  return { deletedCount: numericIds.length };
};

