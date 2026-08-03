import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Search,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Smartphone,
  Users,
  Shield,
  Loader2,
  Mail,
  Phone,
  User,
  Key,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { DocumentVaultModal } from './DocumentVaultModal';
import PasswordInput from '../../components/ui/PasswordInput';
import { confirmDelete } from '../../lib/confirm';

export default function TenantManagement() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedTenantForKyc, setSelectedTenantForKyc] = useState(null);
  const [selectedTenantForOtp, setSelectedTenantForOtp] = useState(null);
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    shopName: '',
    ownerName: '',
    username: '',
    email: '',
    phone: '',
    plan: 'STARTER',
    nidNumber: '',
    tradeLicenseNumber: '',
    password: '',
  });

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants', search],
    queryFn: async () => {
      const res = await api.get('/tenants', { params: { search } });
      return res.data?.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/tenants', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Shop Tenant created successfully');
      setShowCreateModal(false);
      setForm({
        shopName: '',
        ownerName: '',
        email: '',
        phone: '',
        plan: 'STARTER',
        nidNumber: '',
        tradeLicenseNumber: '',
        password: '',
      });
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create tenant'),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch(`/tenants/${id}/status`, { status });
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Tenant status updated to ${variables.status}`);
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Status update failed'),
  });

  const kycMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }) => {
      const res = await api.patch(`/tenants/${id}/verify-kyc`, { status, rejectionReason });
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success(`KYC status set to ${variables.status}`);
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'KYC update failed'),
  });

  const handleVerifyKyc = async (id, status, rejectionReason) => {
    await kycMutation.mutateAsync({ id, status, rejectionReason });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-[#2563EB]" /> SaaS Tenant Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage all registered Mobile Shop Tenants, KYC Documents, & Subscription Accounts
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create New Shop Owner
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by shop name, owner, email..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tenants Grid/Table */}
      {isLoading ? (
        <div className="p-12 flex justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Building2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Shop Tenants Found</h3>
          <p className="text-xs text-slate-400 mt-1">Get started by onboarding a mobile shop owner.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tenants.map((t) => (
            <div
              key={t._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Shop Name & Status Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                      {t.shopName}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                      t.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : t.status === 'PAUSED'
                        ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                        : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                {/* Owner Info */}
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 py-2 border-t border-b border-slate-100 dark:border-slate-800 my-2">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold">{t.ownerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.phone}</span>
                  </div>
                </div>

                {/* SaaS Sales & Revenue Performance */}
                <div className="grid grid-cols-2 gap-2 my-3 p-2.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Total Sales</div>
                    <div className="font-bold text-slate-900 dark:text-white">{t.stats?.totalSales || 0} Orders</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Total Revenue</div>
                    <div className="font-bold text-[#2563EB] dark:text-blue-400">৳{(t.stats?.totalRevenue || 0).toLocaleString()}</div>
                  </div>
                </div>

                {/* Plan Badges */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <span>Plan: <strong className="text-slate-900 dark:text-white font-bold">{t.plan}</strong></span>
                  <span>KYC: <strong className={t.kycDocuments?.kycStatus === 'APPROVED' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{t.kycDocuments?.kycStatus || 'PENDING'}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setSelectedTenantForKyc(t)}
                  className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-[#2563EB] dark:text-blue-400 text-xs font-semibold rounded-xl border border-blue-200 dark:border-blue-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> KYC Vault
                </button>

                {t.status !== 'ACTIVE' && (
                  <button
                    onClick={() => {
                      setSelectedTenantForOtp(t);
                      setOtpCodeInput('');
                    }}
                    className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-semibold rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
                    title="Verify Owner with OTP Pipeline"
                  >
                    <Key className="w-3.5 h-3.5" /> Enter OTP Code
                  </button>
                )}

                {t.status === 'ACTIVE' && (
                  <button
                    onClick={() => statusMutation.mutate({ id: t._id, status: 'PAUSED' })}
                    title="Pause Account"
                    className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl border border-amber-200 transition-colors"
                  >
                    <PauseCircle className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => {
                    confirmDelete(`Delete shop "${t.shopName}"?`, () => {
                      statusMutation.mutate({ id: t._id, status: 'DELETED' });
                    });
                  }}
                  title="Delete Account"
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KYC Document Vault Modal */}
      {selectedTenantForKyc && (
        <DocumentVaultModal
          tenant={selectedTenantForKyc}
          onClose={() => setSelectedTenantForKyc(null)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['tenants'] });
            setSelectedTenantForKyc(null);
          }}
        />
      )}

      {/* Admin Panel OTP Verification Modal */}
      {selectedTenantForOtp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-[#2563EB]" /> Verify OTP for {selectedTenantForOtp.shopName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter the 6-digit OTP code sent to <strong>{selectedTenantForOtp.email}</strong> to verify the shop owner account.
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!otpCodeInput || otpCodeInput.length !== 6) {
                toast.error('Please enter valid 6-digit OTP code');
                return;
              }
              setVerifyingOtp(true);
              try {
                await api.post('/auth/verify-otp', {
                  email: selectedTenantForOtp.email,
                  otpCode: otpCodeInput,
                });
                toast.success(`Verified owner of "${selectedTenantForOtp.shopName}" with OTP!`);
                qc.invalidateQueries({ queryKey: ['tenants'] });
                setSelectedTenantForOtp(null);
                setOtpCodeInput('');
              } catch (err) {
                toast.error(err.response?.data?.message || 'OTP Verification failed');
              } finally {
                setVerifyingOtp(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">6-Digit OTP Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCodeInput}
                  onChange={(e) => setOtpCodeInput(e.target.value.trim())}
                  placeholder="e.g. 123456"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-mono text-lg tracking-widest"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTenantForOtp(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:underline"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={verifyingOtp}
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5"
                >
                  {verifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Verify OTP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#2563EB]" /> Create New Shop Tenant
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Shop Name *</label>
                <input
                  type="text"
                  value={form.shopName}
                  onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                  placeholder="e.g. Rahim Telecom"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Owner Full Name *</label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  placeholder="e.g. Abdur Rahim"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Owner Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="owner@rahimtelecom.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Admin Username *</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  placeholder="e.g. rahim_admin"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Phone Number *</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="01700000000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Subscription Plan</label>
                <select
                  value={form.plan}
                  onChange={(e) => setForm({ ...form, plan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="FREE">FREE</option>
                  <option value="STARTER">STARTER</option>
                  <option value="PRO">PRO</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Initial Admin Password</label>
                <PasswordInput
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="********"
                  className="w-full text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.shopName || !form.email}
                className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                Create Shop Owner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
