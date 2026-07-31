import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000; // warn 2 minutes before logout
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

export function useInactivityLogout() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const logoutTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const warningToastIdRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
  }, []);

  const dismissWarningToast = useCallback(() => {
    if (warningToastIdRef.current) {
      toast.dismiss(warningToastIdRef.current);
      warningToastIdRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    clearTimers();
    dismissWarningToast();
    toast.warning('You have been logged out due to inactivity.');
    await logout();
    window.location.href = '/login';
  }, [logout, clearTimers, dismissWarningToast]);

  const resetTimers = useCallback(() => {
    clearTimers();
    dismissWarningToast();

    warningTimerRef.current = setTimeout(() => {
      warningToastIdRef.current = toast.warning(
        'Your session will expire in 2 minutes due to inactivity.',
        {
          id: 'inactivity-warning',
          duration: WARNING_BEFORE_MS,
          action: {
            label: 'Stay logged in',
            onClick: () => resetTimers(),
          },
        }
      );
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS);

    logoutTimerRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT_MS);
  }, [clearTimers, dismissWarningToast, handleLogout]);

  useEffect(() => {
    if (!user) return;

    resetTimers();

    let lastActivity = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastActivity > 1000) {
        lastActivity = now;
        resetTimers();
      }
    };

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true })
    );

    return () => {
      clearTimers();
      dismissWarningToast();
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
    };
  }, [user, resetTimers, clearTimers, dismissWarningToast]);
}
