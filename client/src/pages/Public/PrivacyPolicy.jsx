import {
  ArrowLeft,
  Database,
  Eye,
  FileCheck,
  Globe2,
  Lock,
  Server,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function PrivacyPolicy() {
  useDocumentTitle('Privacy Policy - OmniManage');

  const highlights = [
    {
      title: 'Zero Third-Party Data Sharing',
      desc: 'We never sell, rent, or monetize your store data or customer PII.',
      icon: ShieldCheck,
      color: 'bg-amber-300',
    },
    {
      title: 'Row & Schema Level Isolation',
      desc: 'Each tenant shop database queries are rigorously constrained to their tenant ID.',
      icon: Database,
      color: 'bg-lime-400',
    },
    {
      title: 'End-to-End Encryption',
      desc: 'All passwords hashed with bcrypt, encrypted tokens over HTTPS/TLS 1.3.',
      icon: Lock,
      color: 'bg-cyan-300',
    },
    {
      title: 'GDPR & Compliance Ready',
      desc: 'One-click full data export and right-to-be-forgotten deletion workflows.',
      icon: UserCheck,
      color: 'bg-pink-400',
    },
  ];

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-black selection:text-yellow-300">
      {/* ─── TOP NAVBAR ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b-4 border-black px-4 sm:px-8 py-3.5 shadow-[0_4px_0_0_#000]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-yellow-300 border-2 border-black rounded-xl flex items-center justify-center font-black text-xl shadow-[3px_3px_0px_0px_#000]">
              ⚡
            </div>
            <div>
              <span className="font-black text-xl tracking-tight uppercase dark:text-white">
                OmniManage
              </span>
              <span className="block text-[10px] font-bold tracking-widest text-slate-500 uppercase -mt-1">
                Privacy Protection
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 font-bold text-xs uppercase bg-white dark:bg-slate-800 text-black dark:text-white border-2 border-black px-4 py-2 rounded-xl shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back Home
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HEADER ────────────────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 px-4 sm:px-8 border-b-4 border-black bg-lime-300 text-black">
        <div className="max-w-4xl mx-auto space-y-4">
          <span className="bg-black text-white px-3 py-1 font-black text-xs uppercase tracking-wider rounded-lg">
            Privacy Policy & Data Security
          </span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
            How We Protect Your Shop & Customer Data
          </h1>
          <p className="font-bold text-sm sm:text-base text-slate-900 max-w-2xl">
            OmniManage is built on a foundation of strict multi-tenancy and data confidentiality.
            Learn how we handle information across our ERP platform.
          </p>
        </div>
      </section>

      {/* ─── HIGHLIGHT CARDS ───────────────────────────────────────────────────── */}
      <section className="py-10 px-4 sm:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {highlights.map((h, i) => {
            const Icon = h.icon;
            return (
              <div
                key={i}
                className={`${h.color} p-5 border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] text-black space-y-2`}
              >
                <div className="w-9 h-9 bg-white border-2 border-black rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-black" />
                </div>
                <h3 className="font-black text-sm uppercase">{h.title}</h3>
                <p className="text-xs font-semibold leading-relaxed text-slate-800">{h.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── POLICY DETAILS ────────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto pb-16 px-4 sm:px-8 space-y-8">
        <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 border-3 border-black rounded-2xl shadow-[5px_5px_0px_0px_#000] space-y-4">
          <h2 className="text-xl sm:text-2xl font-black uppercase dark:text-white">
            1. Information We Collect
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            <li>
              <strong>Tenant Account Information:</strong> Shop business name, owner contact
              details, email address, and billing credentials.
            </li>
            <li>
              <strong>Store Operational Data:</strong> Product inventories, IMEI numbers, sales
              invoices, warranty records, and repair job orders entered by your staff.
            </li>
            <li>
              <strong>Audit & Security Logs:</strong> IP address, device user-agent, and timestamp
              logs for login attempts and security audits.
            </li>
          </ul>
        </section>

        <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 border-3 border-black rounded-2xl shadow-[5px_5px_0px_0px_#000] space-y-4">
          <h2 className="text-xl sm:text-2xl font-black uppercase dark:text-white">
            2. How Your Data Is Processed
          </h2>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
            Your data is used solely for the operation of the OmniManage ERP suite—including
            generating sales receipts, sending customer SMS notifications (if enabled), running
            financial balance sheets, and alerting you on low stock levels.
          </p>
        </section>

        <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 border-3 border-black rounded-2xl shadow-[5px_5px_0px_0px_#000] space-y-4">
          <h2 className="text-xl sm:text-2xl font-black uppercase dark:text-white">
            3. Data Retention & Deletion
          </h2>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
            We retain your operational data as long as your tenant subscription remains active.
            Should you choose to close your account, all operational records are permanently purged
            after a 30-day graceful retrieval window.
          </p>
        </section>
      </main>

      {/* ─── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="py-8 px-4 sm:px-8 bg-black text-white border-t-4 border-black">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold">
          <div>&copy; {new Date().getFullYear()} OmniManage ERP Inc. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-yellow-400 transition-colors">
              About
            </Link>
            <Link to="/terms" className="hover:text-yellow-400 transition-colors">
              Terms of Service
            </Link>
            <Link to="/refund-policy" className="hover:text-yellow-400 transition-colors">
              Refund Policy
            </Link>
            <Link to="/contact" className="hover:text-yellow-400 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
