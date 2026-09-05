import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  HelpCircle,
  Laptop,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UploadCloud,
  User,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import AnimatedCounter from '../../components/public/AnimatedCounter';
import PasswordInput from '../../components/ui/PasswordInput';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import api from '../../lib/api';

const PLANS = [
  {
    id: 'starter',
    name: 'Retail Starter',
    monthlyPrice: 1500,
    yearlyPrice: 1200,
    users: '3 Staff Users',
    features: [
      'Single Shop Inventory',
      '3 Staff Accounts',
      '1,500 IMEIs & Serials',
      'POS & Barcode Invoicing',
      'Repair Job Sheets & SMS',
      'Customer Due Ledger',
    ],
    isPopular: false,
  },
  {
    id: 'pro',
    name: 'Business Pro',
    monthlyPrice: 3500,
    yearlyPrice: 2800,
    users: '15 Staff Accounts',
    features: [
      'Multi-Branch Ready',
      '15 Staff Accounts',
      'Unlimited IMEIs & Serials',
      'Double-Entry Accounting & P&L',
      'HR, Attendance & Payroll',
      'Wholesale Tiers & Credit Limits',
      'Technician Commission Splits',
    ],
    isPopular: true,
  },
  {
    id: 'enterprise',
    name: 'Franchise Enterprise',
    monthlyPrice: 7500,
    yearlyPrice: 6000,
    users: 'Unlimited Users',
    features: [
      'Unlimited Outlets & Warehouses',
      'Unlimited Staff & Fine Roles',
      'Full REST API & SSE Access',
      'Custom Domain Support',
      'Dedicated Account Engineer',
      'Daily Automated Backups & SLA',
    ],
    isPopular: false,
  },
];

export default function RegisterShop() {
  useDocumentTitle('Register Your Shop - OmniManage Gadget ERP');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultPlanParam = searchParams.get('plan') || 'pro';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availablePlans, setAvailablePlans] = useState(PLANS);
  const [selectedPlan, setSelectedPlan] = useState(defaultPlanParam.toLowerCase());
  const [billingCycle, setBillingCycle] = useState('yearly');

  const [registeredTenantData, setRegisteredTenantData] = useState(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedSubdomain, setCopiedSubdomain] = useState(false);

  const [platformSettings, setPlatformSettings] = useState({
    platformName: 'OmniManage ERP',
    platformPhone: '+880 1700-000000',
    platformWhatsApp: '+880 1700-000000',
    platformEmail: 'support@omnimanage.app',
    activationInstructions:
      'Your 14-day free trial has been provisioned! You can log in immediately to start configuring your store.',
    bkashNumber: '01700000000',
    nagadNumber: '01700000000',
  });

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const [settingsRes, plansRes] = await Promise.allSettled([
          api.get('/settings/public'),
          api.get('/plans'),
        ]);

        if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.data) {
          setPlatformSettings((prev) => ({ ...prev, ...settingsRes.value.data.data }));
        }

        if (plansRes.status === 'fulfilled' && Array.isArray(plansRes.value.data?.data)) {
          const list = plansRes.value.data.data;
          if (list.length > 0) {
            const mapped = list
              .filter((p) => p.isPublic !== false && p.name !== 'FREE')
              .map((p) => ({
                id: (p.name || '').toLowerCase(),
                name: p.displayName || p.name,
                monthlyPrice: Number(p.monthlyPrice || 0),
                yearlyPrice: Number(p.yearlyPrice || 0),
                users: p.maxUsers > 0 ? `${p.maxUsers} Staff Users` : 'Unlimited Users',
                features: Array.isArray(p.features) ? p.features : [],
                isPopular: p.name === 'PRO',
              }));
            if (mapped.length > 0) setAvailablePlans(mapped);
          }
        }
      } catch {}
    };
    fetchPublicData();
  }, []);

  const [form, setForm] = useState({
    shopName: '',
    subdomain: '',
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

  // Auto-generate subdomain suggestion from shop name
  const handleShopNameChange = (e) => {
    const val = e.target.value;
    const autoSub = val
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);
    setForm((prev) => ({
      ...prev,
      shopName: val,
      subdomain: prev.subdomain === '' || prev.subdomain === autoSub.slice(0, -1) ? autoSub : prev.subdomain,
      username: prev.username === '' ? `${autoSub}_admin` : prev.username,
    }));
  };

  const handleSubdomainChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setForm((prev) => ({ ...prev, subdomain: val }));
  };

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

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!form.shopName.trim()) {
        toast.error('Please enter your shop or business name');
        return false;
      }
      if (!form.subdomain.trim() || form.subdomain.length < 3) {
        toast.error('Subdomain must be at least 3 alphanumeric characters');
        return false;
      }
      return true;
    }
    if (currentStep === 2) {
      if (!form.ownerName.trim()) {
        toast.error('Please enter the owner full name');
        return false;
      }
      if (!form.email.trim() || !form.email.includes('@')) {
        toast.error('Please enter a valid email address');
        return false;
      }
      if (!form.phone.trim() || form.phone.length < 9) {
        toast.error('Please enter a valid mobile phone number');
        return false;
      }
      if (!form.password || form.password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return false;
      }
      if (form.password !== form.confirmPassword) {
        toast.error('Passwords do not match');
        return false;
      }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2)) return;

    setLoading(true);
    try {
      const payload = {
        shopName: form.shopName.trim(),
        subdomain: form.subdomain.trim().toLowerCase(),
        ownerName: form.ownerName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        plan: (selectedPlan || 'starter').toUpperCase(),
        selectedPlan: (selectedPlan || 'starter').toUpperCase(),
        billingCycle: billingCycle || 'yearly',
      };

      if (form.username && form.username.trim()) {
        payload.username = form.username
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '');
      }
      if (form.nidNumber && form.nidNumber.trim()) {
        payload.nidNumber = form.nidNumber.trim();
      }
      if (form.tradeLicenseNumber && form.tradeLicenseNumber.trim()) {
        payload.tradeLicenseNumber = form.tradeLicenseNumber.trim();
      }

      const res = await api.post('/tenants', payload);
      const tenantData = res.data?.data;
      const tenantId = tenantData?.id || tenantData?._id;

      // Upload Logo if provided
      if (tenantId && files.logo) {
        try {
          const logoFd = new FormData();
          logoFd.append('logo', files.logo);
          await api.post(`/tenants/${tenantId}/logo-upload`, logoFd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (uploadErr) {
          console.warn('Logo upload skipped or failed:', uploadErr);
        }
      }

      // Upload KYC Documents if provided
      if (
        tenantId &&
        (files.nidFront || files.tradeLicenseFile || files.nidBack || files.tinCertificate)
      ) {
        try {
          const fd = new FormData();
          if (files.nidFront) fd.append('nidFront', files.nidFront);
          if (files.nidBack) fd.append('nidBack', files.nidBack);
          if (files.tradeLicenseFile) fd.append('tradeLicenseFile', files.tradeLicenseFile);
          if (files.tinCertificate) fd.append('tinCertificate', files.tinCertificate);

          await api.post(`/tenants/${tenantId}/kyc-upload`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (kycErr) {
          console.warn('KYC upload deferred:', kycErr);
        }
      }

      setRegisteredTenantData(tenantData);
      setShowActivationModal(true);
      toast.success('Congratulations! Your shop has been provisioned successfully.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Shop registration failed. Please check inputs.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRef = () => {
    if (registeredTenantData?.shopRefCode) {
      navigator.clipboard.writeText(registeredTenantData.shopRefCode);
      setCopiedRef(true);
      toast.success('Reference code copied!');
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const activePlanObj = PLANS.find((p) => p.id === selectedPlan) || PLANS[1];
  const activePrice =
    billingCycle === 'yearly' ? activePlanObj.yearlyPrice : activePlanObj.monthlyPrice;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 selection:bg-blue-600 selection:text-white">
      {/* ─── TOP MINIMAL HEADER ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all">
              <Smartphone className="w-5 h-5 text-blue-200" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                OmniManage
              </span>
              <span className="text-[10px] text-slate-500 font-semibold -mt-1">Shop Registration</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 py-1.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Already have a shop? <span className="text-blue-600 font-black">Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── MAIN REGISTRATION WIZARD ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>14-Day Free Evaluation • Zero Advance Payment</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Launch Your Smart Gadget ERP
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Set up your store's dedicated multi-tenant cloud in less than 2 minutes.
          </p>
        </div>

        {/* ─── 4-STEP INDICATOR ──────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="grid grid-cols-4 gap-2 relative">
            {[
              { num: 1, title: 'Shop Info', icon: Building2 },
              { num: 2, title: 'Owner Account', icon: User },
              { num: 3, title: 'KYC Docs', icon: FileCheck2 },
              { num: 4, title: 'Plan & Launch', icon: Rocket },
            ].map((s) => {
              const Icon = s.icon;
              const isCompleted = step > s.num;
              const isCurrent = step === s.num;

              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (isCompleted) setStep(s.num);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all text-center ${
                    isCurrent
                      ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800'
                      : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-[11px] font-bold ${
                      isCurrent
                        ? 'text-blue-600 dark:text-blue-400'
                        : isCompleted
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── STEP CONTENT & SIDEBAR ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Form Area (2 Columns) */}
          <div className="lg:col-span-2">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
              <form onSubmit={handleRegister} className="space-y-6">
                {/* ─── STEP 1: SHOP IDENTITY & SUBDOMAIN ─────────────────────── */}
                {step === 1 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-500" />
                        <span>Step 1: Shop & Subdomain Identity</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Give your store an identity and select your custom cloud address.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label htmlFor="reg-shopName" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Shop / Business Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="reg-shopName"
                          type="text"
                          required
                          value={form.shopName}
                          onChange={handleShopNameChange}
                          placeholder="e.g. Apex Gadget Lab"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="reg-subdomain" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>
                            Cloud Subdomain Address <span className="text-red-500">*</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Unique per tenant
                          </span>
                        </label>
                        <div className="relative flex items-center">
                          <input
                            id="reg-subdomain"
                            type="text"
                            required
                            value={form.subdomain}
                            onChange={handleSubdomainChange}
                            placeholder="apexgadget"
                            className="w-full px-4 py-2.5 pr-44 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="absolute right-3 text-xs font-mono font-medium text-slate-400">
                            .omnimanage.app
                          </span>
                        </div>
                        {form.subdomain && (
                          <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>
                              Your store URL will be:{' '}
                              <strong className="font-mono">{form.subdomain}.omnimanage.app</strong>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Optional Shop Logo */}
                      <div className="space-y-1.5 pt-2">
                        <label htmlFor="reg-logo" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          Shop Logo <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            id="reg-logo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'logo')}
                            className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 dark:file:bg-blue-950 file:text-blue-600 dark:file:text-blue-400 hover:file:bg-blue-100 cursor-pointer"
                          />
                          {files.logo && (
                            <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Selected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={nextStep}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                      >
                        <span>Continue to Owner Details</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── STEP 2: OWNER & SECURITY PROFILE ──────────────────────── */}
                {step === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-500" />
                        <span>Step 2: Owner & Security Credentials</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        This user will be created as the Super Admin of your shop.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="reg-ownerName" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Owner Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="reg-ownerName"
                          type="text"
                          required
                          value={form.ownerName}
                          onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                          placeholder="e.g. Tanvir Ahmed"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="reg-phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Mobile Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="reg-phone"
                          type="tel"
                          required
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="e.g. 01712345678"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="reg-email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Official Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="reg-email"
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="e.g. tanvir@apexgadget.com"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="reg-username" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Admin Login Username <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          id="reg-username"
                          type="text"
                          value={form.username}
                          onChange={(e) => setForm({ ...form, username: e.target.value })}
                          placeholder="e.g. tanvir_admin"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="reg-password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Admin Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="reg-password"
                          type="password"
                          required
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder="Min. 6 characters"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="reg-confirmPassword" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="reg-confirmPassword"
                          type="password"
                          required
                          value={form.confirmPassword}
                          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                          placeholder="Retype password"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                      >
                        <span>Continue to Verification</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── STEP 3: BUSINESS KYC & DOCUMENTS ──────────────────────── */}
                {step === 3 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileCheck2 className="w-5 h-5 text-emerald-500" />
                        <span>Step 3: Verification & KYC (Optional)</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        You can provide your business credentials now or upload them later from settings.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="reg-nidNumber" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          National ID / Passport Number
                        </label>
                        <input
                          id="reg-nidNumber"
                          type="text"
                          value={form.nidNumber}
                          onChange={(e) => setForm({ ...form, nidNumber: e.target.value })}
                          placeholder="e.g. 1992019281092"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="reg-tradeLicense" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Trade License Number
                        </label>
                        <input
                          id="reg-tradeLicense"
                          type="text"
                          value={form.tradeLicenseNumber}
                          onChange={(e) => setForm({ ...form, tradeLicenseNumber: e.target.value })}
                          placeholder="e.g. TRAD/DNCC/2026/881"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Upload Document Copies (Optional, Max 15MB each):
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                          <span className="font-semibold block">NID Front Copy</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange(e, 'nidFront')}
                            className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-200 dark:file:bg-slate-700 cursor-pointer"
                          />
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                          <span className="font-semibold block">Trade License Copy</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange(e, 'tradeLicenseFile')}
                            className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-200 dark:file:bg-slate-700 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                      >
                        <span>Continue to Plan Selection</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── STEP 4: SUBSCRIPTION TIER & FINAL SUBMISSION ──────────── */}
                {step === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Rocket className="w-5 h-5 text-amber-500" />
                          <span>Step 4: Select Your ERP Subscription</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Includes 14-day free trial. You won't be charged today.
                        </p>
                      </div>

                      {/* Monthly / Yearly Toggle */}
                      <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setBillingCycle('monthly')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            billingCycle === 'monthly'
                              ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                              : 'text-slate-500'
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingCycle('yearly')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            billingCycle === 'yearly'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-500'
                          }`}
                        >
                          <span>Yearly</span>
                          <span className="text-[9px] bg-emerald-400 text-slate-950 px-1 rounded font-black">
                            Save 20%
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Plan Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {availablePlans.map((plan) => {
                        const isSelected = selectedPlan === plan.id;
                        const rawPrice =
                          billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
                        const isCustom =
                          !rawPrice ||
                          rawPrice === 0 ||
                          plan.id?.includes('enterprise') ||
                          plan.name?.toLowerCase().includes('enterprise');

                        return (
                          <div
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan.id)}
                            className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                              isSelected
                                ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-500 shadow-lg shadow-blue-500/15 scale-[1.02]'
                                : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-slate-900 dark:text-white">
                                  {plan.name}
                                </span>
                                {isSelected && (
                                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                                    ✓
                                  </span>
                                )}
                              </div>
                              <p className="text-xl font-black text-slate-900 dark:text-white">
                                {isCustom ? (
                                  <span>Custom</span>
                                ) : (
                                  <>
                                    ৳ {rawPrice.toLocaleString()}
                                    <span className="text-[10px] text-slate-500 font-normal">/mo</span>
                                  </>
                                )}
                              </p>
                              <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                                {isCustom ? 'Tailored Multi-Outlet' : plan.users}
                              </p>
                              <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                                {plan.features.slice(0, 4).map((f) => (
                                  <li key={f} className="flex items-center gap-1.5 truncate">
                                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                    <span>{f}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Terms Checkbox */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-start gap-2.5">
                      <input
                        id="terms-check"
                        type="checkbox"
                        required
                        defaultChecked
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="terms-check" className="text-slate-600 dark:text-slate-400">
                        I agree to the{' '}
                        <Link to="/terms" target="_blank" className="font-bold text-blue-600 hover:underline">
                          Terms of Service
                        </Link>{' '}
                        and acknowledge the{' '}
                        <Link to="/privacy" target="_blank" className="font-bold text-blue-600 hover:underline">
                          Privacy Policy
                        </Link>
                        .
                      </label>
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>

                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-2.5 px-8 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-500/25 active:scale-95 disabled:opacity-50 transition-all"
                      >
                        {loading ? (
                          <span>Provisioning Shop...</span>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-blue-200" />
                            <span>Complete & Launch 14-Day Free Trial</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Right Sticky Summary Sidebar */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Live Shop Summary
                </h4>
                <p className="text-base font-black text-slate-900 dark:text-white mt-1">
                  {form.shopName || 'Apex Gadget Store'}
                </p>
                <p className="text-xs font-mono text-blue-600 dark:text-blue-400">
                  {form.subdomain ? `${form.subdomain}.omnimanage.app` : 'yourshop.omnimanage.app'}
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Selected Plan:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {(availablePlans.find((p) => p.id === selectedPlan) || availablePlans[0])?.name}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Billing Cycle:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                    {billingCycle}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Due Today:</span>
                  <span className="font-black text-emerald-500">৳ 0 (Free Trial)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 space-y-2 text-xs">
                <p className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span>OmniManage Guarantee</span>
                </p>
                <ul className="space-y-1 text-[11px] text-blue-700 dark:text-blue-300/80">
                  <li>• No credit card required to start</li>
                  <li>• 14 days unrestricted full access</li>
                  <li>• Free assisted data migration</li>
                </ul>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Need help? Call hotline: {platformSettings.platformPhone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── POST REGISTRATION SUCCESS MODAL ───────────────────────────────────── */}
      {showActivationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-500/20">
              ✓
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Shop Provisioned!</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your store <strong>{registeredTenantData?.name || form.shopName}</strong> has been created.
                You can now log in to your dedicated ERP portal.
              </p>
            </div>

            {registeredTenantData?.shopRefCode && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-500">Shop Reference Code:</span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="font-mono font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1"
                >
                  <span>{registeredTenantData.shopRefCode}</span>
                  {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowActivationModal(false);
                  navigate('/login');
                }}
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25 transition-all"
              >
                Go to Shop Login
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowActivationModal(false);
                  navigate('/');
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Back to Homepage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
