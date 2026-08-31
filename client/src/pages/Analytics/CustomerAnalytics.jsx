import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Repeat, TrendingUp, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../../lib/api';
import ChartTooltip from '../../components/charts/ChartTooltip';

const _COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

export default function CustomerAnalytics() {
  const [period, setPeriod] = useState('month');

  const {
    data: analytics,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['customer-analytics', period],
    queryFn: async () => {
      const { data } = await api.get('/reports/customers', { params: { period } });
      return data?.data;
    },
  });

  const stats = analytics?.stats || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customer Analytics</h1>
          <p className="text-sm text-muted-foreground">Customer behavior and insights</p>
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
          title="Total Customers"
          value={stats.totalCustomers || 0}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="New Customers"
          value={stats.newCustomers || 0}
          icon={UserPlus}
          color="emerald"
        />
        <StatCard
          title="Avg. Spend"
          value={`৳${(stats.avgSpend || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="violet"
        />
        <StatCard
          title="Repeat Rate"
          value={`${stats.repeatRate || 0}%`}
          icon={Repeat}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border bg-card">
          <h3 className="text-lg font-semibold mb-4">Customer Growth</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.customerGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip unit="users" />} />
                <Line
                  type="monotone"
                  dataKey="newCustomers"
                  stroke="#6366f1"
                  strokeWidth={2}
                  name="New Customers"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl border bg-card">
          <h3 className="text-lg font-semibold mb-4">Top Spenders</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {(analytics?.topCustomers || analytics?.topSpenders || []).length === 0 ? (
              <div className="p-6 text-center text-slate-400">No customer records yet</div>
            ) : (
              (analytics?.topCustomers || analytics?.topSpenders || [])
                .slice(0, 5)
                .map((cust, i) => (
                  <div
                    key={cust.id || i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-bold text-indigo-600">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{cust.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {cust.phone || 'Standard Customer'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-emerald-600 dark:text-emerald-400">
                        ৳{(cust.totalSpent || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">VIP Member</div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Customer Spenders Bar Chart */}
      <div className="p-6 rounded-2xl border bg-card">
        <h3 className="text-lg font-semibold mb-4">Top Spenders Overview</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics?.topCustomers || analytics?.topSpenders || []}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip isCurrency={true} />} />
              <Bar dataKey="totalSpent" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total Spent" />
            </BarChart>
          </ResponsiveContainer>
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
