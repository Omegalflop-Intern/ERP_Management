import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * NumberInput - A reusable number input that prevents negative values by default.
 *
 * Props:
 * - allowNegative: set to true for fields where negatives are valid (e.g. journal entries)
 * - min: minimum value (default: 0, or -Infinity if allowNegative)
 * - All other props are passed to the native <input>
 */
function NumberInput({
  className,
  allowNegative = false,
  min,
  max,
  step,
  onKeyDown,
  onChange,
  ...props
}) {
  const defaultMin = allowNegative ? undefined : 0;
  const effectiveMin = min ?? defaultMin;

  const handleKeyDown = (e) => {
    if (!allowNegative && (e.key === '-' || e.key === 'e' || e.key === 'E')) {
      e.preventDefault();
    }
    if (onKeyDown) onKeyDown(e);
  };

  const handleChange = (e) => {
    const valStr = e.target.value;
    if (valStr === '') {
      if (onChange) onChange(e);
      return;
    }
    const numVal = Number(valStr);
    if (!allowNegative && numVal < 0) {
      e.target.value = '0';
      if (onChange) onChange(e);
      return;
    }
    if (max !== undefined && max !== null && numVal > Number(max)) {
      e.target.value = String(max);
      if (onChange) onChange(e);
      return;
    }
    if (onChange) onChange(e);
  };

  return (
    <input
      type="number"
      data-slot="number-input"
      min={effectiveMin}
      max={max}
      step={step}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      className={cn(
        'flex h-10 w-full min-w-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-xs transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
        'aria-invalid:ring-rose-500/20 aria-invalid:border-rose-500',
        className
      )}
      {...props}
    />
  );
}

export { NumberInput };
