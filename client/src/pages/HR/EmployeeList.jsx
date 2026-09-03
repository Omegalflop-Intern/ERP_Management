import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building,
  Calendar,
  DollarSign,
  Edit,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';
import { NumberInput } from '../../components/ui/NumberInput';
import DatePicker from '../../components/ui/DatePicker';

const DEPARTMENTS = ['Sales', 'Accounts', 'Inventory', 'Management', 'Service', 'Other'];
const DESIGNATIONS = [
  'Manager',
  'Senior',
  'Executive',
  'Officer',
  'Technician',
  'Helper',
  'Intern',
];

import PageHeader from '../../components/layout/PageHeader';
import EmptyState from '../../components/ui/EmptyState';

import { useBranchStore } from '../../store/branchStore';

export default function EmployeeList() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const { styled } = useTheme();
  const queryClient = useQueryClient();
  const activeBranchId = useBranchStore((s) => s.activeBranchId);

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search, activeBranchId],
    queryFn: async () => {
      const res = await api.get('/employees', {
        params: { search, limit: 100, branchId: activeBranchId },
      });
      return res.data;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['employee-stats', activeBranchId],
    queryFn: async () => {
      const res = await api.get('/employees/stats', { params: { branchId: activeBranchId } });
      return res.data?.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/employees/${id}`),
    onSuccess: () => {
      toast.success('Employee deleted');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-stats'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete'),
  });

  const employees = data?.data || [];
  const stats = statsData || {
    total: 0,
    active: 0,
    inactive: 0,
    avgSalary: 0,
    totalSalaryExpense: 0,
  };

  const cardClass = styled
    ? 'neu-card p-4'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Directory"
        subtitle="Manage shop staff accounts, job designations, monthly salaries, and employment statuses."
        icon={Users}
        breadcrumbs={['Staff & HR', 'Employees']}
        actions={
          <button
            onClick={() => {
              setEditEmp(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-xs transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Employees',
            value: stats.total,
            icon: Users,
            color: 'text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Active',
            value: stats.active,
            icon: UserCheck,
            color: 'text-green-600 dark:text-green-400',
          },
          {
            label: 'Inactive',
            value: stats.inactive,
            icon: UserX,
            color: 'text-red-600 dark:text-red-400',
          },
          {
            label: 'Avg Salary',
            value: `৳${Math.round(stats.avgSalary).toLocaleString()}`,
            icon: DollarSign,
            color: 'text-amber-600 dark:text-amber-400',
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
                <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                s.value
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, ID, department..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Employee
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">ID</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">
                  Department
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                  Designation
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                  Phone
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Salary</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50">
                    <td colSpan="8" className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/4" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-gray-400">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp._id}
                    className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {emp.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {emp.name}
                          </div>
                          <div className="text-xs text-gray-500">{emp.email || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {emp.employeeId}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                        {emp.department}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                      {emp.designation}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                      {emp.phone}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                      ৳{emp.salary?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${emp.isActive ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}
                      >
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditEmp(emp);
                            setShowForm(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            confirmDelete(`Delete employee "${emp.name}"?`, () =>
                              deleteMutation.mutate(emp._id)
                            )
                          }
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500 transition-colors"
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

      {showForm && (
        <EmployeeModal
          editEmp={editEmp}
          onClose={() => {
            setShowForm(false);
            setEditEmp(null);
          }}
        />
      )}
    </div>
  );
}

function EmployeeModal({ editEmp, onClose }) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await api.get('/employees', { params: { limit: 200 } });
      return data?.data || [];
    },
    enabled: !editEmp,
  });

  const generateEmpId = () => {
    const existing = (employees || []).map((e) => {
      const match = String(e.employeeId || '').match(/EMP-(\d+)/);
      return match ? Number(match[1]) : 0;
    });
    const maxNum = existing.length > 0 ? Math.max(...existing) : 0;
    return `EMP-${String(maxNum + 1).padStart(3, '0')}`;
  };

  const [form, setForm] = useState({
    name: editEmp?.name || '',
    phone: editEmp?.phone || '',
    email: editEmp?.email || '',
    employeeId: editEmp?.employeeId || '',
    designation: editEmp?.designation || '',
    department: editEmp?.department || 'Sales',
    branch: editEmp?.branch || 'Main',
    salary: editEmp?.salary || '',
    joiningDate: editEmp?.joiningDate
      ? new Date(editEmp.joiningDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    emergencyContact: editEmp?.emergencyContact || '',
    address: editEmp?.address || '',
    bloodGroup: editEmp?.bloodGroup || '',
    nidNumber: editEmp?.nidNumber || '',
    userId: editEmp?.user?._id || editEmp?.user || '',
  });

  useEffect(() => {
    if (!editEmp && employees.length > 0 && !form.employeeId) {
      setForm((prev) => ({ ...prev, employeeId: generateEmpId() }));
    }
  }, [employees, editEmp]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (editEmp) return api.put(`/employees/${editEmp._id}`, data);
      return api.post('/employees', data);
    },
    onSuccess: () => {
      toast.success(editEmp ? 'Employee updated' : 'Employee created');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-stats'] });
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Operation failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ ...form, salary: Number(form.salary) });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {editEmp ? 'Edit Employee' : 'Add Employee'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Employee ID *{' '}
                <span className="text-[10px] text-blue-500 normal-case font-normal">
                  (auto-generated)
                </span>
              </label>
              <div className="flex gap-1">
                <input
                  type="text"
                  required
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-[#2563EB]"
                  placeholder="EMP-001"
                />
                {!editEmp && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, employeeId: generateEmpId() })}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Generate new ID"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Phone *
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Department *
              </label>
              <select
                required
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Designation *
              </label>
              <select
                required
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
              >
                {DESIGNATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Branch
              </label>
              <input
                type="text"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Monthly Salary (৳) *
              </label>
              <NumberInput
                required
                min="0"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Joining Date *
              </label>
              <DatePicker
                value={form.joiningDate}
                onChange={(dateStr) => setForm({ ...form, joiningDate: dateStr })}
                placeholder="Joining Date"
                className="w-full !rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Emergency Contact
              </label>
              <input
                type="text"
                value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Blood Group
              </label>
              <select
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
              >
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                NID Number
              </label>
              <input
                type="text"
                value={form.nidNumber}
                onChange={(e) => setForm({ ...form, nidNumber: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            {!editEmp && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  User ID (linked account) *
                </label>
                <input
                  type="text"
                  required
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-[#2563EB]"
                  placeholder="Enter user ID"
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Address
            </label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
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
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2"
            >
              {mutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
              {editEmp ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
