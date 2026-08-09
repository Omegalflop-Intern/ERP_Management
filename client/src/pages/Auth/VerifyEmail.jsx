import { ArrowLeft, CheckCircle, Mail, RefreshCw } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import api from '../../lib/api';

export default function VerifyEmail() {
  useDocumentTitle('Verify Email');
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex((val) => !val);
    const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter complete 6-digit code');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp: code });
      setVerified(true);
      toast.success('Email verified successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('New OTP sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const inputClass =
    'w-12 h-14 text-center text-xl font-bold rounded-xl transition-all duration-200 bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 outline-none';

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
            <Mail className="w-8 h-8 text-[#2563EB]" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1 tracking-tight text-center">
          Verify Your Email
        </h1>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 text-center mb-8">
          Enter the 6-digit verification code sent to{' '}
          <strong className="text-slate-800 dark:text-slate-200">{email || 'your email'}</strong>
        </p>

        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/90 dark:border-slate-800/80 shadow-2xl shadow-slate-900/10 dark:shadow-black/60 rounded-3xl p-8 md:p-10 relative overflow-hidden">
          {verified ? (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Email Verified Successfully!
              </h3>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6">
                You can now sign in to your OmniManage account.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2563EB] text-white font-bold text-sm hover:bg-[#1D4ED8] transition-all shadow-md shadow-[#2563EB]/20"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center gap-2.5">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    className={inputClass}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] shadow-lg shadow-[#2563EB]/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  'Verify Email'
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-xs font-bold text-slate-600 hover:text-[#2563EB] dark:text-slate-400 dark:hover:text-white transition-colors disabled:opacity-50"
                >
                  {resending ? 'Sending...' : "Didn't receive the code? Resend"}
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
