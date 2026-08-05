import { SubscriptionPlan } from '../tenant/subscription.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';

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
    features: ['Everything in Pro', 'Unlimited Branches', 'Unlimited Users', 'Custom Branding & Logo', 'API Access', 'Dedicated Account Manager', 'Custom Integrations', 'SLA Guarantee', 'On-premise Option', 'Priority Phone Support'],
  },
];

export const getAllPlans = async (page = 1, limit = 50) => {
  const query = {};
  const total = await SubscriptionPlan.countDocuments(query);
  const plans = await paginate(SubscriptionPlan.find(query).sort({ sortOrder: 1, monthlyPrice: 1 }), page, limit).lean();
  return { plans, pagination: getPagination(total, page, limit) };
};

export const getActivePlans = async () => {
  const plans = await SubscriptionPlan.find({ isActive: true }).sort({ sortOrder: 1, monthlyPrice: 1 }).lean();
  if (plans.length > 0) return plans;
  return DEFAULT_PLANS;
};

export const getPlanById = async (id) => {
  const plan = await SubscriptionPlan.findById(id).lean();
  if (!plan) throw ApiError.notFound('Plan not found');
  return plan;
};

export const createPlan = async (data) => {
  const existing = await SubscriptionPlan.findOne({ name: data.name.toUpperCase() });
  if (existing) throw ApiError.conflict(`Plan "${data.name}" already exists`);
  return SubscriptionPlan.create({ ...data, name: data.name.toUpperCase() });
};

export const updatePlan = async (id, data) => {
  const plan = await SubscriptionPlan.findById(id);
  if (!plan) throw ApiError.notFound('Plan not found');
  if (data.name && data.name.toUpperCase() !== plan.name) {
    const dup = await SubscriptionPlan.findOne({ name: data.name.toUpperCase(), _id: { $ne: id } });
    if (dup) throw ApiError.conflict(`Plan "${data.name}" already exists`);
    data.name = data.name.toUpperCase();
  }
  Object.assign(plan, data);
  await plan.save();
  return plan;
};

export const deletePlan = async (id) => {
  const plan = await SubscriptionPlan.findById(id);
  if (!plan) throw ApiError.notFound('Plan not found');
  if (plan.name === 'FREE') throw ApiError.badRequest('Cannot delete the Free plan');
  await SubscriptionPlan.findByIdAndDelete(id);
};

export const togglePlanActive = async (id) => {
  const plan = await SubscriptionPlan.findById(id);
  if (!plan) throw ApiError.notFound('Plan not found');
  if (plan.name === 'FREE') throw ApiError.badRequest('Cannot deactivate the Free plan');
  plan.isActive = !plan.isActive;
  await plan.save();
  return plan;
};

export const seedSubscriptionPlans = async () => {
  for (const plan of DEFAULT_PLANS) {
    await SubscriptionPlan.findOneAndUpdate(
      { name: plan.name },
      { $set: plan },
      { upsert: true, new: true }
    );
  }
};
