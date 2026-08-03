import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, X, FileText, CheckCircle2, XCircle, ExternalLink, Calendar, CreditCard, Building } from 'lucide-react';
import { getAssetUrl } from '../../lib/api';

export function DocumentVaultModal({ tenant, onClose, onVerifyKyc }) {
  const [reason, setReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!tenant) return null;
  const kyc = tenant.kycDocuments || {};

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onVerifyKyc(tenant._id, 'APPROVED');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await onVerifyKyc(tenant._id, 'REJECTED', reason);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-[#2563EB]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                KYC & Document Vault
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  kyc.kycStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' :
                  kyc.kycStatus === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400' :
                  'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                }`}>
                  {kyc.kycStatus || 'PENDING'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tenant.shopName} ({tenant.ownerName})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <CreditCard className="w-4 h-4 text-[#2563EB]" /> National ID Information
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                NID Number: <span className="font-mono text-[#2563EB]">{kyc.nidNumber || 'Not provided'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <Building className="w-4 h-4 text-[#2563EB]" /> Business Registration
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Trade License: <span className="font-mono text-[#2563EB]">{kyc.tradeLicenseNumber || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Document Preview Gallery */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Submitted Verification Files</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* NID Front */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                  <span>NID Front Document</span>
                  {kyc.nidFront && (
                    <a href={getAssetUrl(kyc.nidFront)} target="_blank" rel="noreferrer" className="text-[#2563EB] hover:underline text-xs flex items-center gap-1">
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {kyc.nidFront ? (
                  <img src={getAssetUrl(kyc.nidFront)} alt="NID Front" className="w-full h-36 object-cover rounded-lg border border-slate-200 dark:border-slate-800" />
                ) : (
                  <div className="w-full h-36 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-400">Not Uploaded</div>
                )}
              </div>

              {/* NID Back */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                  <span>NID Back Document</span>
                  {kyc.nidBack && (
                    <a href={getAssetUrl(kyc.nidBack)} target="_blank" rel="noreferrer" className="text-[#2563EB] hover:underline text-xs flex items-center gap-1">
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {kyc.nidBack ? (
                  <img src={getAssetUrl(kyc.nidBack)} alt="NID Back" className="w-full h-36 object-cover rounded-lg border border-slate-200 dark:border-slate-800" />
                ) : (
                  <div className="w-full h-36 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-400">Not Uploaded</div>
                )}
              </div>

              {/* Trade License */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                  <span>Trade License Document</span>
                  {kyc.tradeLicenseFile && (
                    <a href={getAssetUrl(kyc.tradeLicenseFile)} target="_blank" rel="noreferrer" className="text-[#2563EB] hover:underline text-xs flex items-center gap-1">
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {kyc.tradeLicenseFile ? (
                  <div className="w-full h-36 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900 flex flex-col items-center justify-center p-3 text-center">
                    <FileText className="w-8 h-8 text-[#2563EB] mb-1" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate w-full">Trade License File</span>
                  </div>
                ) : (
                  <div className="w-full h-36 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-400">Not Uploaded</div>
                )}
              </div>

              {/* TIN Certificate */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                  <span>TIN / BIN Certificate</span>
                  {kyc.tinCertificate && (
                    <a href={getAssetUrl(kyc.tinCertificate)} target="_blank" rel="noreferrer" className="text-[#2563EB] hover:underline text-xs flex items-center gap-1">
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {kyc.tinCertificate ? (
                  <div className="w-full h-36 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900 flex flex-col items-center justify-center p-3 text-center">
                    <FileText className="w-8 h-8 text-emerald-600 mb-1" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate w-full">TIN Document</span>
                  </div>
                ) : (
                  <div className="w-full h-36 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-400">Not Uploaded</div>
                )}
              </div>

            </div>
          </div>

          {/* Rejection Form overlay */}
          {showRejectForm && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 space-y-3">
              <label className="block text-xs font-bold text-rose-800 dark:text-rose-300">
                Reason for KYC Rejection
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Unclear NID photo, expired trade license..."
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowRejectForm(false)} className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:underline">
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading || !reason.trim()}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition-colors disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            Close
          </button>
          
          <div className="flex items-center gap-3">
            {!showRejectForm && (
              <button
                onClick={() => setShowRejectForm(true)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Reject KYC
              </button>
            )}

            <button
              onClick={handleApprove}
              disabled={loading}
              className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-white" /> Approve KYC & Activate Shop
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
