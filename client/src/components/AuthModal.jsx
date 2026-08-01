import { ArrowRight, KeyRound, Mail, RefreshCw, ShieldCheck, X } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import api from '../lib/api';

export default function AuthModal({ onClose, onLoginSuccess }) {
  const [step, setStep] = useState(1); // 1 = Login, 2 = OTP verification
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      const json = res.data.data;
      setLoading(false);

      setTargetEmail(json.email);
      setStep(2);

      toast.success(`OTP Verification Code sent to ${json.email}`, { duration: 6000 });
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email: targetEmail, otpCode });
      const json = res.data.data;
      setLoading(false);

      toast.success('2-Step Verification Successful!', {
        description: `Welcome back, ${json.user.fullName || json.user.username}`,
      });
      onLoginSuccess(json.user, json.token);
      onClose();
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-card border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/60">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-100">
              {step === 1 ? 'ERP Staff Login' : '2-Step Verification'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {step === 1 ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Send OTP Code <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <Mail className="w-8 h-8 text-blue-400 mx-auto animate-bounce" />
                <p className="text-xs text-gray-400">Enter the 6-digit OTP code sent to</p>
                <p className="text-sm font-semibold text-gray-200">{targetEmail}</p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="Enter 6-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-3 py-3 text-center text-2xl font-mono tracking-widest bg-gray-900 border border-gray-700 rounded-lg text-blue-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg text-xs"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify & Login'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
