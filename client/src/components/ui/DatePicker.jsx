import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../context/ThemeContext';

export default function DatePicker({
  value = '',
  onChange,
  placeholder = 'Select date',
  className = '',
  wrapperClassName = '',
  disabled = false,
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
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

  const [popoverStyle, setPopoverStyle] = useState({});

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const popoverWidth = Math.min(288, vw - 24);

      // If less space below, open upward
      const spaceBelow = vh - rect.bottom;
      const openUp = spaceBelow < 330 && rect.top > 330;
      setOpenUpward(openUp);

      const top = openUp
        ? rect.top + window.scrollY - 330
        : rect.bottom + window.scrollY;

      const left = Math.max(12, Math.min(rect.left + window.scrollX, vw - popoverWidth - 12));

      setPopoverStyle({
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        width: `${popoverWidth}px`,
        zIndex: 999999,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInsideContainer = containerRef.current && containerRef.current.contains(event.target);
      const isInsidePopover = event.target.closest('[data-datepicker-popover]');
      if (!isInsideContainer && !isInsidePopover) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
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
  const formattedDisplay = value
    ? (() => {
        const d = new Date(value + 'T00:00:00');
        if (isNaN(d.getTime())) return value;
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${m}/${day}/${d.getFullYear()}`;
      })()
    : '';

  const popoverCardClass = styled
    ? 'neu-card shadow-2xl rounded-2xl'
    : 'bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)]';

  const isFullWidth = className.includes('w-full') || wrapperClassName.includes('w-full');

  return (
    <div
      ref={containerRef}
      className={`relative text-left ${isFullWidth ? 'w-full block' : 'inline-block'} ${wrapperClassName}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-2 text-sm rounded-xl border transition-all text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
          isFullWidth ? 'w-full' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      >
        <CalendarIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span className={formattedDisplay ? 'font-medium text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-400'}>
          {formattedDisplay || placeholder}
        </span>
        {value && (
          <span
            onClick={handleClear}
            className="ml-auto p-0.5 text-slate-400 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 rounded-full transition-colors"
            title="Clear date"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {isOpen && createPortal(
        <div
          data-datepicker-popover="true"
          style={popoverStyle}
          className={`p-3 sm:p-4 w-[280px] sm:w-72 max-w-[calc(100vw-1.5rem)] ${popoverCardClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Month / Year Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              {monthNames[month]} {year}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {dayNames.map((d) => (
              <div key={d} className="text-xs font-bold text-slate-400 dark:text-slate-400 py-1">
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
                  now.getFullYear() === year && now.getMonth() === month && now.getDate() === dayNum
                );
              })();

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30'
                      : isToday
                        ? 'border border-blue-500 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/40'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 font-semibold px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-blue-600 dark:text-blue-400 hover:underline font-bold px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
            >
              Today
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
