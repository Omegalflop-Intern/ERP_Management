import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';

export function formatSubscriptionPlan(row) {
  if (!row) return null;
  let features = row.features;
  if (typeof features === 'string') {
    try { features = JSON.parse(features); } catch { features = []; }
  }
  return {
    _id: String(row.id),
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    description: row.description || '',
    monthlyPrice: Number(row.monthly_price || 0),
    yearlyPrice: Number(row.yearly_price || 0),
    trialDays: Number(row.trial_days || 0),
    maxBranches: Number(row.max_branches || 1),
    maxUsers: Number(row.max_users || 2),
    maxProducts: Number(row.max_products || 500),
    maxCustomers: Number(row.max_customers || 200),
    maxStorageMB: Number(row.max_storage_mb || 100),
    sortOrder: Number(row.sort_order || 0),
    features: Array.isArray(features) ? features : [],
    isPublic: Boolean(row.is_public !== undefined ? row.is_public : true),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const DEFAULT_PLANS = [
  {
    name: 'FREE',
    displayName: 'Free',
    description: 'Perfect for small shops getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    trialDays: 0,
    maxBranches: 1,
    maxUsers: 2,
    maxProducts: 500,
    maxCustomers: 200,
    maxStorageMB: 100,
    sortOrder: 0,
    isPublic: true,
    features: ['POS & Sales', 'Product & Inventory', 'Up to 2 Users', '1 Branch', 'Basic Reports', 'Email Support'],
  },
  {
    name: 'STARTER',
    displayName: 'Starter',
    description: 'For growing shops that need more features',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    trialDays: 14,
    maxBranches: 2,
    maxUsers: 5,
    maxProducts: 2000,
    maxCustomers: 1000,
    maxStorageMB: 500,
    sortOrder: 1,
    isPublic: true,
    features: ['Everything in Free', 'IMEI / Serial Tracking', 'Customer CRM & Due', 'Supplier Management', 'Purchase Orders', 'Up to 5 Users', '2 Branches', 'Repair Job Sheets', 'SMS & Email Invoices', 'Priority Email Support'],
  },
  {
    name: 'PRO',
    displayName: 'Pro',
    description: 'For established businesses with multiple branches',
    monthlyPrice: 2499,
    yearlyPrice: 24990,
    trialDays: 14,
    maxBranches: 5,
    maxUsers: 20,
    maxProducts: 10000,
    maxCustomers: 5000,
    maxStorageMB: 2000,
    sortOrder: 2,
    isPublic: true,
    features: ['Everything in Starter', 'Double-Entry Accounting', 'Payroll & HR Module', 'Attendance Tracking', 'Leave Management', 'Wholesale Orders', 'Warranty Claims', 'Investor & Loan Tracking', 'Document Vault', 'Up to 20 Users', '5 Branches', 'Advanced Analytics', 'Chat Support'],
  },
  {
    name: 'ENTERPRISE',
    displayName: 'Enterprise',
    description: 'Unlimited everything for large operations',
    monthlyPrice: 0,
    yearlyPrice: 0,
    trialDays: 30,
    maxBranches: 999,
    maxUsers: 999,
    maxProducts: -1,
    maxCustomers: -1,
    maxStorageMB: -1,
    sortOrder: 3,
    isPublic: true,
    features: ['Everything in Pro', 'Unlimited Branches', 'Unlimited Users', 'Custom Branding & Logo', 'API Access', 'Dedicated Account Manager', 'Custom Integrations', 'SLA Guarantee', 'On-premise Option', 'Priority Phone Support'],
  },
];

export const getAllPlans = async (page = 1, limit = 50) => {
  const countRes = await db('subscription_plans').count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const rows = await db('subscription_plans').orderBy('sort_order', 'asc').limit(limit).offset(offset);
  const plans = rows.map(formatSubscriptionPlan);

  return { plans, pagination: getPagination(total, page, limit) };
};

export const getActivePlans = async () => {
  const rows = await db('subscription_plans')
    .where({ is_active: true, is_public: true })
    .orderBy('sort_order', 'asc');
  if (rows.length > 0) return rows.map(formatSubscriptionPlan);
  return DEFAULT_PLANS.filter(p => p.isPublic !== false);
};

export const getPlanById = async (id) => {
  const row = await db('subscription_plans').where({ id }).first();
  if (!row) throw ApiError.notFound('Plan not found');
  return formatSubscriptionPlan(row);
};

export const createPlan = async (data) => {
  const name = data.name.toUpperCase();
  const existing = await db('subscription_plans').where({ name }).first();
  if (existing) throw ApiError.conflict(`Plan "${name}" already exists`);

  const [insertedId] = await db('subscription_plans').insert({
    name,
    display_name: data.displayName || name,
    description: data.description || '',
    monthly_price: data.monthlyPrice !== undefined ? Number(data.monthlyPrice) : 0,
    yearly_price: data.yearlyPrice !== undefined ? Number(data.yearlyPrice) : 0,
    trial_days: data.trialDays !== undefined ? Number(data.trialDays) : 0,
    max_branches: data.maxBranches !== undefined ? Number(data.maxBranches) : 1,
    max_users: data.maxUsers !== undefined ? Number(data.maxUsers) : 2,
    max_products: data.maxProducts !== undefined ? Number(data.maxProducts) : 500,
    max_customers: data.maxCustomers !== undefined ? Number(data.maxCustomers) : 200,
    max_storage_mb: data.maxStorageMB !== undefined ? Number(data.maxStorageMB) : 100,
    sort_order: data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
    features: JSON.stringify(data.features || []),
    is_public: data.isPublic !== undefined ? Boolean(data.isPublic) : true,
    is_active: data.isActive !== undefined ? Boolean(data.isActive) : true,
  });

  return getPlanById(insertedId);
};

export const updatePlan = async (id, data) => {
  const plan = await getPlanById(id);
  if (!plan) throw ApiError.notFound('Plan not found');

  const updateFields = {};
  if (data.displayName !== undefined) updateFields.display_name = data.displayName;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.monthlyPrice !== undefined) updateFields.monthly_price = Number(data.monthlyPrice);
  if (data.yearlyPrice !== undefined) updateFields.yearly_price = Number(data.yearlyPrice);
  if (data.trialDays !== undefined) updateFields.trial_days = Number(data.trialDays);
  if (data.maxBranches !== undefined) updateFields.max_branches = Number(data.maxBranches);
  if (data.maxUsers !== undefined) updateFields.max_users = Number(data.maxUsers);
  if (data.maxProducts !== undefined) updateFields.max_products = Number(data.maxProducts);
  if (data.maxCustomers !== undefined) updateFields.max_customers = Number(data.maxCustomers);
  if (data.maxStorageMB !== undefined) updateFields.max_storage_mb = Number(data.maxStorageMB);
  if (data.sortOrder !== undefined) updateFields.sort_order = Number(data.sortOrder);
  if (data.features !== undefined) updateFields.features = JSON.stringify(data.features);
  if (data.isPublic !== undefined) updateFields.is_public = Boolean(data.isPublic);
  if (data.isActive !== undefined) updateFields.is_active = Boolean(data.isActive);

  if (Object.keys(updateFields).length > 0) {
    await db('subscription_plans').where({ id }).update(updateFields);
  }

  return getPlanById(id);
};

export const deletePlan = async (id) => {
  const plan = await getPlanById(id);
  if (!plan) throw ApiError.notFound('Plan not found');
  if (plan.name === 'FREE') throw ApiError.badRequest('Cannot delete the Free plan');
  await db('subscription_plans').where({ id }).delete();
  return { id };
};

export const togglePlanActive = async (id) => {
  const plan = await getPlanById(id);
  if (!plan) throw ApiError.notFound('Plan not found');
  if (plan.name === 'FREE') throw ApiError.badRequest('Cannot deactivate the Free plan');

  await db('subscription_plans').where({ id }).update({ is_active: !plan.isActive });
  return getPlanById(id);
};

export const seedSubscriptionPlans = async () => {
  for (const plan of DEFAULT_PLANS) {
    const existing = await db('subscription_plans').where({ name: plan.name }).first();
    if (!existing) {
      await db('subscription_plans').insert({
        name: plan.name,
        display_name: plan.displayName,
        description: plan.description,
        monthly_price: plan.monthlyPrice,
        yearly_price: plan.yearlyPrice,
        trial_days: plan.trialDays,
        max_branches: plan.maxBranches,
        max_users: plan.maxUsers,
        max_products: plan.maxProducts,
        max_customers: plan.maxCustomers,
        max_storage_mb: plan.maxStorageMB,
        sort_order: plan.sortOrder,
        features: JSON.stringify(plan.features),
        is_active: true,
      });
    }
  }
};
