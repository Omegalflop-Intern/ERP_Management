import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  ExternalLink,
  ShieldCheck,
  FileText,
  User,
  Phone,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { format } from 'date-fns';

const KYC_STATUS_COLORS = {
  APPROVED:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  REJECTED:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
  PENDING:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
};

export default function SAKycVerification() {
  const qc = useQueryClient();

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['sa-kyc'],
    queryFn: async () => {
      const res = await api.get('/tenants');
      return (res.data?.data || []).filter(
        (t) => t.kycDocuments?.kycStatus === 'PENDING'
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
      qc.invalidateQueries({ queryKey: ['sa-tenants'] });
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'KYC update failed'),
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                KYC Verification Portal
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review legal identity documents, trade licenses, and merchant authorizations
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-black uppercase tracking-wider">
            {tenants.length} Pending Verifications
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                  </div>
                </div>
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800/60" />
                <div className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800/60" />
              </div>
              <div className="flex gap-2 pt-2">
                <div className="h-10 flex-1 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                <div className="h-10 flex-1 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-black text-slate-800 dark:text-slate-200 text-base">
            All KYC Submissions Cleared
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            There are no pending identity documents requiring administrative review at this time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tenants.map((t) => {
            const kyc = t.kycDocuments || {};
            const docs = [
              { label: 'NID Front', url: kyc.nidFront },
              { label: 'NID Back', url: kyc.nidBack },
              { label: 'Trade License', url: kyc.tradeLicenseFile },
              { label: 'TIN Certificate', url: kyc.tinCertificate },
            ].filter((d) => d.url);

            return (
              <div
                key={t._id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm flex flex-col justify-between space-y-5 hover:border-blue-500/30 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-600/20 shrink-0">
                        {t.shopName?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {t.shopName}
                        </h3>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{t.ownerName}</span>
                          <span>•</span>
                          <span>{t.email}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider border ${KYC_STATUS_COLORS[kyc.kycStatus] || KYC_STATUS_COLORS.PENDING}`}
                    >
                      <Clock className="w-3 h-3 inline mr-1" />
                      {kyc.kycStatus || 'PENDING'}
                    </span>
                  </div>

                  {/* Identification Numbers */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">
                        National ID / Passport
                      </div>
                      <div className="font-mono font-bold text-xs text-slate-800 dark:text-white truncate">
                        {kyc.nidNumber || 'Not provided'}
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">
                        Trade License No.
                      </div>
                      <div className="font-mono font-bold text-xs text-slate-800 dark:text-white truncate">
                        {kyc.tradeLicenseNumber || 'Not provided'}
                      </div>
                    </div>
                  </div>

                  {/* Document Attachments */}
                  <div>
                    <div className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Attached Documents ({docs.length})
                    </div>
                    {docs.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No document files uploaded</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {docs.map((doc) => (
                          <a
                            key={doc.label}
                            href={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${doc.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{doc.label}</span>
                            <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Actions Footer */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex gap-3">
                  <button
                    onClick={() => kycMutation.mutate({ id: t._id, status: 'APPROVED' })}
                    disabled={kycMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve Tenant
                  </button>
                  <button
                    onClick={() => {
                      const reason = window.prompt('Rejection reason (optional):');
                      kycMutation.mutate({
                        id: t._id,
                        status: 'REJECTED',
                        rejectionReason: reason || 'Documents rejected by administrator',
                      });
                    }}
                    disabled={kycMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-extrabold rounded-2xl text-xs uppercase tracking-wider border border-red-200 dark:border-red-800/60 transition-all"
                  >
                    <XCircle className="w-4 h-4" /> Reject
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
