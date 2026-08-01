import { AlertCircle, CheckCircle, Copy, ShieldCheck, X } from 'lucide-react';
import React, { useState } from 'react';
import { api } from '../../lib/api';

export const MFASetupModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('INIT'); // INIT, VERIFY, SUCCESS
  const [mfaData, setMfaData] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleStartSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/mfa/setup');
      setMfaData(res.data.data);
      setStep('VERIFY');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/mfa/verify', { token });
      setStep('SUCCESS');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid TOTP verification code');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (mfaData?.backupCodes) {
      navigator.clipboard.writeText(mfaData.backupCodes.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Two-Factor Authentication (2FA)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Secure your shop account with TOTP
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'INIT' && (
          <div className="space-y-4 text-center py-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Enhance security by requiring an authenticator app (Google Authenticator, Authy) when
              logging in.
            </p>
            <button
              onClick={handleStartSetup}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Initiating Setup...' : 'Setup 2FA Now'}
            </button>
          </div>
        )}

        {step === 'VERIFY' && mfaData && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl text-center space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                1. Secret Key (Enter in Authenticator App):
              </p>
              <code className="text-sm font-mono tracking-wider font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg select-all inline-block">
                {mfaData.secret}
              </code>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                2. Enter 6-digit verification code:
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="000000"
                className="w-full text-center text-xl font-mono tracking-widest py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
              />
            </div>

            {mfaData.backupCodes && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Backup Codes:
                  </span>
                  <button
                    type="button"
                    onClick={copyBackupCodes}
                    className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1 font-mono text-[11px] text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                  {mfaData.backupCodes.map((code, idx) => (
                    <span key={idx}>{code}</span>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || token.length !== 6}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify and Enable 2FA'}
            </button>
          </form>
        )}

        {step === 'SUCCESS' && (
          <div className="text-center py-6 space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
              2FA Enabled Successfully!
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your account is now protected with 2-Step Verification.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
