import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  LogIn,
  LogOut,
  MapPin,
  RefreshCw,
  Sparkles,
  Timer,
  Trash2,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import PageHeader from '../../components/layout/PageHeader';
import DatePicker from '../../components/ui/DatePicker';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';

export default function Attendance() {
  const { user } = useAuth();
  const [from, setFrom] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const { styled } = useTheme();
  const queryClient = useQueryClient();

  // Live Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const { data: myTodayData, refetch: refetchMyToday } = useQuery({
    queryKey: ['my-attendance-today'],
    queryFn: async () => {
      try {
        const res = await api.get('/attendance/my-today');
        return res.data?.data || null;
      } catch {
        return null;
      }
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
    queryKey: ['attendance-report', from, to, selectedEmployee],
    queryFn: async () => {
      const res = await api.get('/attendance/report', {
        params: { from, to, employee: selectedEmployee, limit: 100 },
      });
      return res.data;
    },
  });

  const [shiftNotes, setShiftNotes] = useState('');
  const [useGeo, setUseGeo] = useState(false);
  const [geoCoords, setGeoCoords] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUseGeo(true);
        setGettingLocation(false);
        toast.success('Location acquired');
      },
      (err) => {
        setGettingLocation(false);
        toast.error('Could not get GPS location');
      },
      { timeout: 8000 }
    );
  };

  const checkInMutation = useMutation({
    mutationFn: async ({ employeeId, notes, location } = {}) => {
      if (employeeId) {
        return api.post('/attendance/check-in', { employeeId, notes, location });
      }
      return api.post('/attendance/my-check-in', { notes, location });
    },
    onSuccess: () => {
      toast.success('Checked in successfully! Have a productive shift.');
      setShiftNotes('');
      queryClient.invalidateQueries({ queryKey: ['attendance-report'] });
      queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['my-employee'] });
      queryClient.invalidateQueries({ queryKey: ['employees-list'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Check-in failed'),
  });

  const checkOutMutation = useMutation({
    mutationFn: async ({ employeeId, location } = {}) => {
      if (employeeId) {
        return api.post('/attendance/check-out', { employeeId, location });
      }
      return api.post('/attendance/my-check-out', { location });
    },
    onSuccess: () => {
      toast.success('Checked out successfully! Shift completed.');
      queryClient.invalidateQueries({ queryKey: ['attendance-report'] });
      queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['my-employee'] });
      queryClient.invalidateQueries({ queryKey: ['employees-list'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Check-out failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/attendance/${id}`);
    },
    onSuccess: () => {
      toast.success('Attendance record deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['attendance-report'] });
      queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['my-employee'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete attendance record'),
  });

  const handleDeleteRecord = (r) => {
    const staffName = r.employee?.name || 'this staff';
    const dateStr = r.date ? new Date(r.date).toLocaleDateString() : '';
    confirmDelete(
      `Are you sure you want to delete attendance record for "${staffName}" (${dateStr})?`,
      () => {
        deleteMutation.mutate(r._id || r.id);
      }
    );
  };

  const employees = empData || [];
  const records = data?.data || [];

  // Find logged-in user's employee record (from /attendance/my-today or /employees/me or fallback list search)
  const myEmployee =
    myTodayData?.employee ||
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
      designation: user?.roleName || user?.role?.name || 'Staff',
      id: null,
      _id: null,
    };

  const todayStr = new Date().toISOString().slice(0, 10);
  const myTodayRecord =
    myTodayData?.attendance ||
    records.find(
      (r) =>
        String(r.employee?._id || r.employee?.id || r.employee) ===
          String(myEmployee?._id || myEmployee?.id) &&
        (String(r.date).slice(0, 10) === todayStr ||
          new Date(r.date).toISOString().slice(0, 10) === todayStr)
    );

  const isCheckedIn = Boolean(myTodayRecord?.checkIn);
  const isCheckedOut = Boolean(myTodayRecord?.checkOut);

  const presentCount = records.filter((r) => r.status === 'present' || r.status === 'late').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;

  const cardClass = styled
    ? 'neu-card p-5'
    : 'bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm';

  // Format Helper for Hours & Duration
  const formatDuration = (checkIn, checkOut) => {
    if (!checkIn) return '-';
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : currentTime;
    const diffMs = end - start;
    if (diffMs <= 0) return '0m';
    const totalMins = Math.floor(diffMs / (1000 * 60));
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Employee Attendance & Shift Tracker"
        subtitle="Track staff check-ins, check-outs, shift durations, and monthly attendance records."
        icon={Clock}
        breadcrumbs={['HR & Payroll', 'Attendance Tracker']}
        actions={
          <div className="flex items-center gap-3">
            {/* Live Clock Display */}
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
              <Timer className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
              <span>
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="rounded-xl h-10 px-3 border-slate-200 dark:border-slate-800"
              title="Refresh Records"
            >
              <RefreshCw
                className={`w-4 h-4 text-slate-600 dark:text-slate-300 ${isFetching ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        }
      />

      {/* ── 1. MY ATTENDANCE TODAY BANNER ── */}
      {myEmployee && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/30 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> My Attendance Today
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                {myEmployee.name}
                <span className="text-xs font-mono font-semibold text-slate-400 px-2 py-0.5 rounded-lg bg-white/10">
                  {myEmployee.employeeId || 'EMP-STAFF'}
                </span>
              </h2>

              <p className="text-xs text-slate-300 flex items-center gap-2">
                <span>
                  Role/Designation:{' '}
                  <strong>
                    {myEmployee.designation || myEmployee.department || 'Staff Member'}
                  </strong>
                </span>
                <span>•</span>
                {isCheckedOut ? (
                  <span className="text-rose-300 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Shift Completed (Checked Out at{' '}
                    {new Date(myTodayRecord.checkOut).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    )
                  </span>
                ) : isCheckedIn ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />{' '}
                    Shift Active (In Workshop since{' '}
                    {new Date(myTodayRecord.checkIn).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    )
                  </span>
                ) : (
                  <span className="text-amber-300 font-medium">Not checked in yet today</span>
                )}
              </p>
            </div>

            {/* Check-In / Check-Out Actions & Optional Shift Note */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {!isCheckedIn && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shiftNotes}
                    onChange={(e) => setShiftNotes(e.target.value)}
                    placeholder="Shift note (optional)..."
                    className="h-11 px-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gettingLocation}
                    title={geoCoords ? 'GPS Acquired' : 'Add GPS Location'}
                    className={`h-11 px-3 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      geoCoords
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : 'bg-white/10 border-white/20 text-slate-300 hover:bg-white/15'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${gettingLocation ? 'animate-bounce text-amber-400' : ''}`} />
                    <span className="hidden lg:inline">{geoCoords ? 'GPS Set' : 'Location'}</span>
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  onClick={() =>
                    checkInMutation.mutate({
                      notes: shiftNotes || undefined,
                      location: geoCoords || undefined,
                    })
                  }
                  disabled={checkInMutation.isPending || isCheckedIn}
                  className={`h-11 px-6 rounded-2xl font-bold text-xs gap-2 transition-all shadow-lg ${
                    isCheckedIn
                      ? 'bg-slate-800/80 text-slate-400 border border-slate-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  {isCheckedIn ? 'Checked In' : 'Check In Now'}
                </Button>

                <Button
                  onClick={() =>
                    checkOutMutation.mutate({
                      location: geoCoords || undefined,
                    })
                  }
                  disabled={checkOutMutation.isPending || !isCheckedIn || isCheckedOut}
                  className={`h-11 px-6 rounded-2xl font-bold text-xs gap-2 transition-all shadow-lg ${
                    !isCheckedIn || isCheckedOut
                      ? 'bg-slate-800/80 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-rose-500/20'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  {isCheckedOut ? 'Checked Out' : 'Check Out'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. QUICK STAFF CHECK-IN / CHECK-OUT GRID (ADMIN / MANAGER) ── */}
      {isAdminOrManager && (
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Quick Staff Shift
              Actions
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">1-Click Manager Override</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {employees.slice(0, 12).map((emp) => {
              const empToday = records.find(
                (r) =>
                  String(r.employee?._id || r.employee?.id || r.employee) ===
                    String(emp._id || emp.id) &&
                  (String(r.date).slice(0, 10) === todayStr ||
                    new Date(r.date).toISOString().slice(0, 10) === todayStr)
              );
              const empIn = Boolean(empToday?.checkIn);
              const empOut = Boolean(empToday?.checkOut);

              return (
                <div
                  key={emp._id || emp.id}
                  className="bg-slate-50/80 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {emp.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                      <span>{emp.employeeId || 'STAFF'}</span>
                      {empOut ? (
                        <span className="text-rose-500 font-semibold">• Checked Out</span>
                      ) : empIn ? (
                        <span className="text-emerald-500 font-semibold">• Active</span>
                      ) : (
                        <span className="text-slate-400">• Off</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => checkInMutation.mutate(emp._id || emp.id)}
                      disabled={checkInMutation.isPending || empIn}
                      className={`p-1.5 rounded-lg transition-colors ${
                        empIn
                          ? 'opacity-40 cursor-not-allowed text-slate-400'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                      }`}
                      title={empIn ? 'Already Checked In' : 'Check In Staff'}
                    >
                      <LogIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => checkOutMutation.mutate(emp._id || emp.id)}
                      disabled={checkOutMutation.isPending || !empIn || empOut}
                      className={`p-1.5 rounded-lg transition-colors ${
                        !empIn || empOut
                          ? 'opacity-40 cursor-not-allowed text-slate-400'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
                      }`}
                      title={empOut ? 'Already Checked Out' : 'Check Out Staff'}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 3. METRIC STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Attendance Records
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1.5 font-mono">
            {records.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Selected Date Period</div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Present Count
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono">
            {presentCount}
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-medium">
            On-duty Staff
          </div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Late Entries
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1.5 font-mono">
            {lateCount}
          </div>
          <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1 font-medium">
            Checked in after 10 AM
          </div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Absent / Unreported
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1.5 font-mono">
            {absentCount}
          </div>
          <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-1 font-medium">
            Off-duty / Leaves
          </div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── 4. DATE RANGE & EMPLOYEE FILTERS ── */}
      <div className={cardClass}>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              From Date
            </label>
            <DatePicker value={from} onChange={setFrom} placeholder="From Date" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              To Date
            </label>
            <DatePicker value={to} onChange={setTo} placeholder="To Date" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Filter by Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="h-10 px-3 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none min-w-[200px]"
            >
              <option value="">All Employees ({employees.length})</option>
              {employees.map((emp) => (
                <option key={emp._id || emp.id} value={emp._id || emp.id}>
                  {emp.name} ({emp.employeeId || 'STAFF'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 5. ATTENDANCE LOG TABLE ── */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="px-4 py-3.5 text-left">Employee Staff</th>
                <th className="px-4 py-3.5 text-left">Date</th>
                <th className="px-4 py-3.5 text-left">Check In</th>
                <th className="px-4 py-3.5 text-left">Check Out</th>
                <th className="px-4 py-3.5 text-left">Shift Status</th>
                <th className="px-4 py-3.5 text-right">Shift Duration</th>
                {isAdminOrManager && <th className="px-4 py-3.5 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={isAdminOrManager ? 7 : 6}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Loading attendance records...</span>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdminOrManager ? 7 : 6}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    No attendance records found for the selected period
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const durationStr = formatDuration(r.checkIn, r.checkOut);
                  const isShiftActive = r.checkIn && !r.checkOut;
                  const statusUpper = String(r.status || 'present').toUpperCase();

                  return (
                    <tr
                      key={r._id || r.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{r.employee?.name || 'Staff Member'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {r.employee?.employeeId || 'EMP-STAFF'}{' '}
                          {r.employee?.designation ? `• ${r.employee.designation}` : ''}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                        {new Date(r.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="px-4 py-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {r.checkIn
                          ? new Date(r.checkIn).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : '-'}
                      </td>

                      <td className="px-4 py-3 font-mono font-semibold text-rose-600 dark:text-rose-400">
                        {r.checkOut
                          ? new Date(r.checkOut).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : '-'}
                      </td>

                      <td className="px-4 py-3">
                        {statusUpper === 'PRESENT' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-200 dark:border-emerald-800/50">
                            <Check className="w-3 h-3" /> PRESENT
                          </span>
                        )}
                        {statusUpper === 'LATE' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] border border-amber-200 dark:border-amber-800/50">
                            <Clock className="w-3 h-3" /> LATE ENTRY
                          </span>
                        )}
                        {statusUpper === 'HALF-DAY' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-extrabold text-[10px] border border-blue-200 dark:border-blue-800/50">
                            HALF DAY
                          </span>
                        )}
                        {statusUpper === 'ABSENT' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] border border-rose-200 dark:border-rose-800/50">
                            <AlertTriangle className="w-3 h-3" /> ABSENT
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {isShiftActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[11px] animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />{' '}
                            Active ({durationStr})
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {durationStr}
                          </span>
                        )}
                      </td>

                      {isAdminOrManager && (
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteRecord(r)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Delete Attendance Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
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
