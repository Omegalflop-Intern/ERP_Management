import { ArrowLeft, CheckCircle, Mail, RefreshCw, Smartphone, Store } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import api, { getAssetUrl } from '../../lib/api';
import { detectSubdomain } from '../../utils/subdomain';

export default function ForgotPassword() {
  useDocumentTitle('Forgot Password');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const subdomain = detectSubdomain();
  const { data: publicShop } = useQuery({
    queryKey: ['public-tenant-login', subdomain],
    queryFn: async () => {
      const res = await api.get(`/tenants/public/by-subdomain/${subdomain}`);
      return res.data?.data;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!subdomain,
    retry: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Password reset link sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 pl-10 rounded-xl text-sm font-medium transition-all duration-200 bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 outline-none';

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-100 dark:bg-[#050810] text-slate-900 dark:text-slate-100 font-sans">
      {/* Sleek ambient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/40 dark:from-[#080d19] dark:via-[#0f172a] dark:to-[#080d19] z-0" />
      <div className="absolute inset-0 bg-dot-grid opacity-50 dark:opacity-20 z-0 pointer-events-none" />

      {/* Theme toggle */}
      <div className="absolute top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="flex justify-center mb-5">
          {publicShop?.logo ? (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/20 shadow-2xl p-2 overflow-hidden">
              <img
                src={getAssetUrl(publicShop.logo)}
                alt={publicShop.shopName || 'Shop Logo'}
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-full h-full flex items-center justify-center">
                <Store className="w-8 h-8 text-[#2563EB] dark:text-blue-400 stroke-[2.2]" />
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-white/10 shadow-xl shadow-slate-900/5">
              {subdomain ? (
                <Store className="w-8 h-8 text-[#2563EB] dark:text-blue-400 stroke-[2.2]" />
              ) : (
                <Smartphone className="w-8 h-8 text-[#2563EB] stroke-[2.2]" />
              )}
            </div>
          )}
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1 tracking-tight text-center">
          Forgot Password?
        </h1>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 text-center mb-8">
          Enter your registered email address to receive a password reset link
        </p>

        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/90 dark:border-slate-800/80 shadow-2xl shadow-slate-900/10 dark:shadow-black/60 rounded-3xl p-8 md:p-10 relative overflow-hidden">
          {sent ? (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Check your email
              </h3>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6">
                We sent a password reset link to{' '}
                <strong className="text-slate-800 dark:text-slate-200">{email}</strong>
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2563EB] text-white font-bold text-sm hover:bg-[#1D4ED8] transition-all shadow-md shadow-[#2563EB]/20"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] shadow-lg shadow-[#2563EB]/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Sending link...</span>
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#2563EB] dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>

        <p className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 mt-6">
          &copy; {new Date().getFullYear()} OmniManage. All rights reserved.
        </p>
      </div>
    </div>
  );
}
