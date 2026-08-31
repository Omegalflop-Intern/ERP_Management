import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Lock,
  Scale,
  Shield,
  Sparkles,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function TermsPage() {
  useDocumentTitle('Terms of Service - OmniManage');

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
                Legal Terms
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
      <section className="py-12 sm:py-16 px-4 sm:px-8 border-b-4 border-black bg-yellow-300 text-black">
        <div className="max-w-4xl mx-auto space-y-4">
          <span className="bg-black text-white px-3 py-1 font-black text-xs uppercase tracking-wider rounded-lg">
            Effective Date: August 2026
          </span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
            Terms of Service & SaaS Agreement
          </h1>
          <p className="font-bold text-sm sm:text-base text-slate-900 max-w-2xl">
            Please read these terms carefully before registering your shop workspace or subscribing
            to any OmniManage ERP service plan.
          </p>
        </div>
      </section>

      {/* ─── MAIN TERMS CONTENT ────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-8 space-y-8">
        {/* Section 1 */}
        <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 border-3 border-black rounded-2xl shadow-[5px_5px_0px_0px_#000] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-300 border-2 border-black rounded-lg flex items-center justify-center font-black text-black text-sm">
              1
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase dark:text-white">
              Account Registration & Eligibility
            </h2>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
            To register a shop tenant on OmniManage, you must provide valid business information
            (Shop Name, Owner Name, Business Phone, and Email). You are solely responsible for
            safeguarding your credentials, configuring Multi-Factor Authentication (MFA), and
            supervising sub-accounts and cashier roles created under your tenant workspace.
          </p>
        </section>

        {/* Section 2 */}
        <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 border-3 border-black rounded-2xl shadow-[5px_5px_0px_0px_#000] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-lime-400 border-2 border-black rounded-lg flex items-center justify-center font-black text-black text-sm">
              2
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase dark:text-white">
              SaaS Subscriptions & Billing
            </h2>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
            OmniManage provides tiered subscription plans (Starter, Growth, Enterprise).
            Subscriptions renew automatically at the end of each billing period (Monthly or
            Annually) unless cancelled prior to the renewal date. All pricing is exclusive of local
            taxes where applicable.
          </p>
        </section>

        {/* Section 3 */}
        <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 border-3 border-black rounded-2xl shadow-[5px_5px_0px_0px_#000] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-300 border-2 border-black rounded-lg flex items-center justify-center font-black text-black text-sm">
              3
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase dark:text-white">
              Data Ownership & Tenant Isolation
            </h2>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
            You retain 100% full ownership of your shop data—including customer records, IMEI
            inventories, sales invoices, repair tickets, and accounting journal entries. OmniManage
            will never sell or monetize your store data to third parties.
          </p>
        </section>

        {/* Section 4 */}
        <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 border-3 border-black rounded-2xl shadow-[5px_5px_0px_0px_#000] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-pink-400 border-2 border-black rounded-lg flex items-center justify-center font-black text-black text-sm">
              4
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase dark:text-white">
              System Availability & SLAs
            </h2>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
            We target a 99.9% uptime for our core POS, inventory, and API services. Scheduled
            maintenance windows are communicated via in-app banner announcements and email
            notifications at least 48 hours in advance.
          </p>
        </section>

        {/* Section 5 */}
        <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 border-3 border-black rounded-2xl shadow-[5px_5px_0px_0px_#000] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-300 border-2 border-black rounded-lg flex items-center justify-center font-black text-black text-sm">
              5
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase dark:text-white">
              Account Termination & Data Export
            </h2>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
            You may cancel your subscription at any time from the Tenant Settings panel. Upon
            cancellation or closure, you are provided 30 days to export your full inventory,
            customer lists, and financial reports in CSV/Excel formats.
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
            <Link to="/privacy" className="hover:text-yellow-400 transition-colors">
              Privacy Policy
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
