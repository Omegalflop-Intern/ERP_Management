import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Package, RefreshCw, TrendingUp, Warehouse } from 'lucide-react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

export default function InventoryAnalytics() {
  const [period, setPeriod] = useState('month');

  const {
    data: analytics,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['inventory-analytics', period],
    queryFn: async () => {
      const { data } = await api.get('/reports/inventory', { params: { period } });
      return data?.data;
    },
  });

  const stats = analytics?.stats || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory Analytics</h1>
          <p className="text-sm text-muted-foreground">Stock levels, movement, and insights</p>
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
          title="Total Products"
          value={stats.totalProducts || 0}
          icon={Package}
          color="indigo"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockCount || 0}
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Total Stock Value"
          value={`৳${(stats.totalStockValue || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Warehouses"
          value={stats.warehouseCount || 0}
          icon={Warehouse}
          color="violet"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border bg-card">
          <h3 className="text-lg font-semibold mb-4">Stock by Category</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.categoryStock || analytics?.categoryBreakdown || []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip unit="pcs" />} />
                <Bar dataKey="value" name="Stock Count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl border bg-card">
          <h3 className="text-lg font-semibold mb-4">Stock Movement</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.stockMovement || [{ date: 'Today', inbound: stats.totalProducts || 0, outbound: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip unit="pcs" />} />
                <Legend />
                <Line type="monotone" name="Inbound (Restock)" dataKey="inbound" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" name="Outbound (Sold)" dataKey="outbound" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="p-6 rounded-2xl border bg-card">
        <h3 className="text-lg font-semibold mb-4">Low Stock Alerts</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium">Product</th>
                <th className="text-left py-3 px-4 font-medium">Brand</th>
                <th className="text-right py-3 px-4 font-medium">Current Stock</th>
                <th className="text-right py-3 px-4 font-medium">Min Required</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(analytics?.lowStockItems || []).length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-400">
                    No low stock items. Inventory is healthy! 🎉
                  </td>
                </tr>
              ) : (
                (analytics?.lowStockItems || []).map((item) => {
                  const qty = item.stockQuantity ?? item.currentStock ?? 0;
                  const min = item.minAlert ?? item.minStock ?? 2;
                  return (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{item.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{item.brand || '-'}</td>
                      <td className="py-3 px-4 text-right font-bold">{qty}</td>
                      <td className="py-3 px-4 text-right">{min}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          qty === 0
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}>
                          {qty === 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
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
