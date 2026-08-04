import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileCheck, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { format } from 'date-fns';

const KYC_STATUS_COLORS = {
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  REJECTED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
};

export default function SAKycVerification() {
  const qc = useQueryClient();

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['sa-kyc'],
    queryFn: async () => {
      const res = await api.get('/tenants');
      return (res.data?.data || []).filter(
        (t) => t.kycDocuments?.kycStatus === 'PENDING' || t.status === 'PENDING_KYC'
      );
    },
  });

  const kycMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }) =>
      api.patch(`/tenants/${id}/verify-kyc`, { status, rejectionReason }),
    onSuccess: (_, vars) => {
      toast.success(`KYC ${vars.status === 'APPROVED' ? 'approved' : 'rejected'}`);
      qc.invalidateQueries({ queryKey: ['sa-kyc'] });
      qc.invalidateQueries({ queryKey: ['sa-stats'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'KYC update failed'),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-indigo-500" /> KYC Verification
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review and approve or reject shop owner KYC document submissions
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">All KYC submissions reviewed!</p>
          <p className="text-xs text-slate-400 mt-1">No pending verifications at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tenants.map((t) => {
            const kyc = t.kycDocuments || {};
            const docs = [
              { label: 'NID Front', url: kyc.nidFront },
              { label: 'NID Back', url: kyc.nidBack },
              { label: 'Trade License', url: kyc.tradeLicenseFile },
              { label: 'TIN Certificate', url: kyc.tinCertificate },
            ].filter((d) => d.url);

            return (
              <div key={t._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{t.shopName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{t.ownerName} · {t.email}</p>
                    <p className="text-xs text-slate-400">{t.phone}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${KYC_STATUS_COLORS[kyc.kycStatus] || KYC_STATUS_COLORS.PENDING}`}>
                    <Clock className="w-2.5 h-2.5 inline mr-1" />
                    {kyc.kycStatus || 'PENDING'}
                  </span>
                </div>

                {/* KYC numbers */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {kyc.nidNumber && (
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase mb-0.5">NID Number</div>
                      <div className="font-mono font-semibold text-slate-800 dark:text-white">{kyc.nidNumber}</div>
                    </div>
                  )}
                  {kyc.tradeLicenseNumber && (
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase mb-0.5">Trade License</div>
                      <div className="font-mono font-semibold text-slate-800 dark:text-white">{kyc.tradeLicenseNumber}</div>
                    </div>
                  )}
                </div>

                {/* Documents */}
                {docs.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Uploaded Documents</div>
                    <div className="flex flex-wrap gap-2">
                      {docs.map((doc) => (
                        <a
                          key={doc.label}
                          href={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${doc.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-medium rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                          <FileCheck className="w-3 h-3" />
                          {doc.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {kyc.reviewedAt && (
                  <p className="text-[11px] text-slate-400">
                    Last reviewed: {format(new Date(kyc.reviewedAt), 'MMM d, yyyy HH:mm')}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => kycMutation.mutate({ id: t._id, status: 'APPROVED' })}
                    disabled={kycMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl text-xs transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve KYC
                  </button>
                  <button
                    onClick={() => {
                      const reason = window.prompt('Rejection reason (optional):');
                      kycMutation.mutate({ id: t._id, status: 'REJECTED', rejectionReason: reason || 'Documents rejected by administrator' });
                    }}
                    disabled={kycMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-semibold rounded-xl text-xs border border-red-200 dark:border-red-800 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
