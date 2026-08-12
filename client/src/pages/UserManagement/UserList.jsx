import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Edit,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldOff,
  Trash2,
  UserCheck,
  UserCog,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import PageHeader from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/badge';
import EmptyState from '../../components/ui/EmptyState';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';

export default function UserList() {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [verifyUserModal, setVerifyUserModal] = useState(null);
  const queryClient = useQueryClient();

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-flat'],
    queryFn: async () => {
      const { data } = await api.get('/branches/flat');
      return data.data || [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, branchFilter],
    queryFn: async () => {
      const { data } = await api.get('/users', { params: { search, branchId: branchFilter || undefined, limit: 50 } });
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success('User account deleted');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const users = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="User Management & Access Control"
        subtitle="Create system users and assign specific branch access. Admin oversees all branches while Managers/Staff are locked to their assigned outlet."
        icon={UserCog}
        breadcrumbs={['Administration', 'User Management']}
        actions={
          <button
            onClick={() => {
              setEditUser(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl text-xs transition-all shadow-xs btn-hover-lift"
          >
            <Plus className="w-4 h-4" /> Add New User
          </button>
        }
      />

      {/* Filters Area */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name, email, username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
          >
            <option value="">Filter by Branch: All Branches</option>
            {branches.map((b, idx) => (
              <option key={b._id || b.id || idx} value={b._id || b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-light rounded-[20px] overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800">
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  User Info
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  System Role
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Assigned Outlet
                </th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Verification Status
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 w-24 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <EmptyState
                      icon={UserCog}
                      title="No Users Found"
                      description="Click below to add a new system user and complete email OTP verification."
                      actionLabel="Add System User"
                      onAction={() => setShowForm(true)}
                    />
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u._id || u.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200/60 dark:border-blue-800/40">
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {u.fullName || u.username}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" /> {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                        {u.role?.displayName || u.roleName || u.role?.name || 'Staff'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        u.branchId ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      }`}>
                        {u.branchName || u.branch?.name || (u.branchId ? `Branch #${u.branchId}` : 'Main Branch (All Outlets)')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {u.isVerified ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </Badge>
                      ) : (
                        <div className="inline-flex flex-col items-center gap-1">
                          <Badge variant="warning" className="gap-1">
                            <ShieldOff className="w-3 h-3" /> Unverified
                          </Badge>
                          <button
                            onClick={() => setVerifyUserModal(u)}
                            className="text-[11px] text-[#2563EB] dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
                          >
                            <KeyRound className="w-3 h-3" /> Enter OTP Code
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditUser(u);
                            setShowForm(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#2563EB] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-all"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            confirmDelete(`Delete user "${u.username}"?`, () => {
                              deleteMutation.mutate(u._id);
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Creation & OTP Modal */}
      {showForm && (
        <UserFormModal
          user={editUser}
          onClose={() => {
            setShowForm(false);
            setEditUser(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
          }}
        />
      )}

      {/* Standalone OTP Verification Modal for Unverified Table Users */}
      {verifyUserModal && (
        <OtpModal
          targetUser={verifyUserModal}
          onClose={() => setVerifyUserModal(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setVerifyUserModal(null);
          }}
        />
      )}
    </div>
  );
}

function UserFormModal({ user, onClose, onSuccess }) {
  const [step, setStep] = useState('form'); // 'form' or 'otp'
  const [createdUser, setCreatedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    fullName: user?.fullName || '',
    role: user?.role?._id || user?.role || '',
    branchId: user?.branchId || '',
    password: '',
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await api.get('/roles');
      return data.data || [];
    },
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-flat'],
    queryFn: async () => {
      const { data } = await api.get('/branches/flat');
      return data.data || [];
    },
  });

  const inputCls =
    'w-full px-3.5 py-2 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all';

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        phone: data.phone?.trim() ? data.phone.trim() : undefined,
        fullName: data.fullName?.trim() ? data.fullName.trim() : undefined,
      };
      if (user) {
        const { password, ...rest } = payload;
        return api.put(`/users/${user._id}`, rest);
      }
      return api.post('/users', payload);
    },
    onSuccess: (res) => {
      if (user) {
        toast.success('User updated successfully');
        onSuccess();
        onClose();
      } else {
        const createdObj = res.data?.data;
        setCreatedUser(
          createdObj || { email: form.email, fullName: form.fullName || form.username }
        );
        setStep('otp');
        toast.info(`User created! Verification OTP sent to ${form.email}`);
      }
    },
    onError: (e) => {
      const errorList = e.response?.data?.errors;
      if (Array.isArray(errorList) && errorList.length > 0) {
        toast.error(errorList.map((err) => err.message).join(' | '));
      } else {
        toast.error(e.response?.data?.message || 'Failed to save user');
      }
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-primary w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {step === 'otp' ? (
                <>
                  <KeyRound className="w-5 h-5 text-[#2563EB]" /> Email OTP Verification
                </>
              ) : user ? (
                'Edit User Profile'
              ) : (
                'Create New System User'
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {step === 'otp'
                ? `Enter 6-digit OTP code sent to ${createdUser?.email || form.email}`
                : 'Enter user credentials and assign access permissions'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: User Details Form */}
        {step === 'form' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate(form);
            }}
            className="p-6 space-y-4 text-sm"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Username *
                </label>
                <input
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="e.g. john_manager"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  System Role *
                </label>
                <select
                  required
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Select role</option>
                  {(roles || []).map((r, idx) => (
                    <option key={r._id || r.id || r.name || idx} value={r._id || r.id}>
                      {r.displayName || r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. John Doe"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Assigned Outlet (Branch)
                </label>
                <select
                  value={form.branchId}
                  onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                  className={inputCls}
                >
                  <option value="">All Outlets (Owner / Unrestricted)</option>
                  {branches.map((b, idx) => (
                    <option key={b._id || b.id || idx} value={b._id || b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Personal Email Address * (OTP will be sent here)
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@example.com"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="01711000000"
                className={`${inputCls} font-mono`}
              />
            </div>

            {!user && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Password * (Min 8 chars, A-Z, 0-9)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className={`${inputCls} !pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                {mutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : user ? (
                  'Update User'
                ) : (
                  'Create & Send OTP'
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Mandatory OTP Verification Form */
          <OtpFormContent
            email={createdUser?.email || form.email}
            onSuccess={() => {
              onSuccess();
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
}

function OtpModal({ targetUser, onClose, onSuccess }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-primary w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#2563EB]" /> Verify User OTP
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verify account for {targetUser.fullName || targetUser.username} ({targetUser.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <OtpFormContent email={targetUser.email} onSuccess={onSuccess} />
      </div>
    </div>
  );
}

function OtpFormContent({ email, onSuccess }) {
  const [otpCode, setOtpCode] = useState('');

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      return api.post('/auth/verify-otp', { email, otpCode: otpCode.trim() });
    },
    onSuccess: () => {
      toast.success('User account email verified successfully!');
      onSuccess();
    },
    onError: (e) => {
      toast.error(e.response?.data?.message || 'Invalid or expired OTP code');
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: async () => {
      return api.post('/auth/resend-otp', { email });
    },
    onSuccess: () => {
      toast.success(`Fresh OTP code sent to ${email}`);
    },
    onError: (e) => {
      toast.error(e.response?.data?.message || 'Failed to resend OTP code');
    },
  });

  return (
    <div className="p-6 space-y-4 text-sm">
      <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 text-xs space-y-1">
        <div className="font-bold text-[#2563EB] dark:text-blue-400 flex items-center gap-1.5">
          <Mail className="w-4 h-4" /> OTP Dispatched to Personal Mail
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          A 6-digit OTP security code has been sent to{' '}
          <strong className="font-semibold text-slate-900 dark:text-slate-100">{email}</strong>.
          Please check inbox/spam and enter it below to activate the account.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
          Enter 6-Digit OTP Code *
        </label>
        <input
          type="text"
          maxLength={6}
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
          placeholder="123456"
          className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-center text-xl tracking-[0.3em] font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
        />
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-slate-500 dark:text-slate-400">Didn't receive email?</span>
        <button
          type="button"
          disabled={resendOtpMutation.isPending}
          onClick={() => resendOtpMutation.mutate()}
          className="text-[#2563EB] dark:text-blue-400 font-bold hover:underline disabled:opacity-50"
        >
          {resendOtpMutation.isPending ? 'Sending...' : 'Resend OTP Email'}
        </button>
      </div>

      <div className="pt-2">
        <button
          type="button"
          disabled={otpCode.trim().length !== 6 || verifyOtpMutation.isPending}
          onClick={() => verifyOtpMutation.mutate()}
          className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
        >
          {verifyOtpMutation.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <UserCheck className="w-4 h-4" />
          )}
          Verify OTP & Activate User
        </button>
      </div>
    </div>
  );
}
