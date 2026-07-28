import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LogIn,
  LogOut,
  Clock,
  Users,
  AlertTriangle,
  Calendar,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';

export default function Attendance() {
  const [from, setFrom] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
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
    queryKey: ['attendance-report', from, to, selectedEmployee],
    queryFn: async () => {
      const res = await api.get('/attendance/report', {
        params: { from, to, employee: selectedEmployee, limit: 100 },
      });
      return res.data;
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async (employeeId) => {
      return api.post('/attendance/check-in', { employeeId });
    },
    onSuccess: () => {
      toast.success('Checked in!');
      queryClient.invalidateQueries(['attendance-report']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Check-in failed'),
  });

  const checkOutMutation = useMutation({
    mutationFn: async (employeeId) => {
      return api.post('/attendance/check-out', { employeeId });
    },
    onSuccess: () => {
      toast.success('Checked out!');
      queryClient.invalidateQueries(['attendance-report']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Check-out failed'),
  });

  const employees = empData || [];
  const records = data?.data || [];
  const presentCount = records.filter((r) => r.status === 'present' || r.status === 'late').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;

  const cardClass = styled
    ? 'neu-card p-4'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track employee check-in/out and daily attendance
          </p>
        </div>
      </div>

      {/* Quick Check-in/out */}
      <div className={cardClass}>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Quick Check-in / Check-out
        </h3>
        <div className="flex flex-wrap gap-2">
          {employees.slice(0, 10).map((emp) => (
            <div key={emp._id} className="flex items-center gap-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">{emp.name}</span>
              <button
                onClick={() => checkInMutation.mutate(emp._id)}
                className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                title="Check In"
              >
                <LogIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => checkOutMutation.mutate(emp._id)}
                className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                title="Check Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Records',
            value: records.length,
            icon: Users,
            color: 'text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Present',
            value: presentCount,
            icon: Clock,
            color: 'text-green-600 dark:text-green-400',
          },
          {
            label: 'Late',
            value: lateCount,
            icon: AlertTriangle,
            color: 'text-amber-600 dark:text-amber-400',
          },
          {
            label: 'Absent',
            value: absentCount,
            icon: AlertTriangle,
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
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-red-500"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>
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
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Check In
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Check Out
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Hours</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-400">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const hours =
                    r.checkIn && r.checkOut
                      ? ((new Date(r.checkOut) - new Date(r.checkIn)) / 3600000).toFixed(1)
                      : '-';
                  return (
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
                        {new Date(r.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            r.status === 'present'
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : r.status === 'late'
                                ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                                : r.status === 'half-day'
                                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                  : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">
                        {hours}h
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
