import React from 'react';

/**
 * Modern High-Contrast Chart Tooltip for Recharts
 * Supports Dark & Light mode automatically with crisp typography.
 */
export default function ChartTooltip({ active, payload, label, unit = '', isCurrency = false }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-xl px-3.5 py-2.5 shadow-2xl backdrop-blur-xl bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 text-white min-w-[150px] space-y-1.5 z-50 pointer-events-none">
      {label && (
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 flex items-center justify-between">
          <span>{label}</span>
        </div>
      )}
      <div className="space-y-1 pt-0.5">
        {payload.map((entry, index) => {
          const name = entry.name || entry.dataKey || 'Value';
          const val = entry.value;
          const isMoney =
            isCurrency ||
            name.toLowerCase().includes('revenue') ||
            name.toLowerCase().includes('spent') ||
            name.toLowerCase().includes('total') ||
            name.toLowerCase().includes('price') ||
            name.toLowerCase().includes('due') ||
            name.toLowerCase().includes('paid');
          const isQty =
            !isMoney &&
            (unit ||
              name.toLowerCase().includes('stock') ||
              name.toLowerCase().includes('qty') ||
              name.toLowerCase().includes('inbound') ||
              name.toLowerCase().includes('outbound') ||
              name.toLowerCase().includes('count') ||
              name.toLowerCase().includes('units') ||
              name.toLowerCase().includes('pcs'));

          return (
            <div key={index} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: entry.color || '#6366f1' }}
                />
                <span className="font-medium text-slate-300">{name}</span>
              </div>
              <span className="font-extrabold text-white font-mono">
                {typeof val === 'number'
                  ? isMoney
                    ? `৳${val.toLocaleString()}`
                    : isQty
                    ? `${val.toLocaleString()} ${unit || 'pcs'}`
                    : val.toLocaleString()
                  : val}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
