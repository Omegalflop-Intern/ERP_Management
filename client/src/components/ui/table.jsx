import * as React from 'react';
import { cn } from '@/lib/utils';

function Table({ className, ...props }) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm text-left', className)}
        {...props}
      />
    </div>
  );
}
function TableHeader({ className, ...props }) {
  return (
    <thead
      data-slot="table-header"
      className={cn('bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 [&_tr]:border-b-0', className)}
      {...props}
    />
  );
}
function TableBody({ className, ...props }) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('divide-y divide-slate-200/60 dark:divide-slate-800/60 [&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
}
function TableFooter({ className, ...props }) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn('bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 font-medium [&>tr]:last:border-b-0', className)}
      {...props}
    />
  );
}
function TableRow({ className, ...props }) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'border-b border-slate-200/60 dark:border-slate-800/60 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 data-[state=selected]:bg-slate-100 dark:data-[state=selected]:bg-slate-800',
        className
      )}
      {...props}
    />
  );
}
function TableHead({ className, ...props }) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'text-slate-600 dark:text-slate-400 h-11 px-4 text-left align-middle font-semibold text-xs uppercase tracking-wider whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className
      )}
      {...props}
    />
  );
}
function TableCell({ className, ...props }) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'p-4 align-middle whitespace-nowrap text-slate-800 dark:text-slate-200 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className
      )}
      {...props}
    />
  );
}
function TableCaption({ className, ...props }) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('text-slate-500 dark:text-slate-400 mt-4 text-sm', className)}
      {...props}
    />
  );
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };

