import bcrypt from 'bcryptjs';
import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { seedDefaultsForTenant, updateSettings } from '../settings/settings.service.js';
import { syncUserToEmployee } from '../employee/employee.service.js';
import { sendShopRegistrationAdminEmail, sendShopOwnerWelcomeEmail } from '../../config/mailer.js';

export function formatTenant(row) {
  if (!row) return null;

  const planName = (row.plan || 'STARTER').toUpperCase();
  let defaultUsers = 5;

  if (planName === 'ENTERPRISE') {
    defaultUsers = 999;
  } else if (planName === 'PRO' || planName === 'BUSINESS') {
    defaultUsers = 20;
  } else if (planName === 'FREE') {
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
    status: row.status || 'ACTIVE',
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
  const pausedRes = await db('tenants').where({ is_deleted: false, status: 'SUSPENDED' }).count('* as count').first();
  const pendingKycRes = { count: 0 };

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
    const isYearly = (data.billingCycle || '').toLowerCase() === 'yearly';
    const durationDays = data.durationDays ? Number(data.durationDays) : (isYearly ? 365 : 30);
    expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  }

  const rawPlan = data.plan || data.selectedPlan || 'STARTER';
  const planName = String(rawPlan).toUpperCase();
  let maxUsers = data.maxUsers !== undefined ? Number(data.maxUsers) : 5;
  if (data.maxUsers === undefined) {
    if (planName === 'ENTERPRISE') maxUsers = 999;
    else if (planName === 'PRO' || planName === 'BUSINESS') maxUsers = 20;
    else if (planName === 'FREE') maxUsers = 2;
  }

  const initialStatus = data.status || 'ACTIVE';
  const initialKycStatus = data.kycStatus || (isSuperAdmin ? 'APPROVED' : 'PENDING');

  const [insertedId] = await db('tenants').insert({
    shop_name: data.shopName,
    owner_name: data.ownerName,
    email: emailLower,
    phone: data.phone,
    plan: planName,
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

  // Automatically sync shop owner admin user into Employees list
  const ownerUser = await db('users').where({ tenant_id: insertedId }).first();
  if (ownerUser) {
    await syncUserToEmployee(ownerUser.id, ownerUser, insertedId);
  }

  // Automatically provision default settings for the new shop tenant
  await seedDefaultsForTenant(insertedId, data);

  const newTenant = await getTenantById(insertedId);

  // Send platform admin alert for new shop registration & welcome email to owner
  sendShopRegistrationAdminEmail({
    ...data,
    id: insertedId,
    email: emailLower,
    plan: planName,
    subdomain,
    status: initialStatus,
    kycStatus: initialKycStatus,
  }).catch((err) => console.error('[Shop Reg Admin Mailer Error]:', err.message));

  sendShopOwnerWelcomeEmail(emailLower, data.ownerName, {
    shopName: data.shopName,
    subdomain,
    plan: planName,
  }).catch((err) => console.error('[Shop Welcome Mailer Error]:', err.message));

  return newTenant;
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
    // If SUSPENDED or DELETED, disable users
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
    .where({ is_deleted: false })
    .andWhere((b) => {
      b.where({ subdomain: clean }).orWhere({ custom_domain: clean });
    })
    .first();
  if (!row) return null;

  let logo = row.logo || null;
  let loginAnimation = 'waves';

  const settingRows = await db('settings')
    .where({ tenant_id: row.id })
    .whereIn('key', ['companyLogo', 'loginAnimation']);

  for (const s of settingRows) {
    if (s.key === 'companyLogo' && !logo && s.value) {
      try {
        logo = JSON.parse(s.value);
      } catch {
        logo = s.value;
      }
    } else if (s.key === 'loginAnimation' && s.value) {
      try {
        loginAnimation = JSON.parse(s.value);
      } catch {
        loginAnimation = s.value;
      }
    }
  }

  const platformRows = await db('settings')
    .where({ tenant_id: null })
    .whereIn('key', ['platformPhone', 'platformWhatsApp', 'platformEmail', 'platformName', 'platformAddress']);

  const platformSupport = {
    name: 'OmniManage ERP',
    phone: '+880 1700-000000',
    whatsapp: '+880 1700-000000',
    email: 'support@omnimanage.bd',
  };

  for (const p of platformRows) {
    let val = p.value;
    try {
      val = JSON.parse(p.value);
    } catch {
      // keep raw string
    }
    if (p.key === 'platformName' && val) platformSupport.name = val;
    if (p.key === 'platformPhone' && val) platformSupport.phone = val;
    if (p.key === 'platformWhatsApp' && val) platformSupport.whatsapp = val;
    if (p.key === 'platformEmail' && val) platformSupport.email = val;
  }

  return {
    id: row.id,
    shopName: row.shop_name,
    subdomain: row.subdomain,
    customDomain: row.custom_domain || null,
    status: row.status || 'ACTIVE',
    expiresAt: row.expires_at || null,
    logo: logo || null,
    loginAnimation: loginAnimation || 'waves',
    platformSupport,
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

export const uploadKycDocuments = async (id, files) => {
  const row = await db('tenants').where({ id, is_deleted: false }).first();
  if (!row) throw ApiError.notFound('Shop tenant account not found');

  const updateFields = {};
  if (files?.nidFront?.[0]) updateFields.nid_front = `/uploads/tenants/kyc/${files.nidFront[0].filename}`;
  if (files?.nidBack?.[0]) updateFields.nid_back = `/uploads/tenants/kyc/${files.nidBack[0].filename}`;
  if (files?.tradeLicenseFile?.[0]) updateFields.trade_license_file = `/uploads/tenants/kyc/${files.tradeLicenseFile[0].filename}`;
  if (files?.tinCertificate?.[0]) updateFields.tin_certificate = `/uploads/tenants/kyc/${files.tinCertificate[0].filename}`;

  if (Object.keys(updateFields).length > 0) {
    updateFields.kyc_status = 'PENDING';
    await db('tenants').where({ id }).update(updateFields);
  }

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

