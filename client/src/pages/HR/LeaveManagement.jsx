import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import PageHeader from '../../components/layout/PageHeader';
import DatePicker from '../../components/ui/DatePicker';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';

const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick Leave' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'annual', label: 'Annual / Paid Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
  { value: 'other', label: 'Other Special Leave' },
];

const STATUS_CONFIG = {
  pending: {
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
    icon: Clock,
    label: 'Pending Approval',
  },
  approved: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
    icon: CheckCircle2,
    label: 'Approved',
  },
  rejected: {
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50',
    icon: XCircle,
    label: 'Rejected',
  },
};

export default function LeaveManagement() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { styled } = useTheme();
  const queryClient = useQueryClient();

  const isAdminOrManager =
    user?.roleName === 'ADMIN' ||
    user?.roleName === 'MANAGER' ||
    user?.roleName === 'HR_MANAGER' ||
    ['ADMIN', 'MANAGER', 'HR_MANAGER'].includes(user?.role?.name || user?.role);

  const { data: empData } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const res = await api.get('/employees', { params: { limit: 200 } });
      return res.data?.data || [];
    },
  });

  const { data: myEmployeeData } = useQuery({
    queryKey: ['my-employee'],
    queryFn: async () => {
      try {
        const res = await api.get('/employees/me');
        return res.data?.data || null;
      } catch {
        return null;
      }
    },
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['leaves', search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/leave', { params: { search, status: statusFilter, limit: 100 } });
      return res.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id) => api.put(`/leave/${id}/status`, { status: 'approved' }),
    onSuccess: () => {
      toast.success('Leave request approved successfully');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to approve leave'),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, rejectionReason }) =>
      api.put(`/leave/${id}/status`, { status: 'rejected', rejectionReason }),
    onSuccess: () => {
      toast.success('Leave request rejected');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to reject leave'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/leave/${id}`),
    onSuccess: () => {
      toast.success('Leave request cancelled / deleted');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete leave request'),
  });

  const leaves = data?.data || [];
  const employees = empData || [];

  const myEmployee =
    myEmployeeData ||
    employees.find(
      (e) =>
        String(e.user?._id || e.user?.id || e.user) === String(user?._id || user?.id) ||
        (user?.email && e.email?.toLowerCase() === user.email.toLowerCase()) ||
        (user?.name && e.name?.toLowerCase() === user.name.toLowerCase()) ||
        (user?.username && e.name?.toLowerCase() === user.username.toLowerCase()) ||
        (user?.fullName && e.name?.toLowerCase() === user.fullName.toLowerCase())
    ) || {
      name: user?.name || user?.username || 'Current User',
      employeeId: 'MY-SELF',
      department: user?.roleName || 'Staff',
      designation: user?.roleName || 'Staff',
      id: null,
      _id: null,
    };

  const pendingCount = leaves.filter((l) => l.status === 'pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'approved').length;
  const rejectedCount = leaves.filter((l) => l.status === 'rejected').length;
  const totalApprovedDays = leaves
    .filter((l) => l.status === 'approved')
    .reduce((sum, l) => sum + Number(l.days || 0), 0);

  const cardClass = styled
    ? 'neu-card p-4'
    : 'bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={isAdminOrManager ? 'Leave & Holiday Management' : 'My Leave Applications'}
        subtitle={
          isAdminOrManager
            ? 'Review, approve, reject employee leave requests and track staff holiday quotas.'
            : 'Submit leave applications, track approval status, and manage your time off.'
        }
        icon={FileText}
        breadcrumbs={['HR & Payroll', 'Leave Management']}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="rounded-xl h-10 px-3 border-slate-200 dark:border-slate-800"
              title="Refresh Leave Records"
            >
              <RefreshCw
                className={`w-4 h-4 text-slate-600 dark:text-slate-300 ${isFetching ? 'animate-spin' : ''}`}
              />
            </Button>

            <Button
              onClick={() => setShowForm(true)}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs gap-2 shadow-sm shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" /> Apply for Leave
            </Button>
          </div>
        }
      />

      {/* ── 1. STAT METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            {isAdminOrManager ? 'Pending Requests' : 'My Pending Leaves'}
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {isLoading ? '...' : pendingCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Awaiting Manager Review</div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            {isAdminOrManager ? 'Approved Leaves' : 'My Approved Leaves'}
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {isLoading ? '...' : approvedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Granted Leaves</div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            {isAdminOrManager ? 'Rejected Requests' : 'My Rejected Leaves'}
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
            {isLoading ? '...' : rejectedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Declined Applications</div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
            <XCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            {isAdminOrManager ? 'Total Days Approved' : 'My Days Taken'}
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 font-mono">
            {isLoading ? '...' : `${totalApprovedDays}d`}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Cumulative Paid/Unpaid Days</div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── 2. SEARCH & FILTER BAR ── */}
      <div className={cardClass}>
        <div className="flex flex-wrap items-center gap-3">
          {isAdminOrManager && (
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by employee name or code..."
                  className="w-full pl-10 pr-4 h-10 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none min-w-[150px]"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 3. LEAVE APPLICATIONS TABLE ── */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="px-4 py-3.5 text-left">Employee</th>
                <th className="px-4 py-3.5 text-left">Leave Type</th>
                <th className="px-4 py-3.5 text-left">Dates & Duration</th>
                <th className="px-4 py-3.5 text-left">Reason / Note</th>
                <th className="px-4 py-3.5 text-left">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Loading leave requests...</span>
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-slate-400">
                    No leave requests found
                  </td>
                </tr>
              ) : (
                leaves.map((l) => {
                  const statusInfo = STATUS_CONFIG[l.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusInfo.icon;
                  const isPending = l.status === 'pending';

                  return (
                    <tr
                      key={l._id || l.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {l.employee?.name || myEmployee.name || 'Staff Member'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {l.employee?.employeeId || myEmployee.employeeId || 'STAFF'} &middot;{' '}
                          {l.employee?.department || l.employee?.designation || 'General'}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                          {l.type}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {new Date(l.fromDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}{' '}
                          —{' '}
                          {new Date(l.toDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold font-mono">
                          {l.days} {l.days === 1 ? 'Day' : 'Days'} Total
                        </div>
                      </td>

                      <td className="px-4 py-3 max-w-[280px]">
                        <div className="text-slate-700 dark:text-slate-300 truncate" title={l.reason}>
                          {l.reason || '—'}
                        </div>
                        {l.status === 'rejected' && l.rejectionReason && (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 flex items-center gap-1 font-semibold">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            <span>Declined: {l.rejectionReason}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full border ${statusInfo.bg}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && isAdminOrManager && (
                            <>
                              <button
                                onClick={() => approveMutation.mutate(l._id || l.id)}
                                disabled={approveMutation.isPending}
                                className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                                title="Approve Leave Request"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Rejection reason (optional):');
                                  if (reason !== null)
                                    rejectMutation.mutate({
                                      id: l._id || l.id,
                                      rejectionReason: reason,
                                    });
                                }}
                                disabled={rejectMutation.isPending}
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                                title="Reject Leave Request"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Delete / Cancel Button (Available for all pending leaves or for Admins) */}
                          {(isPending || isAdminOrManager) && (
                            <button
                              onClick={() =>
                                confirmDelete('Cancel and delete this leave request?', () =>
                                  deleteMutation.mutate(l._id || l.id)
                                )
                              }
                              disabled={deleteMutation.isPending}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Cancel / Delete Request"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 4. LEAVE APPLICATION MODAL ── */}
      {showForm && (
        <LeaveModal
          employees={employees}
          myEmployee={myEmployee}
          isAdminOrManager={isAdminOrManager}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function LeaveModal({ employees, myEmployee, isAdminOrManager, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    employee: isAdminOrManager ? '' : myEmployee?._id || myEmployee?.id || '',
    type: 'casual',
    fromDate: '',
    toDate: '',
    days: 1,
    reason: '',
  });

  const mutation = useMutation({
    mutationFn: async (data) => api.post('/leave', data),
    onSuccess: () => {
      toast.success('Leave application submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to submit leave request'),
  });

  const calcDays = (from, to) => {
    if (!from || !to) return 1;
    const diff = Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1;
    return Math.max(1, diff);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const computedDays = calcDays(form.fromDate, form.toDate);
    mutation.mutate({
      ...form,
      employee: form.employee || undefined,
      days: computedDays,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
              Apply for Leave
            </h2>
            <p className="text-xs text-slate-400">
              {isAdminOrManager
                ? 'Create a leave entry on behalf of a staff member.'
                : 'Submit a new leave application for approval.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Employee Selection for Admins / Managers OR Employee Badge for Staff */}
          {isAdminOrManager ? (
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Staff Member *
              </label>
              <select
                required
                value={form.employee}
                onChange={(e) => setForm({ ...form, employee: e.target.value })}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Employee...</option>
                {employees.map((emp) => (
                  <option key={emp._id || emp.id} value={emp._id || emp.id}>
                    {emp.name} ({emp.employeeId || 'STAFF'}) - {emp.department || 'General'}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {myEmployee?.name}
                </div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-semibold">
                  {myEmployee?.employeeId || 'EMP-STAFF'} &middot; {myEmployee?.designation || myEmployee?.department || 'Staff'}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Leave Category *
            </label>
            <select
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                From Date *
              </label>
              <DatePicker
                value={form.fromDate}
                onChange={(dateStr) => setForm({ ...form, fromDate: dateStr })}
                placeholder="From Date"
                className="w-full !rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                To Date *
              </label>
              <DatePicker
                value={form.toDate}
                onChange={(dateStr) => setForm({ ...form, toDate: dateStr })}
                placeholder="To Date"
                className="w-full !rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Reason / Explanation *
            </label>
            <textarea
              required
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide context for your leave request..."
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 px-4 rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !form.fromDate || !form.toDate}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs gap-2 shadow-sm"
            >
              {mutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Submit Leave Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
