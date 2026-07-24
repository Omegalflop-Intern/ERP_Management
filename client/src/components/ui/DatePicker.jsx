import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function DatePicker({
  value = '',
  onChange,
  placeholder = 'Select date',
  className = '',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { styled } = useTheme();
  const containerRef = useRef(null);

  // Parse input value (YYYY-MM-DD) or default to current date
  const parsedDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewDate, setViewDate] = useState(parsedDate);

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) setViewDate(d);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day) => {
    const selectedMonth = String(month + 1).padStart(2, '0');
    const selectedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${selectedMonth}-${selectedDay}`;
    onChange?.(dateStr);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.('');
    setIsOpen(false);
  };

  const handleSelectToday = (e) => {
    e.stopPropagation();
    const today = new Date();
    const yearStr = today.getFullYear();
    const monthStr = String(today.getMonth() + 1).padStart(2, '0');
    const dayStr = String(today.getDate()).padStart(2, '0');
    onChange?.(`${yearStr}-${monthStr}-${dayStr}`);
    setViewDate(today);
    setIsOpen(false);
  };

  // Format display date: MM/DD/YYYY or Placeholder
  const formattedDisplay = value ? (() => {
    const d = new Date(value + 'T00:00:00');
    if (isNaN(d.getTime())) return value;
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${m}/${day}/${d.getFullYear()}`;
  })() : '';

  const popoverCardClass = styled
    ? 'neu-card shadow-xl rounded-2xl'
    : 'bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl';

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:border-red-500 focus:outline-none focus:border-red-500 transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${className}`}
      >
        <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className={formattedDisplay ? 'font-medium' : 'text-gray-400'}>
          {formattedDisplay || placeholder}
        </span>
        {value && (
          <span
            onClick={handleClear}
            className="ml-auto p-0.5 text-gray-400 hover:text-red-500 rounded-full transition-colors"
            title="Clear date"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 mt-2 z-50 p-4 w-72 ${popoverCardClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Month / Year Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="font-bold text-sm text-gray-900 dark:text-gray-100">
              {monthNames[month]} {year}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {dayNames.map((d) => (
              <div key={d} className="text-xs font-semibold text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="py-1.5" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const selectedMonth = String(month + 1).padStart(2, '0');
              const selectedDay = String(dayNum).padStart(2, '0');
              const dateStr = `${year}-${selectedMonth}-${selectedDay}`;
              const isSelected = value === dateStr;

              const isToday = (() => {
                const now = new Date();
                return (
                  now.getFullYear() === year &&
                  now.getMonth() === month &&
                  now.getDate() === dayNum
                );
              })();

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-md'
                      : isToday
                      ? 'border border-red-500 text-red-600 dark:text-red-400 font-bold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-500 hover:text-red-500 font-medium transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-red-600 dark:text-red-400 hover:underline font-bold transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
