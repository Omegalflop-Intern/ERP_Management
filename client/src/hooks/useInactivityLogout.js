import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

const INACTIVITY_TIMEOUT_MS = 90 * 60 * 1000; // 90 minutes of inactivity
const WARNING_BEFORE_MS = 2 * 60 * 1000; // Warn 2 minutes before logout (at 88th min)
const LAST_ACTIVITY_KEY = 'omni_last_activity';
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

export function useInactivityLogout() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const logoutTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const warningToastIdRef = useRef(null);
  const lastRecordedActivityRef = useRef(0);

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
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    toast.warning('You have been logged out due to 90 minutes of inactivity.');
    await logout();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }, [logout, clearTimers, dismissWarningToast]);

  const scheduleTimers = useCallback(
    (elapsedMs = 0) => {
      clearTimers();
      dismissWarningToast();

      const remainingLogoutMs = Math.max(0, INACTIVITY_TIMEOUT_MS - elapsedMs);
      const remainingWarningMs = Math.max(0, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS - elapsedMs);

      // Schedule warning toast
      if (remainingWarningMs > 0) {
        warningTimerRef.current = setTimeout(() => {
          warningToastIdRef.current = toast.warning(
            'Your session will expire in 2 minutes due to inactivity.',
            {
              id: 'inactivity-warning',
              duration: WARNING_BEFORE_MS,
              action: {
                label: 'Stay logged in',
                onClick: () => recordActivity(true),
              },
            }
          );
        }, remainingWarningMs);
      } else if (remainingLogoutMs > 0 && remainingLogoutMs <= WARNING_BEFORE_MS) {
        // Already in the warning window
        warningToastIdRef.current = toast.warning(
          `Your session will expire in ${Math.ceil(remainingLogoutMs / 60000)} minute(s) due to inactivity.`,
          {
            id: 'inactivity-warning',
            duration: remainingLogoutMs,
            action: {
              label: 'Stay logged in',
              onClick: () => recordActivity(true),
            },
          }
        );
      }

      // Schedule final logout
      logoutTimerRef.current = setTimeout(handleLogout, remainingLogoutMs);
    },
    [clearTimers, dismissWarningToast, handleLogout]
  );

  const recordActivity = useCallback(
    (force = false) => {
      const now = Date.now();
      // Throttle localStorage write to at most once every 3 seconds
      if (force || now - lastRecordedActivityRef.current > 3000) {
        lastRecordedActivityRef.current = now;
        try {
          localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
        } catch {
          // ignore storage write errors
        }
        scheduleTimers(0);
      }
    },
    [scheduleTimers]
  );

  // Check activity state whenever app mounts or window becomes visible/focused
  const checkActivityState = useCallback(() => {
    if (!user) return;

    const rawLastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    const now = Date.now();

    if (!rawLastActivity) {
      // First recorded activity in session
      recordActivity(true);
      return;
    }

    const lastActivityTime = parseInt(rawLastActivity, 10);
    const elapsed = isNaN(lastActivityTime) ? 0 : now - lastActivityTime;

    if (elapsed >= INACTIVITY_TIMEOUT_MS) {
      // User was away / inactive while browser was closed or tab was hidden
      handleLogout();
    } else {
      scheduleTimers(elapsed);
    }
  }, [user, handleLogout, scheduleTimers, recordActivity]);

  useEffect(() => {
    if (!user) {
      clearTimers();
      dismissWarningToast();
      return;
    }

    // Initial check on mount
    checkActivityState();

    const onActivity = () => recordActivity(false);
    const onVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkActivityState();
      }
    };

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true })
    );
    window.addEventListener('visibilitychange', onVisibilityOrFocus);
    window.addEventListener('focus', onVisibilityOrFocus);

    // Periodic heartbeat every 30 seconds to catch system sleep or clock jumps
    const heartbeatInterval = setInterval(checkActivityState, 30000);

    return () => {
      clearTimers();
      dismissWarningToast();
      clearInterval(heartbeatInterval);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
      window.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('focus', onVisibilityOrFocus);
    };
  }, [user, checkActivityState, recordActivity, clearTimers, dismissWarningToast]);
}
