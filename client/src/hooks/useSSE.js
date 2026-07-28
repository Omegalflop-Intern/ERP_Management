import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * useSSE — Connects to the server's SSE endpoint and invalidates
 * TanStack Query caches in response to real-time server events.
 *
 * Usage: Call once at the root App level (inside authenticated routes).
 */
export function useSSE() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const esRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const sseUrl = token
      ? `${API_URL}/sse/connect?token=${encodeURIComponent(token)}`
      : `${API_URL}/sse/connect`;

    const connect = () => {
      const es = new EventSource(sseUrl, { withCredentials: true });
      esRef.current = es;

      es.onopen = () => {
        console.log('[SSE] Connected to real-time event stream');
      };

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          switch (payload.type) {
            case 'connected':
              break;

            case 'SALE_COMPLETED':
              qc.invalidateQueries({ queryKey: ['sales'] });
              qc.invalidateQueries({ queryKey: ['dashboard'] });
              qc.invalidateQueries({ queryKey: ['stock'] });
              qc.invalidateQueries({ queryKey: ['products'] });
              break;

            case 'STOCK_UPDATED':
              qc.invalidateQueries({ queryKey: ['products'] });
              qc.invalidateQueries({ queryKey: ['stock'] });
              if (payload.data?.name) {
                toast.warning(`Low stock: ${payload.data.name}`);
              }
              break;

            case 'NOTIFICATION':
              qc.invalidateQueries({ queryKey: ['notifications'] });
              break;

            default:
              break;
          }
        } catch {
          // Ignore malformed events
        }
      };

      es.onerror = () => {
        console.warn('[SSE] Connection lost — reconnecting in 5s...');
        es.close();
        esRef.current = null;
        setTimeout(() => {
          if (user) connect();
        }, 5000);
      };
    };

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [user, qc]);
}
