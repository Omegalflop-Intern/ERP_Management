import { CheckCircle2, FileText, Lock, Scale, ShieldCheck, Sparkles } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function TermsPage() {
  useDocumentTitle('Terms of Service - OmniManage ERP');

  return (
    <div className="relative overflow-hidden font-sans py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <Scale className="w-3.5 h-3.5" />
            <span>Legal Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-500">Last updated: August 2026 • Version 2.4</p>
        </div>

        {/* Content Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-blue-600">1.</span> Acceptance of Terms
            </h2>
            <p>
              By accessing, registering, or using OmniManage ERP ("Platform", "Service", "We", or "Us"),
              you agree to be bound by these Terms of Service. If you are accepting these terms on behalf of a
              gadget store, company, or legal entity, you represent that you possess the authority to bind
              such entity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-blue-600">2.</span> SaaS Multi-Tenant License & Access
            </h2>
            <p>
              We grant your store a non-exclusive, non-transferable, revocable license to access and use the
              OmniManage software strictly for retail inventory management, IMEI tracking, POS billing,
              repair servicing, and double-entry accounting in accordance with your subscribed plan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-blue-600">3.</span> Device Data & IMEI Accuracy
            </h2>
            <p>
              You retain all ownership of the customer, inventory, serial number, and financial data you
              input into OmniManage. You are responsible for ensuring that all IMEI numbers and hardware
              records entered into the system comply with local telecommunication regulations and are not
              associated with blacklisted or fraudulent goods.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-blue-600">4.</span> Subscriptions, Billing & Cancellation
            </h2>
            <p>
              OmniManage is offered on monthly and annual subscription cycles. Subscriptions renew
              automatically unless cancelled prior to the renewal date. You may upgrade, downgrade, or cancel
              your subscription at any time directly through your Super Admin or Billing dashboard.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-blue-600">5.</span> Uptime SLA & Support
            </h2>
            <p>
              We strive to maintain a 99.98% platform availability SLA. Scheduled maintenance is performed
              during low-traffic maintenance windows with advance notification. Priority support is provided
              according to your active subscription tier.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>Questions regarding our Terms? Contact our legal desk.</span>
            <Link
              to="/contact"
              className="font-bold text-blue-600 hover:text-blue-500 transition-colors"
            >
              Contact Legal Support →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
