import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  FileText,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DatePicker from '../../components/ui/DatePicker';
import api from '../../lib/api';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

const exportToCSV = (data, filename) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) => headers.map((h) => `"${row[h] || ''}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};

const exportToPDF = (data, title) => {
  const printWindow = window.open('', '_blank');
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #1f2937; font-size: 24px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
        th { background: #f3f4f6; font-weight: bold; }
        tr:nth-child(even) { background: #f9fafb; }
        .total { font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>Generated: ${new Date().toLocaleDateString()}</p>
      <table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Payment Method</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (s) => `
            <tr>
              <td>${s.invoiceNumber}</td>
              <td>${s.customerName || 'Walk-in'}</td>
              <td>৳${s.netTotal?.toLocaleString()}</td>
              <td>${s.paymentMethod || 'Cash'}</td>
              <td>${new Date(s.createdAt).toLocaleDateString()}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <p class="total">Total Sales: ${data.length} | Total Revenue: ৳${data.reduce((sum, s) => sum + (s.netTotal || 0), 0).toLocaleString()}</p>
    </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};

const PERIODS = ['today', 'thisWeek', 'thisMonth', 'thisYear', 'custom'];

export default function SalesReport() {
  const [period, setPeriod] = useState('thisMonth');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [saleType, setSaleType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['sales-report', period, dateFrom, dateTo, saleType],
    queryFn: async () => {
      const params = { limit: 500 };
      const now = new Date();
      if (period === 'today') {
        params.from = now.toISOString().split('T')[0];
        params.to = now.toISOString().split('T')[0];
      } else if (period === 'thisWeek') {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        params.from = start.toISOString().split('T')[0];
        params.to = now.toISOString().split('T')[0];
      } else if (period === 'thisMonth') {
        params.from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        params.to = now.toISOString().split('T')[0];
      } else if (period === 'thisQuarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
        params.from = quarterStart.toISOString().split('T')[0];
        params.to = now.toISOString().split('T')[0];
      } else if (period === 'thisYear') {
        params.from = `${now.getFullYear()}-01-01`;
        params.to = now.toISOString().split('T')[0];
      } else if (period === 'custom' && dateFrom && dateTo) {
        params.from = dateFrom;
        params.to = dateTo;
      }
      if (saleType) params.saleType = saleType;
      const res = await api.get('/sales', { params });
      return res.data?.data || [];
    },
  });

  const sales = data || [];

  const stats = useMemo(() => {
    const totalReturned = sales.reduce((sum, s) => sum + (s.returnedAmount || 0), 0);
    const totalRevenue = sales.reduce(
      (sum, s) => sum + ((s.netTotal || 0) - (s.returnedAmount || 0)),
      0
    );

    const allReturnLogs = [];
    sales.forEach((s) => {
      if (s.returnLogs && s.returnLogs.length > 0) {
        s.returnLogs.forEach((log) => {
          allReturnLogs.push({
            ...log,
            invoiceNumber: s.invoiceNumber,
            customerName: s.customerName,
            customerPhone: s.customerPhone,
            saleId: s._id,
          });
        });
      }
    });

    const retailSales = sales.filter(
      (s) => s.saleType === 'RETAIL' || (!s.saleType && s.customerId?.customerType !== 'B2B')
    );
    const wholesaleSales = sales.filter(
      (s) => s.saleType === 'WHOLESALE' || s.customerId?.customerType === 'B2B'
    );

    const retailRevenue = retailSales.reduce(
      (sum, s) => sum + ((s.netTotal || 0) - (s.returnedAmount || 0)),
      0
    );
    const wholesaleRevenue = wholesaleSales.reduce(
      (sum, s) => sum + ((s.netTotal || 0) - (s.returnedAmount || 0)),
      0
    );

    const totalPaidRaw = sales.reduce((sum, s) => {
      return (
        sum +
        (s.paymentBreakdown?.cash || 0) +
        (s.paymentBreakdown?.bkash || 0) +
        (s.paymentBreakdown?.rocket || 0) +
        (s.paymentBreakdown?.nagad || 0) +
        (s.paymentBreakdown?.bank || 0)
      );
    }, 0);
    const totalPaid = Math.max(0, totalPaidRaw - totalReturned);

    const totalDue = sales.reduce((sum, s) => sum + (s.paymentBreakdown?.dueAmount || 0), 0);
    const totalDiscount = sales.reduce((sum, s) => sum + (s.discount || 0), 0);
    const avgSale = sales.length > 0 ? totalRevenue / sales.length : 0;

    return {
      totalRevenue,
      retailRevenue,
      wholesaleRevenue,
      retailCount: retailSales.length,
      wholesaleCount: wholesaleSales.length,
      totalPaid,
      totalDue,
      totalDiscount,
      totalReturned,
      allReturnLogs,
      avgSale,
      totalSales: sales.length,
    };
  }, [sales]);

  const paymentBreakdown = useMemo(() => {
    const breakdown = { cash: 0, bkash: 0, rocket: 0, nagad: 0, bank: 0, due: 0 };
    sales.forEach((s) => {
      breakdown.cash += s.paymentBreakdown?.cash || 0;
      breakdown.bkash += s.paymentBreakdown?.bkash || 0;
      breakdown.rocket += s.paymentBreakdown?.rocket || 0;
      breakdown.nagad += s.paymentBreakdown?.nagad || 0;
      breakdown.bank += s.paymentBreakdown?.bank || 0;
      breakdown.due += s.paymentBreakdown?.dueAmount || 0;
    });
    return Object.entries(breakdown)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, [sales]);

  const dailySales = useMemo(() => {
    const grouped = {};
    sales.forEach((s) => {
      const date = new Date(s.createdAt).toLocaleDateString('en-BD', {
        month: 'short',
        day: 'numeric',
      });
      grouped[date] = (grouped[date] || 0) + (s.netTotal || 0);
    });
    return Object.entries(grouped)
      .map(([date, total]) => ({ date, total }))
      .slice(-15);
  }, [sales]);

  const COLORS = ['#dc2626', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6', '#6b7280'];

  const statCards = [
    {
      label: 'Net Revenue',
      value: `৳${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Retail Revenue (B2C)',
      value: `৳${stats.retailRevenue.toLocaleString()} (${stats.retailCount})`,
      icon: ShoppingCart,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Wholesale Revenue (B2B)',
      value: `৳${stats.wholesaleRevenue.toLocaleString()} (${stats.wholesaleCount})`,
      icon: TrendingUp,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      label: 'Net Collected Cash',
      value: `৳${stats.totalPaid.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Total Returns & Refunds',
      value: `৳${stats.totalReturned.toLocaleString()} (${stats.allReturnLogs.length} logs)`,
      icon: RotateCcw,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'Pending Due',
      value: `৳${stats.totalDue.toLocaleString()}`,
      icon: BarChart3,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Sales &amp; Revenue Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Analyze performance across Retail (B2C) and Wholesale (B2B) sales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(sales, `sales-report-${period}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => exportToPDF(sales, `Sales Report - ${period}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'today', label: 'Today' },
            { key: 'thisWeek', label: 'This Week' },
            { key: 'thisMonth', label: 'This Month' },
            { key: 'thisQuarter', label: 'This Quarter' },
            { key: 'thisYear', label: 'This Year' },
            { key: 'custom', label: 'Custom' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${period === p.key ? 'bg-[#2563EB] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={saleType}
            onChange={(e) => setSaleType(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#2563EB]"
          >
            <option value="">All Channels (Retail + Wholesale)</option>
            <option value="RETAIL">Retail Only (B2C)</option>
            <option value="WHOLESALE">Wholesale Only (B2B)</option>
          </select>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From Date" />
              <span className="text-gray-400">—</span>
              <DatePicker value={dateTo} onChange={setDateTo} placeholder="To Date" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">
                {card.label}
              </span>
              <div className={`w-7 h-7 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
              </div>
            </div>
            <div className={`text-lg font-bold ${card.color}`}>
              {isLoading ? (
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                card.value
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Daily Sales Trend
          </h3>
          {isLoading ? (
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f3f4f6',
                    }}
                  />
                  <Bar dataKey="total" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Payment Methods
          </h3>
          {isLoading ? (
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : paymentBreakdown.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              No data
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie
                    data={paymentBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                  >
                    {paymentBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f3f4f6',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {paymentBreakdown.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      ৳{item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Sales</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Invoice
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Customer
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Amount
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Payment
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : sales.slice(0, 20).map((s) => {
                    const paid =
                      (s.paymentBreakdown?.cash || 0) +
                      (s.paymentBreakdown?.bkash || 0) +
                      (s.paymentBreakdown?.rocket || 0) +
                      (s.paymentBreakdown?.nagad || 0) +
                      (s.paymentBreakdown?.bank || 0);
                    return (
                      <tr
                        key={s._id}
                        className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                            {s.invoiceNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {s.customerName}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                          ৳{s.netTotal?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {s.paymentBreakdown?.cash > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                                Cash
                              </span>
                            )}
                            {s.paymentBreakdown?.bkash > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400">
                                bKash
                              </span>
                            )}
                            {s.paymentBreakdown?.dueAmount > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                                Due
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                          {new Date(s.createdAt).toLocaleDateString('en-BD')}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
