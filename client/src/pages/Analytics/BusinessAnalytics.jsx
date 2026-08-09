import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Package,
  RefreshCw,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../../lib/api';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

const periods = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
];

export default function BusinessAnalytics() {
  const [period, setPeriod] = useState('month');
  const [dateRange, _setDateRange] = useState({ from: '', to: '' });

  const {
    data: analytics,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['business-analytics', period, dateRange],
    queryFn: async () => {
      const params = { period };
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;
      const { data } = await api.get('/reports/analytics', { params });
      return data?.data;
    },
  });

  const { data: salesTrend } = useQuery({
    queryKey: ['sales-trend', period],
    queryFn: async () => {
      const { data } = await api.get('/reports/sales-trend', { params: { period } });
      return data?.data;
    },
  });

  const { data: topProducts } = useQuery({
    queryKey: ['top-products', period],
    queryFn: async () => {
      const { data } = await api.get('/reports/top-products', { params: { period, limit: 5 } });
      return data?.data;
    },
  });

  const stats = analytics?.stats || {};
  const revenueGrowth = stats.revenueGrowth || 0;
  const salesGrowth = stats.salesGrowth || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Business Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive business insights and metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-background text-sm"
          >
            {periods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg border hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`৳${(stats.totalRevenue || 0).toLocaleString()}`}
          change={revenueGrowth}
          icon={DollarSign}
          color="indigo"
        />
        <StatCard
          title="Total Sales"
          value={stats.totalSales || 0}
          change={salesGrowth}
          icon={ShoppingCart}
          color="violet"
        />
        <StatCard
          title="Customers"
          value={stats.totalCustomers || 0}
          change={stats.customerGrowth || 0}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Products"
          value={stats.totalProducts || 0}
          icon={Package}
          color="fuchsia"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="p-6 rounded-2xl border bg-card">
          <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesTrend || []}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.2}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="p-6 rounded-2xl border bg-card">
          <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.paymentMethods || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="count"
                nameKey="method"
              >
                {(analytics?.paymentMethods || []).map((_entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="p-6 rounded-2xl border bg-card">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
              <Tooltip />
              <Bar dataKey="totalSold" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="p-6 rounded-2xl border bg-card">
          <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.categoryDistribution || []}
                cx="50%"
                cy="50%"
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
                nameKey="category"
              >
                {(analytics?.categoryDistribution || []).map((_entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-6 rounded-2xl border bg-card">
        <h3 className="text-lg font-semibold mb-4">Recent Sales Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium">Invoice</th>
                <th className="text-left py-3 px-4 font-medium">Customer</th>
                <th className="text-right py-3 px-4 font-medium">Amount</th>
                <th className="text-left py-3 px-4 font-medium">Payment</th>
                <th className="text-left py-3 px-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {(analytics?.recentSales || []).slice(0, 5).map((sale) => (
                <tr key={sale.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">{sale.invoiceNumber}</td>
                  <td className="py-3 px-4">{sale.customerName || 'Walk-in'}</td>
                  <td className="py-3 px-4 text-right">৳{sale.totalAmount?.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(sale.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon: Icon, color }) {
  const isPositive = change >= 0;
  return (
    <div className="p-5 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className={`p-2 rounded-xl bg-${color}-100 dark:bg-${color}-900/30`}>
          <Icon className={`h-4 w-4 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {change !== undefined && (
        <div
          className={`flex items-center gap-1 mt-2 text-xs ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}
        >
          {isPositive ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {Math.abs(change)}% from last period
        </div>
      )}
    </div>
  );
}
