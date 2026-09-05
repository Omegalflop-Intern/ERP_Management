import {
  ArrowRight,
  Award,
  BookOpen,
  Boxes,
  Briefcase,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  FileCode,
  Github,
  Globe,
  Globe2,
  Heart,
  Key,
  Laptop,
  Layers,
  Linkedin,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Radio,
  Rocket,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Terminal,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import AnimatedCounter from '../../components/public/AnimatedCounter';
import ScrollReveal from '../../components/public/ScrollReveal';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function DeveloperPage() {
  useDocumentTitle('System Architect & Creator Profile - OmniManage ERP');
  const [activeTab, setActiveTab] = useState('architecture');

  const skillsMatrix = [
    {
      category: 'Backend & System Architecture',
      icon: Server,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-500 dark:text-emerald-400',
      items: [
        'Node.js (ESM Modular Architecture)',
        'Express.js RESTful API Framework',
        'Server-Sent Events (SSE) Real-Time',
        'Zod Runtime Schema Validation',
        'RBAC Permission Matrices & MFA Auth',
        'Multi-Tenant Subdomain Routing',
      ],
    },
    {
      category: 'Relational Database Engineering',
      icon: Database,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-500 dark:text-blue-400',
      items: [
        'MySQL 8 & MariaDB Relational Models',
        'Knex.js Query Builder & Migrations',
        'ACID Double-Entry Accounting Engine',
        'Atomic Transactions & Foreign Key Integrity',
        'Sub-Millisecond IMEI Index Querying',
        'Automated Point-in-Time Database Dumps',
      ],
    },
    {
      category: 'Frontend & UI/UX Craftsmanship',
      icon: Cpu,
      color: 'from-purple-500/20 to-violet-500/20 text-purple-500 dark:text-purple-400',
      items: [
        'React 18 & Vite 5 Single Page App',
        'TailwindCSS v3 Custom Design System',
        '5 Dynamic Modes (Liquid Glass, Aurora, etc.)',
        'Zustand Global State & Persist Storage',
        'TanStack Query Server Caching',
        'IndexedDB Offline-First Sync Engine',
      ],
    },
    {
      category: 'Retail Hardware & Integrations',
      icon: Smartphone,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-500 dark:text-amber-400',
      items: [
        '80mm & 58mm ESC/POS Thermal Printing',
        'USB & Bluetooth 1D/2D Barcode Scanners',
        'Unique IMEI & Serial Number Generation',
        'Automated SMS Gateway Integrations',
        'PDF Generation (Invoices & Balance Sheets)',
        'Excel / CSV Data Exporter Engine',
      ],
    },
  ];

  const architecturalPillars = [
    {
      title: '32 Mounted Enterprise Modules',
      badge: 'Complete Suite',
      desc: 'Engineered an end-to-end gadget retail solution covering POS, IMEI Lifecycle, Repairs, Double-Entry Accounting, HR & Payroll, Wholesale, CRM, and Super Admin Governance.',
      stat: '32 Modules',
    },
    {
      title: 'Multi-Tenant Data Isolation',
      badge: 'Zero Leakage',
      desc: 'Every shop runs on an independent tenant scope with custom subdomains, scoped queries, tenant validation middleware, and hourly automated subscription checking.',
      stat: '100% Isolated',
    },
    {
      title: 'Double-Entry Accounting Ledger',
      badge: 'Audit Ready',
      desc: 'Built-in automated journal entries matching debits and credits on every sale, refund, purchase, technician commission, and operating expense.',
      stat: 'Real-time P&L',
    },
    {
      title: 'Lightweight Real-Time SSE',
      badge: 'Sub-Second',
      desc: 'Replaced resource-heavy websockets with an efficient Server-Sent Events architecture powered by Node EventEmitters for instant cross-terminal inventory sync.',
      stat: 'Zero Polling',
    },
  ];

  return (
    <div className="relative overflow-hidden font-sans">
      {/* ─── DEVELOPER HERO PROFILE ────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 bg-gradient-to-b from-blue-50/50 via-transparent to-transparent dark:from-slate-900/40">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Developer Avatar / Badge */}
            <ScrollReveal animation="zoom-in" duration={600} className="shrink-0 text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 p-1 shadow-2xl shadow-blue-500/25">
                  <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center relative overflow-hidden">
                    <Code2 className="w-16 h-16 sm:w-20 sm:h-20 text-blue-400" />
                    <span className="absolute bottom-2 text-[10px] font-mono font-bold text-slate-400">
                      ARCHITECT
                    </span>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>Available</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Bio & Intro */}
            <div className="space-y-4 text-center md:text-left">
              <ScrollReveal animation="fade-down" delay={100}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Lead Full-Stack Software Architect & Creator</span>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={200}>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Crafting High-Performance{' '}
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    Enterprise Systems
                  </span>
                </h1>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={300}>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  Hi, I’m the system architect behind <strong>OmniManage ERP</strong>. I specialize in designing
                  mission-critical web applications, relational databases with ACID double-entry accounting,
                  multi-tenant cloud isolation, and real-time retail systems.
                </p>
              </ScrollReveal>

              {/* Social & Contact Actions */}
              <ScrollReveal animation="fade-up" delay={400}>
                <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <a
                    href="mailto:contact@omnimanage.app"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Get in Touch</span>
                  </a>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Hire for Custom Project</span>
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SYSTEM BUILD STATS ───────────────────────────────────────────────── */}
      <section className="py-10 border-y border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <ScrollReveal animation="fade-up" delay={0}>
              <div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">
                  <AnimatedCounter end={32} />
                </p>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
                  ERP Modules Engineered
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={100}>
              <div>
                <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
                  <AnimatedCounter end={100} suffix="%" />
                </p>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
                  TypeScript & ESM Compliant
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={200}>
              <div>
                <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                  <AnimatedCounter end={1.2} suffix="M+" />
                </p>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
                  IMEI Throughput Capable
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={300}>
              <div>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  <AnimatedCounter end={0} suffix=" Subscriptions Dropped" />
                </p>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
                  ACID Transaction Safety
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── SKILLS & TECH MASTERY MATRIX ────────────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="fade-up" className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Technical Arsenal
          </h2>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Full-Stack & Architectural Mastery
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Built from scratch with zero framework bloat, prioritizing raw execution speed, data safety, and
            exceptional developer ergonomics.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {skillsMatrix.map((matrix, idx) => {
            const Icon = matrix.icon;
            return (
              <ScrollReveal
                key={matrix.category}
                animation="fade-up"
                delay={idx * 120}
                className="h-full"
              >
                <div className="h-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 hover:border-blue-500/40 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${matrix.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{matrix.category}</h4>
                  </div>

                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {matrix.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* ─── OMNIMANAGE ARCHITECTURE HIGHLIGHTS ─────────────────────────────────── */}
      <section className="py-20 bg-slate-100/70 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up" className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              System Blueprint
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Architectural Pillars of OmniManage
            </h3>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {architecturalPillars.map((pillar, idx) => (
              <ScrollReveal
                key={pillar.title}
                animation="fade-up"
                delay={idx * 100}
                className="h-full"
              >
                <div className="h-full p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between hover:border-blue-500/40 transition-all">
                  <div className="space-y-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      {pillar.badge}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{pillar.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{pillar.desc}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    <span>Target Metric:</span>
                    <span>{pillar.stat}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE ARCHITECT TERMINAL ───────────────────────────────────── */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="zoom-in" className="rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs">
          <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-bold text-slate-300">architect@omnimanage-core:~$</span>
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Terminal
            </span>
          </div>

          <div className="p-6 space-y-3 text-emerald-400 leading-relaxed overflow-x-auto">
            <p className="text-slate-400">$ node --version && npm run system:status</p>
            <p className="text-blue-400">✓ System: Node.js v20+ ESM • Express • Knex Query Engine</p>
            <p className="text-purple-400">✓ Modules: 32 Mounted Controllers • RBAC Granular Guards Active</p>
            <p className="text-cyan-400">✓ Realtime: Server-Sent Events (SSE) Hub Listening on /api/v1/sse</p>
            <p className="text-amber-400">✓ Database: MySQL 8 Multi-Tenant Pool Connected • 0 Failed Migrations</p>
            <p className="text-white font-bold pt-2">
              $ echo "Built with precision for gadget stores and electronics retailers worldwide."
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ─── HIRE & COLLABORATION CTA ─────────────────────────────────────────── */}
      <section className="py-20 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <ScrollReveal animation="fade-up" className="space-y-4">
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Interested in Custom ERP Engineering or Systems Consulting?
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Whether you need a custom retail platform, multi-store data pipeline, or technical consulting,
            let’s connect and bring your vision to life.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25 transition-all active:scale-95"
            >
              <Mail className="w-4 h-4" />
              <span>Contact the Architect</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all active:scale-95"
            >
              <span>Back to Home</span>
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
