import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, DollarSign, Eye, FileText, RefreshCw, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { confirmAction, confirmDelete } from '../../lib/confirm';
import { NumberInput } from '../../components/ui/NumberInput';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Payroll() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showProcess, setShowProcess] = useState(false);
  const [viewPayslip, setViewPayslip] = useState(null);
  const [payingRecord, setPayingRecord] = useState(null);
  const { styled } = useTheme();
  const queryClient = useQueryClient();

  const { data: empData } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const res = await api.get('/employees', { params: { limit: 200 } });
      return res.data?.data || [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', month, year],
    queryFn: async () => {
      const res = await api.get('/payroll', { params: { month, year, limit: 100 } });
      return res.data;
    },
  });

  const { data: summaryData } = useQuery({
    queryKey: ['payroll-summary', month, year],
    queryFn: async () => {
      const res = await api.get('/payroll/summary', { params: { month, year } });
      return res.data?.data;
    },
  });

  const payMutation = useMutation({
    mutationFn: async ({ id, paymentMethod }) => api.put(`/payroll/${id}/pay`, { paymentMethod }),
    onSuccess: () => {
      toast.success('Salary marked as paid and accounts synced');
      setPayingRecord(null);
      queryClient.invalidateQueries(['payroll']);
      queryClient.invalidateQueries(['payroll-summary']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to pay salary'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/payroll/${id}`),
    onSuccess: () => {
      toast.success('Deleted');
      queryClient.invalidateQueries(['payroll']);
      queryClient.invalidateQueries(['payroll-summary']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const records = data?.data || [];
  const summary = summaryData || {
    totalEmployees: 0,
    paid: 0,
    pending: 0,
    totalPaid: 0,
    totalPending: 0,
    grandTotal: 0,
  };

  const cardClass = styled
    ? 'neu-card p-4'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payroll</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Process monthly salary and manage payslips
          </p>
        </div>
        <button
          onClick={() => setShowProcess(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-lg text-sm transition-all"
        >
          <DollarSign className="w-4 h-4" /> Process Salary
        </button>
      </div>

      {/* Month/Year selector */}
      <div className={cardClass}>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Employees',
            value: summary.totalEmployees,
            color: 'text-blue-600 dark:text-blue-400',
          },
          { label: 'Paid', value: summary.paid, color: 'text-green-600 dark:text-green-400' },
          {
            label: 'Pending',
            value: summary.pending,
            color: 'text-yellow-600 dark:text-yellow-400',
          },
          {
            label: 'Total Amount',
            value: `৳${summary.grandTotal?.toLocaleString()}`,
            color: 'text-gray-900 dark:text-gray-100',
          },
        ].map((s) => (
          <div key={s.label} className={cardClass}>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
              {s.label}
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>
              {isLoading ? (
                <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                s.value
              )}
            </div>
          </div>
        ))}
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
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Basic</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">
                  Allowances
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">
                  Deductions
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Net Salary
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
                    No payroll records for this period. Click "Process Salary" to generate.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr
                    key={r._id}
                    className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {r.employee?.name || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">{r.employee?.employeeId}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      ৳{r.basicSalary?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-green-600 dark:text-green-400 hidden md:table-cell">
                      +৳{r.totalAllowances?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-red-600 dark:text-red-400 hidden md:table-cell">
                      -৳{r.totalDeductions?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">
                      ৳{r.netSalary?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${r.status === 'paid' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'}`}
                      >
                        {r.status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewPayslip(r)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-500 transition-colors"
                          title="View Payslip"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setPayingRecord(r)}
                              className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 transition-colors"
                              title="Pay Salary"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                confirmDelete('Delete payroll record?', () =>
                                  deleteMutation.mutate(r._id)
                                )
                              }
                              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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

      {showProcess && (
        <ProcessPayrollModal
          employees={empData}
          month={month}
          year={year}
          onClose={() => setShowProcess(false)}
        />
      )}
      {viewPayslip && <PayslipModal payroll={viewPayslip} onClose={() => setViewPayslip(null)} />}
      {payingRecord && (
        <PaySalaryModal
          payroll={payingRecord}
          isPending={payMutation.isPending}
          onConfirm={(paymentMethod) =>
            payMutation.mutate({ id: payingRecord._id, paymentMethod })
          }
          onClose={() => setPayingRecord(null)}
        />
      )}
    </div>
  );
}

function ProcessPayrollModal({ employees, month, year, onClose }) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState([]);
  const [allowances, setAllowances] = useState({
    housing: 0,
    transport: 0,
    medical: 0,
    food: 0,
    other: 0,
  });
  const [deductions, setDeductions] = useState({
    advance: 0,
    loan: 0,
    tax: 0,
    absentDeduction: 0,
    other: 0,
  });

  const mutation = useMutation({
    mutationFn: async (data) => api.post('/payroll/process', data),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Payroll processed');
      queryClient.invalidateQueries(['payroll']);
      queryClient.invalidateQueries(['payroll-summary']);
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const toggleAll = () => {
    if (selectedIds.length === employees.length) setSelectedIds([]);
    else setSelectedIds(employees.map((e) => e._id));
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return toast.error('Select at least one employee');
    mutation.mutate({ employeeIds: selectedIds, month, year, allowances, deductions });
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
            Process Salary — {MONTHS[month - 1]} {year}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Select Employees
              </label>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                {selectedIds.length === employees.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
              {employees.map((emp) => (
                <label
                  key={emp._id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(emp._id)}
                    onChange={() => toggleOne(emp._id)}
                    className="rounded border-gray-300"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {emp.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {emp.employeeId} — ৳{emp.salary?.toLocaleString()}/mo
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase mb-2">
                Allowances
              </h4>
              {Object.keys(allowances).map((k) => (
                <div key={k} className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500 capitalize w-20">{k}</span>
                  <NumberInput
                    min="0"
                    value={allowances[k]}
                    onChange={(e) => setAllowances({ ...allowances, [k]: Number(e.target.value) })}
                    className="flex-1 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-xs"
                  />
                </div>
              ))}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase mb-2">
                Deductions
              </h4>
              {Object.keys(deductions).map((k) => (
                <div key={k} className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500 capitalize w-20">
                    {k.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <NumberInput
                    min="0"
                    value={deductions[k]}
                    onChange={(e) => setDeductions({ ...deductions, [k]: Number(e.target.value) })}
                    className="flex-1 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-xs"
                  />
                </div>
              ))}
            </div>
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
              Process ({selectedIds.length} employees)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PayslipModal({ payroll: r, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Payslip</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-red-700 dark:text-red-400">Omni-Manage</h3>
            <p className="text-xs text-gray-500">
              Payslip for {MONTHS[r.month - 1]} {r.year}
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Employee</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {r.employee?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ID</span>
              <span className="font-mono text-gray-900 dark:text-gray-100">
                {r.employee?.employeeId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Department</span>
              <span className="text-gray-900 dark:text-gray-100">{r.employee?.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Designation</span>
              <span className="text-gray-900 dark:text-gray-100">{r.employee?.designation}</span>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-800" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Basic Salary</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                ৳{r.basicSalary?.toLocaleString()}
              </span>
            </div>
            {r.allowances &&
              Object.entries(r.allowances)
                .filter(([, v]) => v > 0)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-500 capitalize">{k} Allowance</span>
                    <span className="text-green-600 dark:text-green-400">
                      +৳{v.toLocaleString()}
                    </span>
                  </div>
                ))}
            <div className="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-800 pt-2">
              <span className="text-gray-500">Total Allowances</span>
              <span className="text-green-600 dark:text-green-400">
                +৳{r.totalAllowances?.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {r.deductions &&
              Object.entries(r.deductions)
                .filter(([, v]) => v > 0)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-red-600 dark:text-red-400">-৳{v.toLocaleString()}</span>
                  </div>
                ))}
            <div className="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-800 pt-2">
              <span className="text-gray-500">Total Deductions</span>
              <span className="text-red-600 dark:text-red-400">
                -৳{r.totalDeductions?.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-between text-lg font-bold border-t-2 border-gray-900 dark:border-gray-100 pt-3">
            <span className="text-gray-900 dark:text-gray-100">Net Salary</span>
            <span className="text-red-700 dark:text-red-400">৳{r.netSalary?.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-xs text-gray-500 pt-2">
            <span>
              Status:{' '}
              <span
                className={`font-semibold ${r.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}
              >
                {r.status === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </span>
            {r.paidDate && <span>Paid: {new Date(r.paidDate).toLocaleDateString()}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaySalaryModal({ payroll: r, isPending, onConfirm, onClose }) {
  const [method, setMethod] = useState('CASH');

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Disburse Staff Salary
              </h2>
              <p className="text-xs text-gray-500">Select payment channel & confirm disbursement</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">
            &times;
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Employee Name:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{r.employee?.name || `Employee #${r.employeeId}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Month / Period:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{MONTHS[r.month - 1]} {r.year}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Disbursement Net Amount:</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">৳{r.netSalary?.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Select Payment Channel / Account *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'CASH', label: 'Cash In Hand', code: '1000', icon: '💵' },
                { id: 'BANK', label: 'Bank Transfer', code: '1010', icon: '🏦' },
                { id: 'BKASH', label: 'bKash Mobile', code: '1011', icon: '📱' },
                { id: 'NAGAD', label: 'Nagad Mobile', code: '1012', icon: '📱' },
                { id: 'ROCKET', label: 'Rocket Mobile', code: '1013', icon: '📱' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    method === m.id
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-lg">{m.icon}</span>
                  <div>
                    <div className="text-xs font-bold">{m.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Acc: #{m.code}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => onConfirm(method)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Confirm Salary Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

