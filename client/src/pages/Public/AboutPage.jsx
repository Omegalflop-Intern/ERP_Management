import {
  ArrowRight,
  Award,
  BadgeCheck,
  BarChart3,
  Boxes,
  Building2,
  CheckCircle2,
  Cpu,
  Globe2,
  Heart,
  History,
  Layers,
  Lock,
  Rocket,
  Shield,
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
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function AboutPage() {
  useDocumentTitle('About Us - OmniManage Gadget ERP');

  const milestones = [
    {
      year: '2024',
      title: 'The Challenge in Mobile Retail',
      desc: 'Mobile retailers and repair labs were losing thousands of dollars each month due to duplicate IMEI errors, untracked warranty claims, and messy manual paper job sheets.',
    },
    {
      year: '2025',
      title: 'OmniManage Core Engine Born',
      desc: 'We architected a purpose-built multi-tenant ERP centered on unique serial tracking, sub-second POS billing, and hardware technician commission workflows.',
    },
    {
      year: '2026',
      title: 'Enterprise Multi-Store Scale',
      desc: 'Now powering 500+ gadget stores, handling over 1.2M IMEI assets with real-time SSE sync, double-entry financial ledger, and high-availability cloud infrastructure.',
    },
  ];

  const pillars = [
    {
      title: 'Precision IMEI & Asset Passports',
      desc: 'Every smartphone, tablet, and accessory serial is treated as an immutable digital asset. From supplier purchase to customer handover and warranty returns, zero ambiguity.',
      icon: Smartphone,
      color: 'from-blue-500/20 to-cyan-500/20 text-blue-500 dark:text-blue-400',
    },
    {
      title: 'Hardware Servicing & Lab Operations',
      desc: 'From initial diagnostic job sheets to technician commission splits, spare parts inventory deduction, and instant customer SMS updates, repair workflows are automated.',
      icon: Wrench,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-500 dark:text-amber-400',
    },
    {
      title: 'Audit-Ready Double-Entry Accounting',
      desc: 'Automatic journal postings, real-time Profit & Loss statements, balance sheets, and customer due ledgers without needing a full-time chartered accountant on staff.',
      icon: Layers,
      color: 'from-purple-500/20 to-indigo-500/20 text-purple-500 dark:text-purple-400',
    },
    {
      title: 'Bank-Grade Multi-Tenant Isolation',
      desc: 'Every shop is strictly isolated with independent data partitioning, encrypted credentials, granular role permissions, and continuous automated backup snapshots.',
      icon: ShieldCheck,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-500 dark:text-emerald-400',
    },
  ];

  return (
    <div className="relative overflow-hidden font-sans">
      {/* ─── HERO HEADER ──────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden bg-gradient-to-b from-blue-50/50 via-transparent to-transparent dark:from-slate-900/40">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built by Engineers & Retail Veterans</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Transforming How Gadget Businesses{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Operate & Scale
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            OmniManage was created to solve the real operational headaches of mobile retailers, electronics
            distributors, and repair workshops. We replace scattered spreadsheets and generic POS tools with
            an integrated operating system.
          </p>
        </div>
      </section>

      {/* ─── STATS STRIP ──────────────────────────────────────────────────────── */}
      <section className="py-10 border-y border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">500+</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
                Active Outlets
              </p>
            </div>
            <div>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400">1.2M+</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
                IMEI Records Tracked
              </p>
            </div>
            <div>
              <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">৳ 250M+</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
                Monthly Invoices Settled
              </p>
            </div>
            <div>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">99.98%</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
                Platform Reliability
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MISSION & PILLARS ────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Our Architectural Core
          </h2>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Designed for the Real World of Electronics
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Every feature in OmniManage is engineered around the specialized workflows of gadgets and
            hardware repair.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="p-8 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-900/5 space-y-4 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">{p.title}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── TIMELINE / STORY ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-100/70 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Our Journey
            </h2>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Evolution of the OmniManage Platform
            </h3>
          </div>

          <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 sm:before:left-1/2 before:w-0.5 before:bg-slate-300 dark:before:bg-slate-800">
            {milestones.map((m, idx) => (
              <div
                key={m.year}
                className={`relative flex flex-col sm:flex-row items-start ${
                  idx % 2 === 0 ? 'sm:flex-row-reverse' : ''
                } gap-6 sm:gap-12`}
              >
                {/* Center Badge */}
                <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-blue-600 border-4 border-white dark:border-slate-950 flex items-center justify-center text-white text-[10px] font-black shadow-md z-10">
                  ✓
                </div>

                <div className={`w-full sm:w-1/2 pl-12 sm:pl-0 ${idx % 2 === 0 ? 'sm:text-left sm:pl-8' : 'sm:text-right sm:pr-8'}`}>
                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      {m.year}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{m.title}</h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {m.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CALL TO ACTION ───────────────────────────────────────────────────── */}
      <section className="py-20 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Ready to Modernize Your Gadget Operations?
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Start your 14-day unrestricted trial today and experience the speed of OmniManage.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/register-shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25 transition-all"
          >
            <span>Register Your Shop</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all"
          >
            <span>Contact Sales</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
