import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock,
  HelpCircle,
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function RefundPolicy() {
  useDocumentTitle('Refund & Cancellation Policy - OmniManage');

  const policies = [
    {
      title: '14-Day Free Trial',
      desc: 'All new shops receive a complete 14-day unrestricted trial with no credit card required.',
      icon: Clock,
      color: 'bg-amber-300',
    },
    {
      title: '7-Day Money Back Guarantee',
      desc: 'If you are unsatisfied with your first paid monthly/annual billing, request a 100% refund within 7 days.',
      icon: Banknote,
      color: 'bg-lime-400',
    },
    {
      title: 'Cancel Anytime',
      desc: 'No lock-in contracts. Cancel from your billing settings before your next renewal date with one click.',
      icon: RefreshCcw,
      color: 'bg-cyan-300',
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
              <span className="font-black text-xl tracking-tight uppercase dark:text-white">OmniManage</span>
              <span className="block text-[10px] font-bold tracking-widest text-slate-500 uppercase -mt-1">
                Refund & Billing
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
      <section className="py-12 sm:py-16 px-4 sm:px-8 border-b-4 border-black bg-pink-300 text-black">
        <div className="max-w-4xl mx-auto space-y-4">
          <span className="bg-black text-white px-3 py-1 font-black text-xs uppercase tracking-wider rounded-lg">
            Fair & Transparent Billing
          </span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
            Refund & Cancellation Policy
          </h1>
          <p className="font-bold text-sm sm:text-base text-slate-900 max-w-2xl">
            We believe in honest, predictable pricing. Learn how SaaS subscription cancellations and refund requests are handled.
          </p>
        </div>
      </section>

      {/* ─── SUMMARY CARDS ─────────────────────────────────────────────────────── */}
      <section className="py-10 px-4 sm:px-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {policies.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={i}
                className={`${p.color} p-5 border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] text-black space-y-3`}
              >
                <div className="w-9 h-9 bg-white border-2 border-black rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-black" />
                </div>
                <h3 className="font-black text-base uppercase">{p.title}</h3>
                <p className="text-xs font-bold leading-relaxed text-slate-800">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── POLICY DETAILS ────────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto pb-16 px-4 sm:px-8 space-y-8">
        <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 border-3 border-black rounded-2xl shadow-[5px_5px_0px_0px_#000] space-y-4">
          <h2 className="text-xl sm:text-2xl font-black uppercase dark:text-white">1. SaaS Subscription Refunds</h2>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
            First-time subscribers are entitled to a full refund within 7 calendar days of their initial billing date if the service does not meet operational expectations. To request a refund, contact our support team at <strong className="text-black dark:text-yellow-300">support@omnimanage.site</strong> with your shop workspace domain.
          </p>
        </section>

        <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 border-3 border-black rounded-2xl shadow-[5px_5px_0px_0px_#000] space-y-4">
          <h2 className="text-xl sm:text-2xl font-black uppercase dark:text-white">2. Subscription Cancellation</h2>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
            You may cancel auto-renewal at any time. When you cancel, your workspace will remain fully operational until the end of your prepaid billing period. We do not offer partial refunds for mid-month early cancellations after the initial 7-day guarantee window.
          </p>
        </section>

        <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 border-3 border-black rounded-2xl shadow-[5px_5px_0px_0px_#000] space-y-4">
          <h2 className="text-xl sm:text-2xl font-black uppercase dark:text-white">3. Customer Retail Returns in Your Shop</h2>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
            Please note: OmniManage provides the ERP software platform. Individual gadget sales, return policies, and device warranty terms for your store's end-customers are set and managed independently by your shop admin via the Sales & Returns module.
          </p>
        </section>
      </main>

      {/* ─── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="py-8 px-4 sm:px-8 bg-black text-white border-t-4 border-black">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold">
          <div>&copy; {new Date().getFullYear()} OmniManage ERP Inc. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-yellow-400 transition-colors">About</Link>
            <Link to="/terms" className="hover:text-yellow-400 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-yellow-400 transition-colors">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-yellow-400 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
