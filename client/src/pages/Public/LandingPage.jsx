import {
  ArrowRight,
  Award,
  BadgeCheck,
  BadgePercent,
  BarChart3,
  BookOpen,
  Boxes,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Cpu,
  CreditCard,
  DollarSign,
  FileCheck2,
  FileText,
  HelpCircle,
  Laptop,
  Layers,
  Lock,
  MessageSquare,
  Package,
  Percent,
  PhoneCall,
  QrCode,
  Receipt,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  Timer,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  Wrench,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import AnimatedCounter from '../../components/public/AnimatedCounter';
import ScrollReveal from '../../components/public/ScrollReveal';
import Typewriter from '../../components/public/Typewriter';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import api from '../../lib/api';

export default function LandingPage() {
  useDocumentTitle('OmniManage - Enterprise ERP for Gadget Shops & Repair Labs');
  const navigate = useNavigate();

  // Pricing toggle & plans
  const [isYearly, setIsYearly] = useState(true);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Active interactive module tab
  const [activeModuleTab, setActiveModuleTab] = useState('pos');

  // FAQ open item
  const [openFaq, setOpenFaq] = useState(0);

  // Sample analytics chart data
  const revenueTrendData = [
    { month: 'Jan', sales: 420000, repairs: 68000 },
    { month: 'Feb', sales: 510000, repairs: 82000 },
    { month: 'Mar', sales: 640000, repairs: 95000 },
    { month: 'Apr', sales: 590000, repairs: 110000 },
    { month: 'May', sales: 780000, repairs: 145000 },
    { month: 'Jun', sales: 920000, repairs: 180000 },
  ];

  // Fetch subscription plans from backend with fallback
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/plans/public');
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setPlans(res.data.data);
        } else {
          throw new Error('No public plans');
        }
      } catch {
        setPlans([
          {
            _id: 'starter',
            name: 'Retail Starter',
            priceMonthly: 1500,
            priceYearly: 1200,
            description: 'Ideal for single gadget shops and repair kiosks.',
            features: [
              'Single Branch & 3 Staff Users',
              'Up to 1,500 IMEIs & Serials',
              'POS & Barcode Invoicing',
              'Repair Job Sheets & SMS Updates',
              'Customer Due & CRM',
              'Standard Reports & Backups',
            ],
            isPopular: false,
          },
          {
            _id: 'pro',
            name: 'Business Pro',
            priceMonthly: 3500,
            priceYearly: 2800,
            description: 'Complete ERP suite for multi-branch gadget retailers.',
            features: [
              'Multi-Branch & 15 Staff Accounts',
              'Unlimited IMEIs & Warranty Claims',
              'Double-Entry Accounting & P&L',
              'HR, Attendance & Payroll',
              'Wholesale Tiers & Credit Limits',
              'Technician Commission Tracking',
              'Priority 24/7 Phone & Ticket Support',
            ],
            isPopular: true,
          },
          {
            _id: 'enterprise',
            name: 'Franchise Enterprise',
            priceMonthly: 7500,
            priceYearly: 6000,
            description: 'High-scale infrastructure for large gadget chains & importers.',
            features: [
              'Unlimited Branches & Custom Domains',
              'Unlimited Staff & Fine-grained Roles',
              'Full REST API & SSE Webhooks Access',
              'Automated Daily Offsite Backups',
              'Dedicated Technical Account Lead',
              'Custom Accounting Integration & SLA',
            ],
            isPopular: false,
          },
        ]);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const featurePillars = [
    {
      title: 'Precision IMEI & Serial Passport',
      desc: 'Track every smartphone, tablet, and wearable from supplier purchase to retail sale and warranty lifecycle.',
      icon: Smartphone,
      gradient: 'from-blue-500/20 to-cyan-500/20 text-blue-500 dark:text-blue-400',
      badge: 'Zero Fraud',
    },
    {
      title: 'Lightning POS & Thermal Invoicing',
      desc: 'Sub-second barcode scanning, multiple payment split (Cash, Card, MFS), and instant printed thermal receipts.',
      icon: Receipt,
      gradient: 'from-emerald-500/20 to-teal-500/20 text-emerald-500 dark:text-emerald-400',
      badge: 'Ultra Fast',
    },
    {
      title: 'Hardware Repair Lab Workflow',
      desc: 'Job-sheet ticketing, device condition mapping, technician commission splits, and live customer SMS updates.',
      icon: Wrench,
      gradient: 'from-amber-500/20 to-orange-500/20 text-amber-500 dark:text-amber-400',
      badge: 'Pro Servicing',
    },
    {
      title: 'Double-Entry Accounting Suite',
      desc: 'Automated journal entries, real-time Profit & Loss, Balance Sheets, Cash Flow, and customer due ledger.',
      icon: FileCheck2,
      gradient: 'from-purple-500/20 to-indigo-500/20 text-purple-500 dark:text-purple-400',
      badge: 'Audit Ready',
    },
    {
      title: 'Multi-Store Stock & Transfer',
      desc: 'Live centralized warehouse inventory, inter-outlet stock requisition, and automated reorder alerts.',
      icon: Boxes,
      gradient: 'from-pink-500/20 to-rose-500/20 text-pink-500 dark:text-pink-400',
      badge: 'Unified Stock',
    },
    {
      title: 'Wholesale & B2B Distribution',
      desc: 'Tiered wholesale pricing, customer credit ceilings, batch IMEI sales, and flexible instalment terms.',
      icon: Building2,
      gradient: 'from-violet-500/20 to-fuchsia-500/20 text-violet-500 dark:text-violet-400',
      badge: 'B2B Ready',
    },
  ];

  const faqs = [
    {
      q: 'How does IMEI tracking prevent duplicate or stolen stock issues?',
      a: 'OmniManage treats every IMEI as a globally unique asset record. When receiving shipments, validating warranty claims, or selling units, the system enforces uniqueness and flags previously returned, blacklisted, or active stock instantly.',
    },
    {
      q: 'Can our technicians receive commissions based on repair jobs completed?',
      a: 'Yes! OmniManage includes built-in technician assignment and commission calculations. When a repair job transitions to Completed and payment is collected, commission is automatically reflected in payroll.',
    },
    {
      q: 'Is multi-branch inventory synchronized in real time?',
      a: 'Absolutely. Using server-sent events and atomic database transactions, all branches and central warehouses see real-time updates when stock is sold, reserved, or transferred.',
    },
    {
      q: 'Does it support thermal receipt printers and barcode scanners?',
      a: 'Yes. The POS module is optimized for standard 80mm and 58mm thermal printers (ESC/POS compatible) and standard USB/Bluetooth 1D & 2D barcode scanners.',
    },
    {
      q: 'How secure is our store data and financial records?',
      a: 'Each store operates in an isolated multi-tenant architecture with encrypted credentials, role-based permission matrices, full audit trails, and automated daily database backups.',
    },
  ];

  return (
    <div className="relative overflow-hidden font-sans">
      {/* ─── HERO SECTION ──────────────────────────────────────────────────────── */}
      <section className="relative pt-10 pb-20 sm:pt-16 sm:pb-28 lg:pt-20 lg:pb-36 overflow-hidden">
        {/* Background glow meshes */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-blue-600/20 via-indigo-500/15 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Top Badge */}
            <ScrollReveal animation="fade-down" duration={500}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/80 text-blue-600 dark:text-blue-300 text-xs font-semibold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Engineered Exclusively for Gadget & Mobile Retailers</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[11px] opacity-80">v2.4 Live</span>
              </div>
            </ScrollReveal>

            {/* Main Headline with Typewriter */}
            <ScrollReveal animation="fade-up" delay={150} duration={600}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                Run Your Gadget Store with <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  <Typewriter
                    words={[
                      'Flawless IMEI Tracking',
                      'Sub-Second POS Billing',
                      'Smart Repair Lab Hub',
                      'Unified Stock Sync',
                      'Audit-Ready Accounting',
                    ]}
                    typingSpeed={80}
                    deletingSpeed={45}
                    pauseTime={1900}
                  />
                </span>
              </h1>
            </ScrollReveal>

            {/* Subtitle */}
            <ScrollReveal animation="fade-up" delay={300} duration={600}>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Eliminate lost devices and stock chaos. OmniManage unites <strong>IMEI tracking</strong>,{' '}
                <strong>POS billing</strong>, <strong>repair servicing</strong>, and{' '}
                <strong>audit-ready accounting</strong> into one unified cloud ERP.
              </p>
            </ScrollReveal>

            {/* CTA Buttons */}
            <ScrollReveal animation="fade-up" delay={450} duration={600}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  to="/register-shop"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-500/25 active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>Start 14-Day Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#modules"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-xs transition-all"
                >
                  <span>Explore Live Demo</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              </div>
            </ScrollReveal>

            {/* Micro proof points */}
            <ScrollReveal animation="fade" delay={600} duration={600}>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Instant cloud provisioning
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free data migration assistance
                </span>
              </div>
            </ScrollReveal>
          </div>

          {/* Interactive Preview Mockup Card with Zoom-in Reveal */}
          <ScrollReveal animation="zoom-in" delay={300} duration={800} className="mt-14 max-w-5xl mx-auto">
            <div className="relative rounded-2xl sm:rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-950 border border-slate-300/80 dark:border-slate-800 shadow-2xl shadow-blue-500/10">
              {/* Fake browser bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-900/90 rounded-xl mb-2 border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                </div>
                <div className="px-4 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-500 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-500" />
                  <span>gadgetlab.omnimanage.app/dashboard</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Sync
                </div>
              </div>

              {/* Mock Dashboard Grid */}
              <div className="bg-white dark:bg-[#0c1220] rounded-xl p-4 sm:p-6 space-y-6 border border-slate-200 dark:border-slate-800/80">
                {/* Metric Quick Stats with CountUp */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Today's Sales</span>
                      <Receipt className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                      <AnimatedCounter end={148500} prefix="৳ " />
                    </p>
                    <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-0.5 mt-1">
                      <TrendingUp className="w-3 h-3" /> +18.4% vs yesterday
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Active IMEIs</span>
                      <Smartphone className="w-4 h-4 text-cyan-500" />
                    </div>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                      <AnimatedCounter end={1248} suffix=" Units" />
                    </p>
                    <span className="text-[10px] font-medium text-slate-500 mt-1">Across 3 branches</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Repair Jobs</span>
                      <Wrench className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                      <AnimatedCounter end={14} suffix=" In-Progress" />
                    </p>
                    <span className="text-[10px] font-semibold text-amber-500 mt-1">4 ready for delivery</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Net Margin</span>
                      <CircleDollarSign className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                      <AnimatedCounter end={22.8} suffix="%" />
                    </p>
                    <span className="text-[10px] font-semibold text-emerald-500 mt-1">After technician cuts</span>
                  </div>
                </div>

                {/* Split Mock: Live Chart & Recent Devices */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Revenue Performance Trend
                        </h4>
                        <p className="text-[11px] text-slate-500">Device Sales vs Repair Services</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold">
                        Realtime Knex Sync
                      </span>
                    </div>

                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueTrendData}>
                          <defs>
                            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `৳${v / 1000}k`} />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="sales"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#salesGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                        Live Device Feed
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">iPhone 15 Pro Max</p>
                            <p className="text-[10px] text-slate-500 font-mono">IMEI: 354892109482711</p>
                          </div>
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600">
                            Sold & Invoiced
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">Samsung S24 Ultra</p>
                            <p className="text-[10px] text-slate-500 font-mono">Job #REP-9021 (OLED)</p>
                          </div>
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-100 dark:bg-amber-950/80 text-amber-600">
                            In Lab (Tech Rakib)
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/register-shop"
                      className="mt-3 w-full py-2 text-center text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Explore Shop Sandbox</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── PROOF OF SCALE STATS WITH ANIMATED COUNTER ─────────────────────── */}
      <section className="py-12 border-y border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <ScrollReveal animation="fade-up" delay={0}>
              <div className="space-y-1">
                <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                  <AnimatedCounter end={500} suffix="+" />
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Gadget Retailers Empowered
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={100}>
              <div className="space-y-1">
                <p className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400">
                  <AnimatedCounter end={1.2} suffix="M+" />
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  IMEI Records Tracked
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={200}>
              <div className="space-y-1">
                <p className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400">
                  <AnimatedCounter end={450} suffix="K+" />
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Repair Orders Processed
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={300}>
              <div className="space-y-1">
                <p className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                  <AnimatedCounter end={99.98} suffix="%" />
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  High-Availability Uptime
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── FEATURES PILLARS GRID WITH SCROLL REVEAL ───────────────────────── */}
      <section id="features" className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up" className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Tailored Capabilities
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Everything Your Gadget Business Demands
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Generic POS software fails when handling IMEIs, warranty repairs, and technician payouts.
              OmniManage was built from the ground up for electronics retailers.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featurePillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <ScrollReveal
                  key={pillar.title}
                  animation="fade-up"
                  delay={idx * 100}
                  className="h-full"
                >
                  <div className="h-full p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${pillar.gradient}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {pillar.badge}
                        </span>
                      </div>

                      <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {pillar.title}
                      </h4>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {pillar.desc}
                      </p>
                    </div>

                    <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                      <span>Learn module details</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE MODULES EXPLORER ────────────────────────────────────── */}
      <section id="modules" className="py-20 sm:py-28 bg-slate-100/70 dark:bg-slate-900/50 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up" className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Interactive Explorer
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Test Drive the Core Workflows
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Click through the modules below to see how effortless everyday gadget shop tasks become.
            </p>
          </ScrollReveal>

          {/* Module Selector Tabs */}
          <ScrollReveal animation="fade" delay={150} className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {[
              { id: 'pos', name: 'POS & Billing', icon: Receipt },
              { id: 'imei', name: 'IMEI Lifecycle', icon: Smartphone },
              { id: 'repair', name: 'Repair Servicing', icon: Wrench },
              { id: 'accounting', name: 'Accounting & P&L', icon: FileCheck2 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveModuleTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeModuleTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </ScrollReveal>

          {/* Active Tab Preview Display with Zoom-in */}
          <ScrollReveal animation="zoom-in" delay={200}>
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl">
              {activeModuleTab === 'pos' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                      High-Throughput POS
                    </span>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                      Scan Barcode, Choose IMEI, Print Thermal Invoice in 3 Seconds
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Designed for peak retail rush hours. Search by serial number, filter by accessories or
                      gadget models, calculate VAT automatically, and accept split payments via bKash, Nagad,
                      or Card.
                    </p>
                    <ul className="space-y-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" /> Offline resilient cashier mode
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" /> Customer phone lookup with due alerts
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" /> Auto-SMS receipt delivery
                      </li>
                    </ul>
                    <Link
                      to="/register-shop"
                      className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline pt-2"
                    >
                      <span>Launch POS Demo</span> <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 font-mono text-xs">
                    <div className="flex justify-between border-b pb-2 text-slate-500">
                      <span>INVOICE #INV-2026-881</span>
                      <span className="text-emerald-500 font-bold">PAID (SPLIT)</span>
                    </div>
                    <div className="space-y-1 text-slate-800 dark:text-slate-200">
                      <div className="flex justify-between">
                        <span>1x Galaxy S24 Ultra (Titanium)</span>
                        <span>৳ 135,000</span>
                      </div>
                      <p className="text-[10px] text-slate-400">IMEI: 359128092817412 • 1 Yr Warranty</p>
                    </div>
                    <div className="space-y-1 text-slate-800 dark:text-slate-200">
                      <div className="flex justify-between">
                        <span>1x 45W Type-C Super Fast Adapter</span>
                        <span>৳ 2,400</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t flex justify-between font-bold text-slate-900 dark:text-white">
                      <span>Total Bill:</span>
                      <span>৳ 137,400</span>
                    </div>
                  </div>
                </div>
              )}

              {activeModuleTab === 'imei' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600">
                      Unique Device Tracking
                    </span>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                      Full Historical Timeline for Every Single Phone
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Instantly search any IMEI or Serial Number to view its purchase source, supplier warranty,
                      customer sale date, previous repair tickets, and return claims.
                    </p>
                    <ul className="space-y-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-blue-500" /> Batch upload IMEIs via Excel / CSV
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-blue-500" /> Blacklist & lost device protection
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-blue-500" /> Automated warranty expiry calculators
                      </li>
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 font-sans text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">Device Audit Passport</p>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border flex justify-between">
                      <div>
                        <p className="font-bold">Apple iPhone 15 Pro 256GB</p>
                        <p className="text-[10px] text-slate-400 font-mono">IMEI: 358102948210941</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-500">In Stock (Main Outlet)</span>
                    </div>
                    <div className="text-[11px] space-y-1.5 text-slate-600 dark:text-slate-400 border-l-2 border-blue-500 pl-3">
                      <p>• <strong>Purchased:</strong> 12 Aug 2026 from Star Distributor (PO-991)</p>
                      <p>• <strong>QC Passed:</strong> Battery 100%, Display Genuine</p>
                      <p>• <strong>Price:</strong> ৳ 118,000 (Purchase) / ৳ 128,000 (MRP)</p>
                    </div>
                  </div>
                </div>
              )}

              {activeModuleTab === 'repair' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-amber-100 dark:bg-amber-950 text-amber-600">
                      Hardware Servicing & Lab
                    </span>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                      From Diagnostic Intake to Delivery & Tech Commission
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Provide customers with a printed job sheet and digital tracking link. Assign tasks to
                      in-house technicians, log spare parts used, and calculate payout shares automatically.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                    <div className="flex justify-between items-center font-bold">
                      <span>Job Sheet #JOB-4029</span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-600 font-bold text-[10px]">
                        Awaiting Spare Parts
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Issue:</strong> Water damage, display flickering, charging port loose.
                    </p>
                    <p className="text-slate-500">
                      <strong>Technician:</strong> Tanvir Ahmed (Commission: 25%)
                    </p>
                    <div className="pt-2 border-t flex justify-between font-bold text-slate-900 dark:text-white">
                      <span>Estimated Cost:</span>
                      <span>৳ 4,500</span>
                    </div>
                  </div>
                </div>
              )}

              {activeModuleTab === 'accounting' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-purple-100 dark:bg-purple-950 text-purple-600">
                      Real Financial Accuracy
                    </span>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                      Automated General Ledger, P&L, and Customer Due Tracking
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      No manual bookkeeping. Every purchase, sale, repair expense, and salary payment
                      automatically creates double-entry journal postings with real-time auditability.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <p className="font-bold text-slate-900 dark:text-white mb-2">Live Profit & Loss Summary</p>
                    <div className="flex justify-between py-1 border-b text-slate-600 dark:text-slate-300">
                      <span>Gross Sales Revenue</span>
                      <span className="font-bold text-emerald-500">৳ 24,80,000</span>
                    </div>
                    <div className="flex justify-between py-1 border-b text-slate-600 dark:text-slate-300">
                      <span>Cost of Goods Sold (COGS)</span>
                      <span className="font-bold text-red-500">- ৳ 19,40,000</span>
                    </div>
                    <div className="flex justify-between py-1 border-b text-slate-600 dark:text-slate-300">
                      <span>Operating Expenses & Payroll</span>
                      <span className="font-bold text-red-500">- ৳ 1,85,000</span>
                    </div>
                    <div className="flex justify-between pt-2 font-black text-sm text-slate-900 dark:text-white">
                      <span>Net Operating Profit</span>
                      <span className="text-emerald-500">৳ 3,55,000</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── PRICING PLANS WITH SCROLL REVEAL ─────────────────────────────────── */}
      <section id="pricing" className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up" className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Simple & Transparent
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Predictable Pricing for Growing Shops
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No hidden fees or surprise maintenance costs. Choose the tier that matches your scale.
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className={`text-xs font-bold ${!isYearly ? 'text-blue-600' : 'text-slate-500'}`}>
                Monthly Billing
              </span>
              <button
                type="button"
                onClick={() => setIsYearly(!isYearly)}
                className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isYearly ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-label="Toggle Billing Interval"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isYearly ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${isYearly ? 'text-blue-600' : 'text-slate-500'}`}>
                  Yearly Billing
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 border border-emerald-300 dark:border-emerald-800">
                  Save 20%
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, idx) => {
              const price = isYearly ? plan.priceYearly : plan.priceMonthly;
              const formattedPrice = typeof price === 'number' ? `৳ ${price.toLocaleString()}` : price;

              return (
                <ScrollReveal
                  key={plan._id || plan.name}
                  animation="fade-up"
                  delay={idx * 150}
                  className="h-full"
                >
                  <div
                    className={`h-full relative rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 ${
                      plan.isPopular
                        ? 'bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-950 border-2 border-blue-500 shadow-2xl shadow-blue-500/15 scale-105 z-10'
                        : 'bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {plan.isPopular && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-md">
                        Most Popular for Retailers
                      </span>
                    )}

                    <div className="space-y-5">
                      <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white">{plan.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px]">
                          {plan.description}
                        </p>
                      </div>

                      <div className="flex items-baseline gap-1 border-y border-slate-100 dark:border-slate-800/80 py-4">
                        <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                          {typeof price === 'number' ? (
                            <AnimatedCounter end={price} prefix="৳ " />
                          ) : (
                            formattedPrice
                          )}
                        </span>
                        {typeof price === 'number' && (
                          <span className="text-xs text-slate-500 font-semibold">/month</span>
                        )}
                      </div>

                      <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <p className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
                          Included capabilities:
                        </p>
                        {plan.features?.map((f) => (
                          <div key={f} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 mt-6">
                      <Link
                        to="/register-shop"
                        className={`w-full py-3 rounded-xl text-xs font-bold text-center block transition-all ${
                          plan.isPopular
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 active:scale-95'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white active:scale-95'
                        }`}
                      >
                        Start 14-Day Free Trial
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FAQ SECTION ──────────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up" className="text-center space-y-3 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Got Questions?
            </h2>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h3>
          </ScrollReveal>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <ScrollReveal key={faq.q} animation="fade-up" delay={idx * 60}>
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        openFaq === idx ? 'rotate-180 text-blue-500' : ''
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA BANNER ────────────────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white">
        <ScrollReveal animation="zoom-in" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Ready to transform your gadget shop?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Stop Losing Profits to Stock Confusion.
          </h2>

          <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto">
            Join hundreds of mobile store owners and repair labs who run on OmniManage everyday. Set up in 2
            minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/register-shop"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-sm bg-white text-blue-700 hover:bg-blue-50 shadow-xl shadow-black/20 active:scale-95 transition-all"
            >
              Get Started Now — It's Free
            </Link>
            <Link
              to="/contact"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-blue-700/60 hover:bg-blue-700 text-white border border-white/20 transition-all"
            >
              Talk to ERP Specialist
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
