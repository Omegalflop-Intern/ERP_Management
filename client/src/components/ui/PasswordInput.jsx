import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useTheme } from '../../context/ThemeContext';

export default function PasswordInput({ className, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const { styled } = useTheme();

  return (
    <div className={cn('relative', className)}>
      <input
        type={showPassword ? 'text' : 'password'}
        className={cn(
          'w-full px-3 py-2 pr-10 text-gray-900 dark:text-gray-100 text-sm focus:outline-none transition-all',
          styled
            ? 'neu-input'
            : 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500'
        )}
        {...props}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
        onClick={() => setShowPassword(!showPassword)}
        tabIndex={-1}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
