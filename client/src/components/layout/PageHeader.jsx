import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  badge,
  badgeVariant = 'secondary',
  breadcrumbs = [],
  actions,
  children,
  className,
}) {
  return (
    <div className={cn('mb-6 space-y-4', className)}>
      {/* Top section: Breadcrumb / Category indicator if provided */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          {breadcrumbs.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
              <span className={idx === breadcrumbs.length - 1 ? 'text-slate-800 dark:text-slate-200 font-semibold' : ''}>
                {item}
              </span>
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 shrink-0 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
              <Icon className="w-6 h-6" />
            </div>
          )}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                {title}
              </h1>
              {badge && (
                <Badge variant={badgeVariant} className="text-xs font-medium px-2.5 py-0.5">
                  {badge}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Toolbar */}
        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            {actions}
          </div>
        )}
      </div>

      {/* Extra Header Content (e.g. tabs, metrics strip) */}
      {children && <div className="pt-2">{children}</div>}
    </div>
  );
}
