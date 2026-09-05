import { CheckCircle2, DollarSign, FileText, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function RefundPolicy() {
  useDocumentTitle('Refund & Cancellation Policy - OmniManage ERP');

  return (
    <div className="relative overflow-hidden font-sans py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Billing Guarantees</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            Refund & Cancellation Policy
          </h1>
          <p className="text-xs text-slate-500">Last updated: August 2026 • Version 2.4</p>
        </div>

        {/* Content Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-blue-600">1.</span> 14-Day Free Evaluation Period
            </h2>
            <p>
              Every new shop registration comes with an unrestricted 14-day free trial. No credit card or
              advance deposit is required to test POS billing, IMEI tracking, and financial reports during
              this period.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-blue-600">2.</span> 7-Day Money-Back Guarantee
            </h2>
            <p>
              If you upgrade to any paid monthly or annual subscription plan and find that OmniManage does
              not meet your store's requirements, you can request a 100% full refund within 7 days of your
              first payment. We process refund requests with zero hassle.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-blue-600">3.</span> Subscription Cancellation
            </h2>
            <p>
              You can cancel your subscription at any time. When cancelled, your store remains fully active
              until the end of the current billing cycle, and no further automatic renewals will occur.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-blue-600">4.</span> How to Request a Refund
            </h2>
            <p>
              To initiate a refund, simply email our billing team at{' '}
              <a href="mailto:billing@omnimanage.app" className="font-bold text-blue-600 hover:underline">
                billing@omnimanage.app
              </a>{' '}
              or submit a ticket from your dashboard with your shop subdomain and invoice number.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>Need billing assistance? Contact our finance team.</span>
            <Link
              to="/contact"
              className="font-bold text-blue-600 hover:text-blue-500 transition-colors"
            >
              Contact Billing Support →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
