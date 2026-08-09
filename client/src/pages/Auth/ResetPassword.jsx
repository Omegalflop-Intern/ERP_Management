import { AlertCircle, ArrowLeft, CheckCircle, RefreshCw, Smartphone } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import PasswordInput from '../../components/ui/PasswordInput';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import api from '../../lib/api';

const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];

function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(3, Math.floor(score / 2));
}

export default function ResetPassword() {
  useDocumentTitle('Reset Password');
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-white/10 shadow-xl shadow-slate-900/5">
            <Smartphone className="w-8 h-8 text-[#2563EB]" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1 tracking-tight text-center">
          Reset Password
        </h1>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 text-center mb-8">
          Create a new secure password for your account
        </p>

        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/90 dark:border-slate-800/80 shadow-2xl shadow-slate-900/10 dark:shadow-black/60 rounded-3xl p-8 md:p-10 relative overflow-hidden">
          {done ? (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Password Reset Successfully!
              </h3>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6">
                Your password has been updated. Redirecting to login...
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2563EB] text-white font-bold text-sm hover:bg-[#1D4ED8] transition-all shadow-md shadow-[#2563EB]/20"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <PasswordInput
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            i <= strength
                              ? strengthColors[strength]
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-[11px] mt-1 font-bold ${
                        strength >= 2
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : strength >= 1
                            ? 'text-orange-500'
                            : 'text-red-500'
                      }`}
                    >
                      {strengthLabels[strength]}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <PasswordInput
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] shadow-lg shadow-[#2563EB]/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Resetting...</span>
                    </>
                  ) : (
                    'Reset Password'
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
          &copy; {new Date().getFullYear()} OmniManage ERP Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
}
