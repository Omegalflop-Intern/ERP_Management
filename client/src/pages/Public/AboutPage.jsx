import {
  ArrowLeft,
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  Cpu,
  Globe2,
  Layers,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function AboutPage() {
  useDocumentTitle('About Us - OmniManage Gadget ERP');

  const stats = [
    { label: 'Gadget Shops Empowered', value: '500+', color: 'bg-amber-300' },
    { label: 'IMEI & Serial Records Managed', value: '1.2M+', color: 'bg-lime-400' },
    { label: 'Repair Lifecycle Orders', value: '350K+', color: 'bg-cyan-300' },
    { label: 'Platform Uptime SLA', value: '99.98%', color: 'bg-pink-400' },
  ];

  const coreValues = [
    {
      title: 'Precision IMEI Tracking',
      desc: 'Never lose a single device history. We treat every serial and IMEI like a unique digital passport.',
      icon: Smartphone,
      color: 'bg-amber-300',
    },
    {
      title: 'Full Repair Cycle Transparency',
      desc: 'From diagnostic notes to technician assignments, technician commission, and SMS updates to customers.',
      icon: Wrench,
      color: 'bg-lime-400',
    },
    {
      title: 'Multi-Branch & Warehouse Sync',
      desc: 'Manage inventory transfers, inter-branch billing, and real-time stock balances across all locations.',
      icon: Building2,
      color: 'bg-cyan-300',
    },
    {
      title: 'Bank-Grade Security & Isolation',
      desc: 'Strict multi-tenant architecture ensures each shop’s sales, accounting, and customer data remains 100% private.',
      icon: ShieldCheck,
      color: 'bg-pink-400',
    },
  ];

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-black selection:text-yellow-300">
      {/* ─── TOP NAVBAR ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b-4 border-black px-4 sm:px-8 py-3.5 shadow-[0_4px_0_0_#000]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-yellow-300 border-2 border-black rounded-xl flex items-center justify-center font-black text-xl shadow-[3px_3px_0px_0px_#000] group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-[1px_1px_0px_0px_#000] transition-all">
              ⚡
            </div>
            <div>
              <span className="font-black text-xl tracking-tight uppercase dark:text-white">OmniManage</span>
              <span className="block text-[10px] font-bold tracking-widest text-slate-500 uppercase -mt-1">
                Gadget ERP Solution
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-bold">
            <Link to="/" className="hover:text-blue-600 dark:hover:text-yellow-400 transition-colors">
              Home
            </Link>
            <Link to="/pricing" className="hover:text-blue-600 dark:hover:text-yellow-400 transition-colors">
              Pricing
            </Link>
            <Link to="/contact" className="hover:text-blue-600 dark:hover:text-yellow-400 transition-colors">
              Contact
            </Link>
            <Link to="/developer" className="hover:text-blue-600 dark:hover:text-yellow-400 transition-colors">
              Developer
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="hidden sm:inline-flex font-bold text-xs uppercase bg-white dark:bg-slate-800 text-black dark:text-white border-2 border-black px-4 py-2 rounded-xl shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#000] transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register-shop"
              className="font-black text-xs uppercase bg-yellow-300 text-black border-2 border-black px-4 py-2 rounded-xl shadow-[3px_3px_0px_0px_#000] hover:bg-yellow-400 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#000] transition-all"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ──────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 border-b-4 border-black bg-gradient-to-b from-yellow-200/50 to-amber-50 dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-black text-yellow-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000]">
            <Sparkles className="w-4 h-4" /> The Story Behind OmniManage
          </div>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-slate-950 dark:text-white leading-tight">
            Built Exclusively for Gadget Shops & Tech Retailers
          </h1>
          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
            Standard ERP software fails when dealing with unique IMEI numbers, warranty claims, multi-part repairs, and technician commissions. OmniManage was engineered from the ground up to solve these exact gadget industry challenges.
          </p>
        </div>
      </section>

      {/* ─── STATS GRID ────────────────────────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`${stat.color} p-6 border-3 border-black rounded-2xl shadow-[5px_5px_0px_0px_#000] text-slate-950 flex flex-col justify-between`}
            >
              <div className="text-3xl sm:text-4xl font-black">{stat.value}</div>
              <div className="text-xs sm:text-sm font-bold uppercase mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── OUR MISSION & VISION ──────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-8 border-y-4 border-black bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <span className="bg-lime-400 border-2 border-black px-3 py-1 font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] text-black">
              Our Vision
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight dark:text-white">
              Empowering Gadget Entrepreneurs with Automated Intelligence
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              We envision a future where every phone repair center, electronics distributor, and multi-branch gadget showroom operates with zero stock discrepancies, frictionless warranty validations, and crystal-clear double-entry accounting.
            </p>
            <ul className="space-y-3 font-bold text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                Zero-loss IMEI inventory auditing with barcode and QR scanning.
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                Comprehensive technician commission tracking and ticket workflows.
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                Instant WhatsApp and SMS invoices with QR verification.
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {coreValues.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div
                  key={idx}
                  className="bg-amber-50 dark:bg-slate-800 p-5 border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] space-y-3"
                >
                  <div className={`w-10 h-10 ${val.color} border-2 border-black rounded-xl flex items-center justify-center text-black`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-base uppercase dark:text-white">{val.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{val.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CALL TO ACTION ────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-yellow-300 text-black border-b-4 border-black text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
            Ready to Scale Your Gadget Business?
          </h2>
          <p className="font-bold text-base max-w-xl mx-auto">
            Join hundreds of thriving retail shops and repair centers. Start your 14-day risk-free trial today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/register-shop"
              className="inline-flex items-center gap-2 font-black text-sm uppercase bg-black text-yellow-300 border-3 border-black px-8 py-4 rounded-xl shadow-[5px_5px_0px_0px_#fff] hover:bg-slate-900 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              <Rocket className="w-4 h-4" /> Create Your Shop Workspace
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 font-black text-sm uppercase bg-white text-black border-3 border-black px-6 py-4 rounded-xl shadow-[5px_5px_0px_0px_#000] hover:bg-lime-300 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              Talk to Sales Team <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="py-8 px-4 sm:px-8 bg-black text-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold">
          <div>
            &copy; {new Date().getFullYear()} OmniManage ERP Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="hover:text-yellow-400 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-yellow-400 transition-colors">Privacy Policy</Link>
            <Link to="/refund-policy" className="hover:text-yellow-400 transition-colors">Refund Policy</Link>
            <Link to="/contact" className="hover:text-yellow-400 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
