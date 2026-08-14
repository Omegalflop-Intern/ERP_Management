import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Check,
  X,
  Zap,
  Building2,
  Star,
  Crown,
  ArrowRight,
  Smartphone,
  Users,
  GitBranch,
  BarChart3,
  Shield,
  Headphones,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

// ─── Static fallback (mirrors server DEFAULT_PLANS) ──────────────────────────
const FALLBACK_PLANS = [
  {
    name: 'FREE',
    displayName: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxBranches: 1,
    maxUsers: 2,
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

// ─── Plan visual config ───────────────────────────────────────────────────────
const PLAN_CONFIG = {
  FREE: {
    icon: Smartphone,
    gradient: 'from-slate-500 to-slate-600',
    badge: null,
    cta: 'Get Started Free',
    highlight: false,
  },
  STARTER: {
    icon: Zap,
    gradient: 'from-blue-500 to-indigo-600',
    badge: 'Most Popular',
    cta: 'Start Free Trial',
    highlight: true,
  },
  PRO: {
    icon: Star,
    gradient: 'from-violet-500 to-purple-600',
    badge: 'Best Value',
    cta: 'Go Pro',
    highlight: false,
  },
  ENTERPRISE: {
    icon: Crown,
    gradient: 'from-amber-500 to-orange-600',
    badge: 'Custom Pricing',
    cta: 'Contact Sales',
    highlight: false,
  },
};

// ─── FAQ data ─────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Can I switch plans later?',
    a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.',
  },
  {
    q: 'Is there a free trial?',
    a: 'The Free plan is available forever with no credit card required. Paid plans come with a 14-day free trial.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept bKash, Nagad, Rocket, bank transfer, and all major debit/credit cards.',
  },
  {
    q: 'Is my data secure?',
    a: "All data is encrypted at rest and in transit. Each shop's data is fully isolated — no cross-tenant access is possible.",
  },
  {
    q: 'Can I add more users or branches?',
    a: 'Each plan has a user and branch limit. You can upgrade your plan or contact us for a custom add-on.',
  },
  {
    q: 'What happens when I cancel?',
    a: 'Your shop data is retained for 30 days after cancellation so you can export or reactivate. After that it is permanently deleted.',
  },
];

// ─── Feature comparison table data ───────────────────────────────────────────
const COMPARISON_FEATURES = [
  { label: 'POS & Sales', free: true, starter: true, pro: true, enterprise: true },
  { label: 'Product & Inventory', free: true, starter: true, pro: true, enterprise: true },
  { label: 'IMEI / Serial Tracking', free: false, starter: true, pro: true, enterprise: true },
  { label: 'Customer CRM', free: false, starter: true, pro: true, enterprise: true },
  { label: 'Purchase Orders', free: false, starter: true, pro: true, enterprise: true },
  { label: 'Repair Job Sheets', free: false, starter: true, pro: true, enterprise: true },
  { label: 'Wholesale Orders', free: false, starter: false, pro: true, enterprise: true },
  { label: 'Double-Entry Accounting', free: false, starter: false, pro: true, enterprise: true },
  { label: 'Payroll & HR', free: false, starter: false, pro: true, enterprise: true },
  { label: 'Document Vault', free: false, starter: false, pro: true, enterprise: true },
  { label: 'API Access', free: false, starter: false, pro: false, enterprise: true },
  { label: 'Custom Branding', free: false, starter: false, pro: false, enterprise: true },
  { label: 'Dedicated Account Manager', free: false, starter: false, pro: false, enterprise: true },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
const formatPrice = (price) =>
  new Intl.NumberFormat('bn-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 })
    .format(price)
    .replace('BDT', '৳');

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlanCard({ plan, billing, onSelect }) {
  const cfg = PLAN_CONFIG[plan.name] || PLAN_CONFIG.FREE;
  const Icon = cfg.icon;
  const isEnterprise = plan.name === 'ENTERPRISE';
  const price = billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  const displayPrice = isEnterprise ? null : price;
  const saving =
    billing === 'yearly' && plan.monthlyPrice > 0
      ? Math.round(((plan.monthlyPrice * 12 - plan.yearlyPrice) / (plan.monthlyPrice * 12)) * 100)
      : 0;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl
        ${
          cfg.highlight
            ? 'border-blue-500 shadow-blue-500/20 shadow-xl dark:bg-blue-950/10 bg-blue-50/50'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
        }`}
    >
      {/* Popular badge */}
      {cfg.badge && (
        <div
          className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${cfg.gradient} shadow-md whitespace-nowrap`}
        >
          {cfg.badge}
        </div>
      )}

      <div className="p-6 flex flex-col gap-4 flex-1">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${cfg.gradient} shadow`}>
            <Icon size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
              {plan.displayName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {plan.maxUsers >= 999 ? 'Unlimited users' : `Up to ${plan.maxUsers} users`}
              {' · '}
              {plan.maxBranches >= 999
                ? 'Unlimited branches'
                : `${plan.maxBranches} branch${plan.maxBranches > 1 ? 'es' : ''}`}
            </p>
          </div>
        </div>

        {/* Price */}
        <div className="border-t border-b border-gray-100 dark:border-gray-800 py-4">
          {isEnterprise ? (
            <div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">Custom</span>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Tailored to your needs
              </p>
            </div>
          ) : displayPrice === 0 ? (
            <div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">Free</span>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Forever, no credit card
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(displayPrice)}
                </span>
                <span className="text-gray-400 dark:text-gray-500 text-sm mb-1">
                  /{billing === 'yearly' ? 'yr' : 'mo'}
                </span>
              </div>
              {billing === 'yearly' && saving > 0 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                  Save {saving}% vs monthly
                </p>
              )}
              {billing === 'monthly' && plan.yearlyPrice > 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {formatPrice(plan.yearlyPrice)}/yr billed annually
                </p>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="flex flex-col gap-2.5 flex-1">
          {plan.features.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300"
            >
              <Check size={15} className="text-emerald-500 mt-0.5 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={() => onSelect(plan)}
          className={`mt-4 w-full py-3 px-5 rounded-xl font-semibold text-sm transition-all duration-200
            ${
              cfg.highlight
                ? `bg-gradient-to-r ${cfg.gradient} text-white hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02]`
                : isEnterprise
                  ? `bg-gradient-to-r ${cfg.gradient} text-white hover:shadow-lg hover:scale-[1.02]`
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
          <span className="flex items-center justify-center gap-2">
            {cfg.cta}
            <ArrowRight size={15} />
          </span>
        </button>
      </div>
    </div>
  );
}

function ComparisonTable({ plans }) {
  const order = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
  const sorted = [...plans].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 w-1/3">
              Feature
            </th>
            {sorted.map((plan) => {
              const cfg = PLAN_CONFIG[plan.name] || {};
              return (
                <th
                  key={plan.name}
                  className={`p-4 font-semibold text-center bg-gray-50 dark:bg-gray-800/50
                    ${plan.name === 'STARTER' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  {plan.displayName}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_FEATURES.map((row, i) => (
            <tr
              key={i}
              className={`border-b border-gray-100 dark:border-gray-800 last:border-0
                ${i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}
            >
              <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">{row.label}</td>
              {sorted.map((plan) => {
                const key = plan.name.toLowerCase();
                const has = row[key];
                return (
                  <td key={plan.name} className="p-4 text-center">
                    {has ? (
                      <Check size={17} className="text-emerald-500 mx-auto" />
                    ) : (
                      <X size={17} className="text-gray-300 dark:text-gray-600 mx-auto" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-medium text-gray-900 dark:text-white text-sm">{faq.q}</span>
        {open ? (
          <ChevronUp size={16} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {faq.a}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [billing, setBilling] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/plans');
        if (res.data?.data?.length) {
          setPlans(res.data.data);
        }
      } catch {
        // silently fall back to static defaults
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSelect = (plan) => {
    if (plan.name === 'ENTERPRISE') {
      // Scroll to contact / show toast for now
      toast.info('Please contact us at sales@omnimanage.bd for Enterprise pricing.');
      return;
    }
    navigate('/register-shop', { state: { selectedPlan: plan.name } });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* ── Nav bar ── */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Smartphone size={14} className="text-white" />
            </div>
            Omni-Manage
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register-shop"
              className="text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-20">
        {/* ── Hero ── */}
        <div className="text-center space-y-5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
            <Sparkles size={13} />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Choose the right plan for{' '}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
              your shop
            </span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
            Start free. Upgrade as you grow. No hidden fees, no contracts. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                billing === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                billing === 'yearly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Yearly
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-semibold">
                Save up to 17%
              </span>
            </button>
          </div>
        </div>

        {/* ── Plan cards ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-96 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {plans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} billing={billing} onSelect={handleSelect} />
            ))}
          </div>
        )}

        {/* ── Trust badges ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-4 border-y border-gray-200 dark:border-gray-800">
          {[
            { icon: Shield, label: 'Fully Secure', sub: 'Data encrypted at rest & transit' },
            { icon: Users, label: 'Multi-User', sub: 'Role-based access control' },
            { icon: GitBranch, label: 'Multi-Branch', sub: 'Manage all locations in one place' },
            { icon: Headphones, label: '24/7 Support', sub: 'Email, chat, and phone' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Icon size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Feature comparison table ── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Compare all features</h2>
            <button
              onClick={() => setShowComparison((p) => !p)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              {showComparison ? 'Hide' : 'Show'} comparison
              {showComparison ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
          {showComparison && !loading && <ComparisonTable plans={plans} />}
          {!showComparison && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click "Show comparison" to see a full feature breakdown across all plans.
            </p>
          )}
        </div>

        {/* ── FAQ ── */}
        <div className="space-y-6 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center">Frequently asked questions</h2>
          <div className="flex flex-col gap-3">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} faq={faq} />
            ))}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-center text-white space-y-5">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="text-blue-100 max-w-md mx-auto">
            Join hundreds of mobile &amp; gadget shops already running on Omni-Manage. Start free today — no
            credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register-shop"
              className="px-8 py-3 rounded-xl bg-white text-blue-700 font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow"
            >
              Create Free Account
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 rounded-xl border border-white/30 text-white hover:bg-white/10 transition-colors font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} Omni-Manage. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link
              to="/login"
              className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register-shop"
              className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Register
            </Link>
            <a
              href="mailto:sales@omnimanage.bd"
              className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
