import * as React from 'react';
import { cn } from '@/lib/utils';

function Card({ className, ...props }) {
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-shadow duration-200',
        className
      )}
      {...props}
    />
  );
}
function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-1.5 p-5 md:p-6', className)}
      {...props}
    />
  );
}
function CardTitle({ className, ...props }) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-snug tracking-tight font-semibold text-lg text-slate-900 dark:text-slate-100', className)}
      {...props}
    />
  );
}
function CardDescription({ className, ...props }) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-sm text-slate-500 dark:text-slate-400 leading-relaxed', className)}
      {...props}
    />
  );
}
function CardContent({ className, ...props }) {
  return <div data-slot="card-content" className={cn('p-5 md:p-6 pt-0', className)} {...props} />;
}
function CardFooter({ className, ...props }) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center p-5 md:p-6 pt-0', className)}
      {...props}
    />
  );
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };

