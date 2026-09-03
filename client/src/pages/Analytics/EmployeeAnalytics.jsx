import { useQuery } from '@tanstack/react-query';
import { Clock, RefreshCw, TrendingUp, UserCheck, Users } from 'lucide-react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../../lib/api';
import ChartTooltip from '../../components/charts/ChartTooltip';
const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

export default function EmployeeAnalytics() {
  const [period, setPeriod] = useState('month');

  const {
    data: analytics,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['employee-analytics', period],
    queryFn: async () => {
      const { data } = await api.get('/reports/employees', {
        params: { period },
      });
      return data?.data;
    },
  });

  const stats = analytics?.stats || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Employee Analytics</h1>
          <p className="text-sm text-muted-foreground">Workforce performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-background text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          <button onClick={() => refetch()} className="p-2 rounded-lg border hover:bg-muted">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees || 0}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday || 0}
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          title="Avg. Working Hours"
          value={`${stats.avgWorkingHours || 0}h`}
          icon={Clock}
          color="violet"
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats.attendanceRate || 0}%`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border bg-card">
          <h3 className="text-lg font-semibold mb-4">Sales Revenue by Employee</h3>
          <div className="h-[300px] w-full">
            {(analytics?.salesByEmployee || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm font-medium bg-muted/20 rounded-xl border border-dashed">
                <Users className="w-8 h-8 mb-2 opacity-40" />
                No employee sales recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.salesByEmployee}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip isCurrency={true} />} />
                  <Bar
                    dataKey="totalRevenue"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    name="Total Revenue (৳)"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl border bg-card">
          <h3 className="text-lg font-semibold mb-4">Attendance Trend</h3>
          <div className="h-[300px] w-full">
            {(analytics?.attendanceTrend || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm font-medium bg-muted/20 rounded-xl border border-dashed">
                <Clock className="w-8 h-8 mb-2 opacity-40" />
                No attendance logs found for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip unit="staff" />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="present"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Present"
                  />
                  <Line
                    type="monotone"
                    dataKey="absent"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Absent"
                  />
                  <Line
                    type="monotone"
                    dataKey="late"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Late"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Department Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border bg-card">
          <h3 className="text-lg font-semibold mb-4">Department Distribution</h3>
          <div className="h-[300px] w-full">
            {(analytics?.departmentDistribution || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm font-medium bg-muted/20 rounded-xl border border-dashed">
                <Users className="w-8 h-8 mb-2 opacity-40" />
                No department data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.departmentDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="department"
                  >
                    {analytics.departmentDistribution.map((_entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip unit="employees" />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl border bg-card">
          <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
          {(analytics?.salesByEmployee || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[240px] text-muted-foreground text-sm font-medium bg-muted/20 rounded-xl border border-dashed">
              <TrendingUp className="w-8 h-8 mb-2 opacity-40" />
              No sales recorded by staff yet
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.salesByEmployee.slice(0, 5).map((emp, i) => (
                <div
                  key={emp.name || i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-bold text-indigo-600">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{emp.name}</div>
                    <div className="text-xs text-muted-foreground">Staff</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-emerald-600 dark:text-emerald-400">
                      ৳{Number(emp.totalRevenue || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">{emp.salesCount || 0} Sales</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="p-5 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className={`p-2 rounded-xl bg-${color}-100 dark:bg-${color}-900/30`}>
          <Icon className={`h-4 w-4 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
