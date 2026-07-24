import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 3 * 60 * 60 * 1000; // 3 hours
const WARNING_THRESHOLD = 30 * 1000; // warn 30s before logout

export default function useInactivityLogout() {
  const { logout, isAuthenticated } = useAuth();
  const timerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const warnedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    warnedRef.current = false;
  }, []);

  const handleLogout = useCallback(async () => {
    clearTimers();
    toast.error('Session expired due to inactivity. Logging out...');
    await logout();
    window.location.href = '/login';
  }, [logout, clearTimers]);

  const handleWarning = useCallback(() => {
    warnedRef.current = true;
    toast.warning('You will be logged out in 30 seconds due to inactivity.', {
      duration: 10000,
      action: {
        label: 'Stay logged in',
        onClick: () => {
          resetTimer();
        },
      },
    });
  }, []);

  const resetTimer = useCallback(() => {
    clearTimers();

    warningTimerRef.current = setTimeout(() => {
      handleWarning();
    }, INACTIVITY_TIMEOUT - WARNING_THRESHOLD);

    timerRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIMEOUT);
  }, [clearTimers, handleWarning, handleLogout]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers();
      return;
    }

    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'wheel',
      'keyup',
    ];

    const handleActivity = () => {
      if (warnedRef.current) {
        toast.dismiss();
        warnedRef.current = false;
      }
      resetTimer();
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
  }, [isAuthenticated, resetTimer, clearTimers]);
}
