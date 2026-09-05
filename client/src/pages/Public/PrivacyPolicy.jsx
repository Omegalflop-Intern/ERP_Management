import { Database, Eye, FileText, Key, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function PrivacyPolicy() {
  useDocumentTitle('Privacy Policy - OmniManage ERP');

  return (
    <div className="relative overflow-hidden font-sans py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Data Protection & Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-500">Last updated: August 2026 • Version 2.4</p>
        </div>

        {/* Content Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-blue-600">1.</span> Data Collection & Usage
            </h2>
            <p>
              OmniManage collects store business information, employee accounts, inventory records, IMEI
              serial numbers, and transactional invoices solely to provide the ERP services requested by your
              organization. We never sell, monetize, or disclose your store's customer database or financial
              metrics to third-party advertisers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-blue-600">2.</span> Multi-Tenant Data Isolation
            </h2>
            <p>
              Your store's operational data is strictly segregated within our relational database
              architecture. Tenant validation middleware prevents cross-tenant data leakage, and all access
              requires authenticated JWT credentials with strict role-based authorization.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-blue-600">3.</span> Encryption & Storage Security
            </h2>
            <p>
              All communications between your browser and our servers are encrypted via TLS 1.3. User
              passwords are encrypted using salted bcrypt hashing algorithms. Sensitive token secrets and
              database backups are securely stored and encrypted at rest.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-blue-600">4.</span> Your Rights & Data Portability
            </h2>
            <p>
              You maintain 100% data ownership. You can export complete CSV / Excel dumps of your customer
              ledgers, stock balances, IMEI histories, and financial statements at any point. Upon account
              termination, store data is permanently purged following our data retention cycle.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>Have privacy questions? Reach our Data Privacy Officer.</span>
            <Link
              to="/contact"
              className="font-bold text-blue-600 hover:text-blue-500 transition-colors"
            >
              Contact Privacy Desk →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
