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
  Twitter,
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

// Custom SVG Icons for Real Tech Stack
const TechIcons = {
  react: () => (
    <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 115.3 100" fill="currentColor">
      <ellipse cx="57.6" cy="50" rx="15" ry="50" fill="none" stroke="currentColor" strokeWidth="6" transform="rotate(30 57.6 50)" />
      <ellipse cx="57.6" cy="50" rx="15" ry="50" fill="none" stroke="currentColor" strokeWidth="6" transform="rotate(90 57.6 50)" />
      <ellipse cx="57.6" cy="50" rx="15" ry="50" fill="none" stroke="currentColor" strokeWidth="6" transform="rotate(150 57.6 50)" />
      <circle cx="57.6" cy="50" r="8" fill="currentColor" />
    </svg>
  ),
  node: () => (
    <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 32 32" fill="currentColor">
      <path d="M16 2l13.856 8v16L16 34 2.144 26V10L16 2zm0 3.3L4.444 11.8v13.4L16 31.7l11.556-6.5V11.8L16 5.3z" />
    </svg>
  ),
  typescript: () => (
    <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.5 0h21l1.5 1.5v21l-1.5 1.5h-21L0 22.5v-21L1.5 0zm10.7 13.5H9.4V20H7.2v-6.5H4.4v-1.8h7.8v1.8zm3.6 4.8c.6.4 1.4.6 2.2.6.9 0 1.5-.4 1.5-1 0-.6-.4-.9-1.5-1.3l-.9-.4c-1.6-.6-2.5-1.5-2.5-2.9 0-1.7 1.4-3 3.6-3 1.1 0 2 .3 2.7.7l-.6 1.8c-.6-.4-1.3-.6-2.1-.6-.9 0-1.4.4-1.4.9 0 .5.4.8 1.4 1.2l.9.4c1.8.7 2.7 1.6 2.7 3 0 1.9-1.4 3.1-3.8 3.1-1.3 0-2.4-.3-3.2-.8l.7-1.7z" />
    </svg>
  ),
  nextjs: () => (
    <svg className="w-5 h-5 text-slate-100" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 6.63 5.37 12 12 12 6.63 0 12-5.37 12-12 0-6.63-5.37-12-12-12zm6.75 18.25L10.5 8.75v8.5H8.75V5.75h2.25L19.25 15.5v-9.75h1.75v12.5h-2.25z" />
    </svg>
  ),
  laravel: () => (
    <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.2 5.6L12.5.6c-.3-.2-.7-.2-1 0L2.8 5.6c-.3.2-.5.5-.5.8v10.2c0 .3.2.7.5.8l8.7 5c.1.1.3.1.5.1s.3 0 .5-.1l8.7-5c.3-.2.5-.5.5-.8V6.4c0-.3-.2-.6-.5-.8zM12 2.3l6.9 4-6.9 4-6.9-4 6.9-4zm-8 6l6.9 4v7.9l-6.9-4V8.3zm16 7.9l-6.9 4v-7.9l6.9-4v7.9z" />
    </svg>
  ),
  mysql: () => (
    <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5v-3.8c1.6.4 2.8 1.9 2.8 3.8H13zm-2 0c0-1.9 1.2-3.4 2.8-3.8v3.8H11zm-5-4.5c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6-6-2.7-6-6z" />
    </svg>
  ),
  postgres: () => (
    <svg className="w-5 h-5 text-cyan-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V15a3 3 0 0 1-2-2.83V11h2v1.17A1 1 0 0 0 14 13h1v3.93a8 8 0 0 1-2 0zM17 11h-1V9a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H7V9a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2z" />
    </svg>
  ),
  python: () => (
    <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.9 1.5c-3.1 0-5.2.4-6.4 1.2C4.3 3.5 4 4.8 4 6.8v2.3h7.9v1.1H3.6C2.2 10.2 1 11.4 1 13.5c0 2.2 1 3.5 2.6 3.9 1.1.3 2.7.3 4.3.3v-2.3c0-1.7 1.4-3.1 3.1-3.1h4.9c1.4 0 2.5-1.1 2.5-2.5V6.8c0-2-1.2-3.4-2.8-4.1-1.2-.8-2.6-1.2-3.7-1.2zm-2.2 2c.6 0 1.1.5 1.1 1.1 0 .6-.5 1.1-1.1 1.1-.6 0-1.1-.5-1.1-1.1 0-.6.5-1.1 1.1-1.1zm2.4 19c3.1 0 5.2-.4 6.4-1.2 1.2-.8 1.5-2.1 1.5-4.1v-2.3H12.1v-1.1h8.3c1.4 0 2.6-1.2 2.6-3.3 0-2.2-1-3.5-2.6-3.9-1.1-.3-2.7-.3-4.3-.3v2.3c0 1.7-1.4 3.1-3.1 3.1H8.1c-1.4 0-2.5 1.1-2.5 2.5v3c0 2 1.2 3.4 2.8 4.1 1.2.8 2.6 1.2 3.7 1.2zm2.2-2c-.6 0-1.1-.5-1.1-1.1 0-.6.5-1.1 1.1-1.1.6 0 1.1.5 1.1 1.1 0 .6-.5 1.1-1.1 1.1z" />
    </svg>
  ),
  threejs: () => (
    <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  ai: () => (
    <svg className="w-5 h-5 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a2 2 0 1 1 0 4h-1.08A7.002 7.002 0 0 1 14 21.92V23a2 2 0 1 1-4 0v-1.08A7.002 7.002 0 0 1 3.08 18H2a2 2 0 1 1 0-4h1.08A7 7 0 0 1 10 7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM9 13a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
    </svg>
  ),
};

export default function DeveloperPage() {
  useDocumentTitle('Salah Uddin Kader - Lead System Architect & Creator');
  const [imgError, setImgError] = useState(false);

  const techDomains = [
    {
      title: 'MERN & Full-Stack Core',
      icon: TechIcons.react,
      gradient: 'from-cyan-500/20 to-blue-500/20 text-cyan-400',
      skills: [
        'React 18 & Vite 5 Single Page Apps',
        'Node.js (ESM Modular Architecture)',
        'Express.js RESTful API Services',
        'MongoDB & Mongoose Schemas',
        'TailwindCSS v3 & Dynamic Theming',
        'Zustand & TanStack Query State',
      ],
    },
    {
      title: 'TypeScript & Next.js Ecosystem',
      icon: TechIcons.typescript,
      gradient: 'from-blue-500/20 to-indigo-500/20 text-blue-400',
      skills: [
        'TypeScript Strict Typing & Generics',
        'Next.js 14 App Router & SSR/SSG',
        'Server Actions & Edge Runtime',
        'Zod Runtime Validation',
        'SEO & Performance Optimization',
        'Full-Stack Component Architecture',
      ],
    },
    {
      title: 'PHP, Laravel & Backend Systems',
      icon: TechIcons.laravel,
      gradient: 'from-red-500/20 to-orange-500/20 text-red-400',
      skills: [
        'PHP 8+ Modern Syntax & OOP',
        'Laravel MVC & Eloquent ORM',
        'Queues, Jobs & Event Listeners',
        'RESTful APIs & Middleware Security',
        'Blade & Inertia.js Integrations',
        'Multi-Tenant Tenant Isolation',
      ],
    },
    {
      title: 'Relational Database Engineering',
      icon: TechIcons.mysql,
      gradient: 'from-blue-500/20 to-teal-500/20 text-blue-400',
      skills: [
        'MySQL 8 / MariaDB Relational Models',
        'PostgreSQL & Complex Joins',
        'Knex.js Query Builder & Migrations',
        'ACID Double-Entry Accounting Engine',
        'High-Throughput IMEI Indexing',
        'Atomic Transactions & Foreign Keys',
      ],
    },
    {
      title: 'GSAP, Three.js & Creative Web',
      icon: TechIcons.threejs,
      gradient: 'from-purple-500/20 to-pink-500/20 text-purple-400',
      skills: [
        'Three.js 3D Viewports & Shaders',
        'GSAP ScrollTrigger & Timeline Anims',
        'WebGL Canvas Interactive Physics',
        '60FPS Micro-Interactions & UX',
        '3D Device Model Showcase',
        'Glassmorphism & Aurora Gradients',
      ],
    },
    {
      title: 'Python, Django & AI / ML Future',
      icon: TechIcons.python,
      gradient: 'from-amber-500/20 to-yellow-500/20 text-amber-400',
      skills: [
        'Python 3 Core & Scripting',
        'Django & Django REST Framework',
        'Predictive Sales & Inventory Models',
        'AI / ML & LLM Integration (Active R&D)',
        'Automated Scraping & Data Pipelines',
        'Model Training & Intelligent Insights',
      ],
    },
  ];

  const erpHighlights = [
    {
      title: '32 Integrated Modules',
      desc: 'Complete ERP suite: POS, IMEI Tracking, Repairs, Accounting, HR, Wholesale, Vault, Super Admin, and Audit Logs.',
      metric: '32 Modules',
    },
    {
      title: 'Multi-Tenant Architecture',
      desc: 'Isolated tenant scopes with dynamic subdomain routing, Knox DB isolation, and automated subscription checker.',
      metric: 'Subdomain Scope',
    },
    {
      title: 'Double-Entry Accounting',
      desc: 'ACID-compliant general ledger, auto journal postings, live Profit & Loss, Balance Sheet, and Due collections.',
      metric: 'ACID Compliant',
    },
    {
      title: 'Real-Time SSE Streaming',
      desc: 'Lightweight Server-Sent Events architecture with Node EventEmitters for instant stock updates and zero polling.',
      metric: 'Sub-Second SSE',
    },
  ];

  return (
    <div className="relative overflow-hidden font-sans">
      {/* ─── DEVELOPER HERO PROFILE ────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 bg-gradient-to-b from-blue-50/50 via-transparent to-transparent dark:from-slate-900/40">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Developer Profile Image */}
            <ScrollReveal animation="zoom-in" duration={600} className="shrink-0 text-center">
              <div className="relative inline-block group">
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 p-1 shadow-2xl shadow-blue-500/25 group-hover:scale-105 transition-all duration-300">
                  <div className="w-full h-full bg-slate-950 rounded-[22px] overflow-hidden flex items-center justify-center relative">
                    {!imgError ? (
                      <img
                        src="https://salahuddin.codes/cv-images.png"
                        alt="Salah Uddin Kader"
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-blue-400">
                        <Code2 className="w-16 h-16" />
                        <span className="text-[10px] font-mono font-bold mt-1 text-slate-400">
                          SALAH UDDIN
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1.5 border-2 border-slate-950">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>Available for Hire</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Bio & Intro */}
            <div className="space-y-4 text-center md:text-left">
              <ScrollReveal animation="fade-down" delay={100}>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Lead Full-Stack Software Engineer & System Architect</span>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={200}>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Salah Uddin Kader
                </h1>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 -mt-1 font-mono">
                  @salahuddingfx • Creator & Lead Architect of OmniManage ERP
                </p>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={300}>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  Passionate software architect specializing in building high-scale multi-tenant SaaS
                  platforms, double-entry financial engines, real-time event pipelines, and 3D creative web
                  applications.
                </p>
              </ScrollReveal>

              {/* Social & Contact Actions */}
              <ScrollReveal animation="fade-up" delay={400}>
                <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <a
                    href="https://salahuddin.codes"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    <Globe className="w-4 h-4" />
                    <span>View Portfolio (salahuddin.codes)</span>
                    <ExternalLink className="w-3 h-3 opacity-75" />
                  </a>

                  <a
                    href="https://github.com/salahuddingfx"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                  >
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>

                  <a
                    href="https://linkedin.com/in/salahuddingfx"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span>LinkedIn</span>
                  </a>

                  <a
                    href="https://x.com/salahuddingfx"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                  >
                    <Twitter className="w-4 h-4" />
                    <span>Twitter/X</span>
                  </a>
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
                  Full-Stack Architecture
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
                  <AnimatedCounter end={99.98} suffix="%" />
                </p>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
                  High-Availability Uptime
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── TECHNICAL ARSENAL: REAL ICONS & DOMAINS ─────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="fade-up" className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Technical Arsenal
          </h2>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Full-Stack Technology Mastery
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            A comprehensive overview of programming languages, frameworks, databases, and creative web tools
            mastered over years of enterprise development.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techDomains.map((domain, idx) => {
            const Icon = domain.icon;
            return (
              <ScrollReveal
                key={domain.title}
                animation="fade-up"
                delay={idx * 100}
                className="h-full"
              >
                <div className="h-full p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 hover:border-blue-500/40 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl bg-gradient-to-br ${domain.gradient} flex items-center justify-center`}>
                        <Icon />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {domain.title}
                      </h4>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      {domain.skills.map((s) => (
                        <li key={s} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* ─── OMNIMANAGE ARCHITECTURE BLUEPRINT ───────────────────────────────── */}
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
            {erpHighlights.map((pillar, idx) => (
              <ScrollReveal
                key={pillar.title}
                animation="fade-up"
                delay={idx * 100}
                className="h-full"
              >
                <div className="h-full p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between hover:border-blue-500/40 transition-all">
                  <div className="space-y-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      {pillar.metric}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{pillar.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{pillar.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LIVE ARCHITECT TERMINAL ─────────────────────────────────────────── */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="zoom-in" className="rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs">
          <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-bold text-slate-300">salahuddin@omnimanage-architect:~$</span>
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live System
            </span>
          </div>

          <div className="p-6 space-y-3 text-emerald-400 leading-relaxed overflow-x-auto">
            <p className="text-slate-400">$ whoami && cat architect_manifesto.json</p>
            <p className="text-blue-400">
              {JSON.stringify(
                {
                  creator: 'Salah Uddin Kader',
                  handle: 'salahuddingfx',
                  portfolio: 'https://salahuddin.codes',
                  roles: ['Lead Full-Stack Architect', 'Database Engineer', 'UI/UX Craftsman'],
                  stack: ['MERN', 'TypeScript', 'Next.js', 'PHP/Laravel', 'MySQL/Postgres', 'GSAP/Three.js', 'Python/AI'],
                },
                null,
                2
              )}
            </p>
            <p className="text-purple-400">✓ Modules: 32 Mounted Controllers • Subdomain Multi-Tenancy Active</p>
            <p className="text-white font-bold pt-2">
              $ echo "Ready to architect and scale your next mission-critical enterprise software."
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ─── HIRE & COLLABORATION CTA ─────────────────────────────────────────── */}
      <section className="py-20 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <ScrollReveal animation="fade-up" className="space-y-4">
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Need Custom Enterprise Architecture or Technical Leadership?
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Connect directly with <strong>Salah Uddin Kader</strong> to discuss custom SaaS development,
            high-performance database design, or technology consulting.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://salahuddin.codes"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25 transition-all active:scale-95"
            >
              <Globe className="w-4 h-4" />
              <span>Visit Official Portfolio (salahuddin.codes)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all active:scale-95"
            >
              <Mail className="w-4 h-4" />
              <span>Send Message</span>
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
