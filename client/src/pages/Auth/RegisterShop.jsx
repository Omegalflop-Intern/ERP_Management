import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Building2,
  Smartphone,
  User,
  Mail,
  Phone,
  Lock,
  Upload,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  FileText,
  MessageSquare,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  X,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import ThemeToggle from '../../components/ui/ThemeToggle';
import api from '../../lib/api';
import PasswordInput from '../../components/ui/PasswordInput';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    branches: '1 Branch',
    users: '2 Staff Users',
    features: ['1 Branch / Outlet', '2 Staff Users', 'Up to 500 Products', 'Basic POS Billing'],
  },
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    branches: '2 Branches',
    users: '5 Staff Users',
    features: [
      '2 Branches',
      '5 Staff Users',
      '2,000 Products & IMEIs',
      'IMEI History Passport',
      'Customer Due SMS',
    ],
    isPopular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 2499,
    yearlyPrice: 24990,
    branches: '5 Branches',
    users: '20 Staff Users',
    features: [
      '5 Branches',
      '20 Staff Users',
      '10,000 IMEIs',
      'Double-Entry Accounting',
      'HR & Payroll',
      'Wholesale Tiers',
    ],
    isPopular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 'Custom',
    yearlyPrice: 'Custom',
    branches: 'Unlimited',
    users: 'Unlimited',
    features: [
      'Unlimited Branches',
      'Unlimited Users',
      'Dedicated Account Manager',
      'Custom Domain',
      '24/7 SLA Uptime',
    ],
  },
];

export default function RegisterShop() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultPlanParam = searchParams.get('plan') || 'pro';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(defaultPlanParam.toLowerCase());
  const [billingCycle, setBillingCycle] = useState('yearly');

  const [registeredTenantData, setRegisteredTenantData] = useState(null);
  const [showActivationModal, setShowActivationModal] = useState(false);

  const [platformSettings, setPlatformSettings] = useState({
    platformName: 'OmniManage ERP',
    platformPhone: '+880 1700-000000',
    platformWhatsApp: '+880 1700-000000',
    platformEmail: 'support@omnimanage.bd',
    activationInstructions:
      'Thank you for registering your shop! Please contact our platform support team to verify your payment and activate your shop account.',
    bkashNumber: '01700000000',
    nagadNumber: '01700000000',
  });

  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const res = await api.get('/settings/public');
        if (res.data?.data) {
          setPlatformSettings((prev) => ({ ...prev, ...res.data.data }));
        }
      } catch {}
    };
    fetchPublicSettings();
  }, []);

  const [form, setForm] = useState({
    shopName: '',
    ownerName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    nidNumber: '',
    tradeLicenseNumber: '',
  });

  const [files, setFiles] = useState({
    logo: null,
    nidFront: null,
    nidBack: null,
    tradeLicenseFile: null,
    tinCertificate: null,
  });

  const handleFileChange = (e, key) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error('File size exceeds 15MB limit');
        return;
      }
      setFiles((prev) => ({ ...prev, [key]: file }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Create Tenant Account
      const res = await api.post('/tenants', {
        shopName: form.shopName,
        ownerName: form.ownerName,
        username: form.username,
        email: form.email,
        phone: form.phone,
        nidNumber: form.nidNumber,
        tradeLicenseNumber: form.tradeLicenseNumber,
        password: form.password,
        selectedPlan,
        billingCycle,
      });

      const tenantData = res.data?.data;
      const tenantId = tenantData?._id;

      // Upload Shop Logo if provided
      if (tenantId && files.logo) {
        const logoFd = new FormData();
        logoFd.append('logo', files.logo);
        await api.post(`/tenants/${tenantId}/logo-upload`, logoFd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Upload KYC Documents if files provided
      if (tenantId && (files.nidFront || files.tradeLicenseFile)) {
        const fd = new FormData();
        if (files.nidFront) fd.append('nidFront', files.nidFront);
        if (files.nidBack) fd.append('nidBack', files.nidBack);
        if (files.tradeLicenseFile) fd.append('tradeLicenseFile', files.tradeLicenseFile);
        if (files.tinCertificate) fd.append('tinCertificate', files.tinCertificate);

        await api.post(`/tenants/${tenantId}/kyc-upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      const shopRefCode = `SHOP-${Math.floor(100000 + Math.random() * 900000)}`;

      setRegisteredTenantData({
        ...tenantData,
        shopRefCode,
        selectedPlan,
        billingCycle,
        email: form.email,
        phone: form.phone,
        shopName: form.shopName,
      });

      setShowActivationModal(true);
      toast.success('Shop registration submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const currentPlanObj = PLANS.find((p) => p.id === selectedPlan) || PLANS[2];
  const whatsappMsg = registeredTenantData
    ? encodeURIComponent(
        `Hello Support, I just registered my shop "${registeredTenantData.shopName}" (Ref: ${registeredTenantData.shopRefCode}) on ${registeredTenantData.selectedPlan.toUpperCase()} plan (${registeredTenantData.billingCycle}). Please activate my shop account.`
      )
    : '';

  const whatsappCleanNumber = platformSettings.platformWhatsApp.replace(/[^0-9]/g, '');

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#050810] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-indigo-50/50 to-blue-50/40 dark:from-[#050810] dark:via-[#0b0f19] dark:to-[#050810] z-0" />
      <div className="absolute w-[500px] h-[500px] -top-40 -left-40 rounded-full blur-[120px] bg-blue-500/10 dark:bg-blue-600/15 animate-drift pointer-events-none" />
      <div
        className="absolute w-[400px] h-[400px] -bottom-32 -right-32 rounded-full blur-[100px] bg-cyan-500/10 dark:bg-cyan-500/8 animate-drift pointer-events-none"
        style={{ animationDelay: '3s' }}
      />

      {/* Top Bar Controls */}
      <div className="absolute top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-3xl bg-white/90 dark:bg-slate-900/70 border border-white/80 dark:border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 backdrop-blur-[36px] relative z-10 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-white/90 dark:bg-blue-500/20 border border-slate-200/80 dark:border-blue-400/30 flex items-center justify-center mx-auto text-[#2563EB] dark:text-blue-400 shadow-xl shadow-blue-500/10">
            <Smartphone className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Register Your Shop</h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Onboard your shop to the OmniManage Enterprise SaaS Platform
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4 text-xs font-bold text-slate-400 dark:text-slate-500">
          <span className={step >= 1 ? 'text-[#2563EB] dark:text-blue-400 font-extrabold' : ''}>1. Select Plan</span>
          <span className={step >= 2 ? 'text-[#2563EB] dark:text-blue-400 font-extrabold' : ''}>2. Shop Info</span>
          <span className={step >= 3 ? 'text-[#2563EB] dark:text-blue-400 font-extrabold' : ''}>3. Owner & NID</span>
          <span className={step >= 4 ? 'text-[#2563EB] dark:text-blue-400 font-extrabold' : ''}>4. Password</span>
        </div>

        {/* Form Wizard */}
        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          {/* Step 1: Select Plan */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Choose Subscription Plan *</span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1 rounded-lg font-bold text-[10px] transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-[#2563EB] text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-3 py-1 rounded-lg font-bold text-[10px] transition-all flex items-center gap-1 ${
                      billingCycle === 'yearly'
                        ? 'bg-[#2563EB] text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Yearly</span>
                    <span className="px-1 py-0.5 rounded text-[8px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">
                      Save 20%
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PLANS.map((plan) => {
                  const isSel = selectedPlan === plan.id;
                  const price =
                    billingCycle === 'yearly' && typeof plan.yearlyPrice === 'number'
                      ? plan.yearlyPrice
                      : plan.monthlyPrice;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative cursor-pointer rounded-2xl p-4 border transition-all ${
                        isSel
                          ? 'bg-blue-50 dark:bg-blue-600/20 border-[#2563EB] dark:border-blue-500 shadow-lg shadow-blue-500/15'
                          : 'bg-slate-50/80 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      {plan.isPopular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-[8px] font-black uppercase text-white shadow-md">
                          Popular
                        </span>
                      )}

                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{plan.name}</h3>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSel ? 'bg-[#2563EB] border-[#2563EB]' : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSel && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </div>

                      <div className="text-lg font-black text-slate-900 dark:text-white my-1">
                        {typeof price === 'number' ? `৳${price.toLocaleString()}` : price}
                        {typeof price === 'number' && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                            /{billingCycle === 'yearly' ? 'yr' : 'mo'}
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-[#2563EB] dark:text-blue-300 font-bold mb-2">
                        {plan.branches} • {plan.users}
                      </div>

                      <ul className="space-y-1 text-[10px] text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-white/5 pt-2">
                        {plan.features.slice(0, 3).map((f, fIdx) => (
                          <li key={fIdx} className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#2563EB] dark:text-blue-400 shrink-0" />
                            <span className="truncate">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-600/25 transition-all"
                >
                  Next Step: Shop Info <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Shop Info */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-xs uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                  Mobile Shop Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={form.shopName}
                    onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                    placeholder="e.g. Rahim Telecom & Mobile Sales"
                    className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-xs uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                  Shop Logo (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'logo')}
                    className="flex-1 text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-semibold file:text-xs"
                  />
                  {files.logo && (
                    <img
                      src={URL.createObjectURL(files.logo)}
                      alt="Logo preview"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-300 dark:border-slate-600"
                    />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Your shop logo will appear on receipts and invoices
                </p>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!form.shopName) {
                      toast.error('Please enter Mobile Shop Name');
                      return;
                    }
                    setStep(3);
                  }}
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Owner Info & NID */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-xs uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                    Owner Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    placeholder="Abdur Rahim"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div>
                  <label className="block font-bold text-xs uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="owner@rahimtelecom.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div>
                  <label className="block font-bold text-xs uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">Username *</label>
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        username: e.target.value.toLowerCase().replace(/\s+/g, ''),
                      })
                    }
                    placeholder="e.g. rahim_owner"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div>
                  <label className="block font-bold text-xs uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="01700000000"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div>
                  <label className="block font-bold text-xs uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                    National ID (NID) Number
                  </label>
                  <input
                    type="text"
                    value={form.nidNumber}
                    onChange={(e) => setForm({ ...form, nidNumber: e.target.value })}
                    placeholder="NID 10/17 digit number"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-xs uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">NID Front Image</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'nidFront')}
                    className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-xs uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">NID Back Image</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'nidBack')}
                    className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!form.ownerName || !form.email || !form.phone) {
                      toast.error('Please enter Owner Name, Email, and Phone');
                      return;
                    }
                    setStep(4);
                  }}
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Trade License & Password */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-xs uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                  Trade License Number
                </label>
                <input
                  type="text"
                  value={form.tradeLicenseNumber}
                  onChange={(e) => setForm({ ...form, tradeLicenseNumber: e.target.value })}
                  placeholder="e.g. TRAD/DNCC/012345/2026"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-xs uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                    Trade License Document
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'tradeLicenseFile')}
                    className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-xs uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                    TIN / BIN Certificate Document
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'tinCertificate')}
                    className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-xs uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">Password *</label>
                  <PasswordInput
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 8 characters"
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-xs uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                    Confirm Password *
                  </label>
                  <PasswordInput
                    required
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Repeat password"
                    className="w-full text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !form.password}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                >
                  {loading ? 'Submitting Registration...' : 'Complete Registration & Apply Plan'}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="text-center pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-[#2563EB] dark:text-blue-400 hover:underline font-bold">
            Sign In Here
          </Link>
        </div>
      </div>

      {/* ─── SHOP ACTIVATION & SUPPORT POPUP MODAL ──────────────────────── */}
      {showActivationModal && registeredTenantData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-900 dark:text-slate-100 overflow-hidden">
            {/* Top Shine */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Registration Submitted!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Contact Support to Activate Your Shop</p>
                </div>
              </div>
            </div>

            {/* Shop Details Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Shop Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{registeredTenantData.shopName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Reference ID:</span>
                <span className="font-mono font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/30">
                  {registeredTenantData.shopRefCode}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Selected Plan:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  {registeredTenantData.selectedPlan} ({registeredTenantData.billingCycle})
                </span>
              </div>
            </div>

            {/* Instruction Notice */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-medium leading-relaxed">
              <p className="font-bold mb-1 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-500" /> Account Activation Pending
              </p>
              {platformSettings.activationInstructions}
            </div>

            {/* Direct Support Actions */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Contact Support Directly:
              </div>

              {whatsappCleanNumber && (
                <a
                  href={`https://wa.me/${whatsappCleanNumber}?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  <span>WhatsApp Support ({platformSettings.platformWhatsApp})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={`tel:${platformSettings.platformPhone}`}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Call: {platformSettings.platformPhone}</span>
                </a>

                <a
                  href={`mailto:${platformSettings.platformEmail}?subject=Shop Activation Request (${registeredTenantData.shopRefCode})`}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Email Support</span>
                </a>
              </div>
            </div>

            {/* Payment Numbers */}
            {(platformSettings.bkashNumber || platformSettings.nagadNumber) && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                {platformSettings.bkashNumber && (
                  <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-center">
                    <span className="text-pink-600 dark:text-pink-400 font-bold block">bKash Merchant</span>
                    <span className="font-mono text-slate-900 dark:text-white font-bold">
                      {platformSettings.bkashNumber}
                    </span>
                  </div>
                )}
                {platformSettings.nagadNumber && (
                  <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
                    <span className="text-orange-600 dark:text-orange-400 font-bold block">Nagad Merchant</span>
                    <span className="font-mono text-slate-900 dark:text-white font-bold">
                      {platformSettings.nagadNumber}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowActivationModal(false);
                  navigate(`/verify-email?email=${encodeURIComponent(registeredTenantData.email)}`);
                }}
                className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#2563EB] hover:bg-blue-700 transition-all shadow-md"
              >
                Proceed to Verify Email OTP & Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
