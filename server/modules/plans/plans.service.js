import { SubscriptionPlan } from '../tenant/subscription.model.js';

/**
 * Default plan definitions used as fallback if the DB has no seeded plans yet.
 * These exactly match what seedSubscriptionPlans() inserts.
 */
export const DEFAULT_PLANS = [
  {
    name: 'FREE',
    displayName: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxBranches: 1,
    maxUsers: 2,
    isActive: true,
    features: [
      'POS & Sales',
      'Product & Inventory',
      'Up to 2 Users',
      '1 Branch',
      'Basic Reports',
      'Email Support',
    ],
  },
  {
    name: 'STARTER',
    displayName: 'Starter',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    maxBranches: 2,
    maxUsers: 5,
    isActive: true,
    features: [
      'Everything in Free',
      'IMEI / Serial Tracking',
      'Customer CRM & Due',
      'Supplier Management',
      'Purchase Orders',
      'Up to 5 Users',
      '2 Branches',
      'Repair Job Sheets',
      'SMS & Email Invoices',
      'Priority Email Support',
    ],
  },
  {
    name: 'PRO',
    displayName: 'Pro',
    monthlyPrice: 2499,
    yearlyPrice: 24990,
    maxBranches: 5,
    maxUsers: 20,
    isActive: true,
    features: [
      'Everything in Starter',
      'Double-Entry Accounting',
      'Payroll & HR Module',
      'Attendance Tracking',
      'Leave Management',
      'Wholesale Orders',
      'Warranty Claims',
      'Investor & Loan Tracking',
      'Document Vault',
      'Up to 20 Users',
      '5 Branches',
      'Advanced Analytics',
      'Chat Support',
    ],
  },
  {
    name: 'ENTERPRISE',
    displayName: 'Enterprise',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxBranches: 999,
    maxUsers: 999,
    isActive: true,
    features: [
      'Everything in Pro',
      'Unlimited Branches',
      'Unlimited Users',
      'Custom Branding & Logo',
      'API Access',
      'Dedicated Account Manager',
      'Custom Integrations',
      'SLA Guarantee',
      'On-premise Option',
      'Priority Phone Support',
    ],
  },
];

/**
 * Returns active subscription plans from DB.
 * Falls back to DEFAULT_PLANS if the collection is empty (before first seed).
 */
export const getActivePlans = async () => {
  const plans = await SubscriptionPlan.find({ isActive: true })
    .sort({ monthlyPrice: 1 })
    .lean();

  if (plans.length > 0) return plans;

  // DB not seeded yet — return static defaults so the pricing page works immediately
  return DEFAULT_PLANS;
};

/**
 * Upserts all default plans into the DB.
 * Safe to run multiple times (idempotent).
 */
export const seedSubscriptionPlans = async () => {
  for (const plan of DEFAULT_PLANS) {
    await SubscriptionPlan.findOneAndUpdate(
      { name: plan.name },
      { $set: plan },
      { upsert: true, new: true }
    );
  }
};
