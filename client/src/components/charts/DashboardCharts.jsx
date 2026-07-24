import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const COLORS = ['#991B1B', '#DC2626', '#F87171', '#FCA5A5', '#7F1D1D', '#B91C1C'];

export default function DashboardCharts({ salesTrendData = [], dueTrendData = [], brandDistribution = [] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const textColor = isDark ? '#9CA3AF' : '#6B7280';
  const gridColor = isDark ? '#374151' : '#E5E7EB';
  const tooltipBg = isDark ? '#1F2937' : '#FFFFFF';
  const tooltipBorder = isDark ? '#374151' : '#E5E7EB';

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl p-3 shadow-lg border" style={{ background: tooltipBg, borderColor: tooltipBorder }}>
        <p className="text-xs font-semibold mb-1" style={{ color: textColor }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-xs font-medium" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? `৳${entry.value.toLocaleString()}` : entry.value}
          </p>
        ))}
      </div>
    );
  };

  if (!salesTrendData.length && !dueTrendData.length && !brandDistribution.length) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {salesTrendData.length > 0 && (
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Sales Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={salesTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: textColor }} />
              <YAxis tick={{ fontSize: 11, fill: textColor }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DC2626', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="revenue" stroke="#991B1B" strokeWidth={2.5} dot={{ fill: '#991B1B', r: 3 }} name="Revenue" />
              {salesTrendData[0]?.sales !== undefined && (
                <Line type="monotone" dataKey="sales" stroke="#60A5FA" strokeWidth={2} dot={{ fill: '#60A5FA', r: 3 }} name="Sales Count" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {dueTrendData.length > 0 && (
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Due vs Paid Collection</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dueTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: textColor }} />
              <YAxis tick={{ fontSize: 11, fill: textColor }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', rx: 6 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="paidAmount" fill="#16A34A" radius={[4, 4, 0, 0]} name="Paid Collected" />
              <Bar dataKey="dueAmount" fill="#DC2626" radius={[4, 4, 0, 0]} name="Due Balance" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {brandDistribution.length > 0 && (
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Stock by Brand</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={brandDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {brandDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} units`, name]} contentStyle={{ borderRadius: 12, border: `1px solid ${tooltipBorder}`, background: tooltipBg, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
