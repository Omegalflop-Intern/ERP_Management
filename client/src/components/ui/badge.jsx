import { cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 gap-1.5 [&>svg]:size-3 transition-colors overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-white',
        secondary:
          'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
        destructive:
          'border-transparent bg-rose-500/15 text-rose-700 dark:text-rose-400 font-medium',
        outline: 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
        success:
          'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-medium',
        warning:
          'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400 font-medium',
        info:
          'border-transparent bg-sky-500/15 text-sky-700 dark:text-sky-400 font-medium',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

function Badge({ className, variant, asChild = false, ...props }) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
