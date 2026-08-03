import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';

const LEAVE_TYPES = ['sick', 'casual', 'annual', 'maternity', 'paternity', 'unpaid', 'other'];
const STATUS_COLORS = {
  pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  approved: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  rejected: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
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
    ['ADMIN', 'MANAGER'].includes(user?.role?.name || user?.role);

  const { data: empData } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const res = await api.get('/employees', { params: { limit: 200 } });
      return res.data?.data || [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['leaves', search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/leave', { params: { search, status: statusFilter, limit: 100 } });
      return res.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id) => api.put(`/leave/${id}/status`, { status: 'approved' }),
    onSuccess: () => {
      toast.success('Leave approved');
      queryClient.invalidateQueries(['leaves']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, rejectionReason }) =>
      api.put(`/leave/${id}/status`, { status: 'rejected', rejectionReason }),
    onSuccess: () => {
      toast.success('Leave rejected');
      queryClient.invalidateQueries(['leaves']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/leave/${id}`),
    onSuccess: () => {
      toast.success('Leave deleted');
      queryClient.invalidateQueries(['leaves']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const leaves = data?.data || [];
  const employees = empData || [];
  const pending = leaves.filter((l) => l.status === 'pending').length;
  const approved = leaves.filter((l) => l.status === 'approved').length;
  const rejected = leaves.filter((l) => l.status === 'rejected').length;

  const cardClass = styled
    ? 'neu-card p-4'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Leave Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Apply, approve or reject employee leave requests
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-lg text-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Apply Leave
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Pending',
            value: pending,
            icon: Clock,
            color: 'text-yellow-600 dark:text-yellow-400',
          },
          {
            label: 'Approved',
            value: approved,
            icon: CheckCircle,
            color: 'text-green-600 dark:text-green-400',
          },
          {
            label: 'Rejected',
            value: rejected,
            icon: XCircle,
            color: 'text-red-600 dark:text-red-400',
          },
        ].map((s) => (
          <div key={s.label} className={cardClass}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {s.label}
              </span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isLoading ? (
                <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                s.value
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={cardClass}>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by employee name..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Employee
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Type</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">
                  Period
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Days</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-400">
                    No leave records found
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr
                    key={l._id}
                    className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {l.employee?.name || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {l.employee?.employeeId} &middot; {l.employee?.department}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 capitalize">
                        {l.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 hidden md:table-cell">
                      {new Date(l.fromDate).toLocaleDateString()} -{' '}
                      {new Date(l.toDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                      {l.days}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${STATUS_COLORS[l.status]}`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {l.status === 'pending' && isAdminOrManager && (
                          <>
                            <button
                              onClick={() => approveMutation.mutate(l._id)}
                              className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Rejection reason:');
                                if (reason !== null)
                                  rejectMutation.mutate({ id: l._id, rejectionReason: reason });
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {(l.status !== 'approved' || isAdminOrManager) && (
                          <button
                            onClick={() =>
                              confirmDelete('Delete this leave request?', () =>
                                deleteMutation.mutate(l._id)
                              )
                            }
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <LeaveModal
          employees={employees}
          isAdminOrManager={isAdminOrManager}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function LeaveModal({ employees, isAdminOrManager, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    employee: '',
    type: 'sick',
    fromDate: '',
    toDate: '',
    days: 1,
    reason: '',
  });

  const mutation = useMutation({
    mutationFn: async (data) => api.post('/leave', data),
    onSuccess: () => {
      toast.success('Leave request submitted');
      queryClient.invalidateQueries(['leaves']);
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to submit'),
  });

  const calcDays = (from, to) => {
    if (!from || !to) return 1;
    const diff = Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1;
    return Math.max(1, diff);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ ...form, days: calcDays(form.fromDate, form.toDate) });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Apply for Leave</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isAdminOrManager && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Employee *
              </label>
              <select
                required
                value={form.employee}
                onChange={(e) => setForm({ ...form, employee: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Leave Type *
            </label>
            <select
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB] capitalize"
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                From *
              </label>
              <input
                type="date"
                required
                value={form.fromDate}
                onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                To *
              </label>
              <input
                type="date"
                required
                value={form.toDate}
                onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Reason *
            </label>
            <textarea
              required
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
              placeholder="Reason for leave..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2"
            >
              {mutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
