import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { useBranchStore } from '../store/branchStore';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Build an absolute SSE URL from the API base.
 * EventSource resolves relative URLs against the current page path,
 * so on /super-admin/dashboard a relative "/api/v1/sse/connect"
 * would become "/super-admin/api/v1/sse/connect" (wrong).
 * Using window.location.origin + API_URL avoids this.
 */
function getSseUrl(token) {
  let baseUrl = API_URL || '/api/v1';
  if (!baseUrl.startsWith('http')) {
    const formattedPath = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
    baseUrl = `${window.location.origin}${formattedPath}`;
  }
  baseUrl = baseUrl.replace(/\/+$/, '');
  return `${baseUrl}/sse/connect?token=${encodeURIComponent(token)}`;
}

/**
 * useSSE — Connects to the server's SSE endpoint and invalidates
 * TanStack Query caches in response to real-time server events.
 *
 * Reads token from Zustand (persisted) so it always has the latest
 * valid token even after a silent refresh via api.js.
 *
 * Usage: Call once at the root App level (inside authenticated routes).
 */
export function useSSE() {
  const { user, token } = useAuthStore();
  const qc = useQueryClient();
  const esRef = useRef(null);

  useEffect(() => {
    // Only connect when a user is authenticated AND we have a token
    if (!user || !token) {
      esRef.current?.close();
      esRef.current = null;
      return;
    }

    const sseUrl = getSseUrl(token);

    const connect = () => {
      // Double-check token is still valid before connecting
      const currentToken = useAuthStore.getState().token;
      if (!currentToken) return;

      const url = getSseUrl(currentToken);
      const es = new EventSource(url, { withCredentials: true });
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
              qc.invalidateQueries({ queryKey: ['sales-channel-balances'] });
              qc.invalidateQueries({ queryKey: ['dashboard'] });
              qc.invalidateQueries({ queryKey: ['stock'] });
              qc.invalidateQueries({ queryKey: ['products'] });
              qc.invalidateQueries({ queryKey: ['accounts'] });
              qc.invalidateQueries({ queryKey: ['audit-logs'] });
              break;

            case 'STOCK_UPDATED':
            case 'PRODUCT_MUTATED':
              qc.invalidateQueries({ queryKey: ['products'] });
              qc.invalidateQueries({ queryKey: ['stock'] });
              qc.invalidateQueries({ queryKey: ['stock-overview-products'] });
              qc.invalidateQueries({ queryKey: ['categories'] });
              qc.invalidateQueries({ queryKey: ['catalog'] });
              qc.invalidateQueries({ queryKey: ['audit-logs'] });
              if (payload.data?.name && payload.type === 'STOCK_UPDATED') {
                toast.warning(`Stock update: ${payload.data.name}`);
              }
              break;

            case 'PURCHASE_COMPLETED':
              qc.invalidateQueries({ queryKey: ['purchases'] });
              qc.invalidateQueries({ queryKey: ['products'] });
              qc.invalidateQueries({ queryKey: ['stock'] });
              qc.invalidateQueries({ queryKey: ['stock-overview-products'] });
              qc.invalidateQueries({ queryKey: ['suppliers'] });
              qc.invalidateQueries({ queryKey: ['accounts'] });
              qc.invalidateQueries({ queryKey: ['audit-logs'] });
              break;

            case 'EXPENSE_MUTATED':
              qc.invalidateQueries({ queryKey: ['expenses'] });
              qc.invalidateQueries({ queryKey: ['accounts'] });
              qc.invalidateQueries({ queryKey: ['profit-loss'] });
              qc.invalidateQueries({ queryKey: ['balance-sheet'] });
              qc.invalidateQueries({ queryKey: ['audit-logs'] });
              break;

            case 'ACCOUNT_MUTATED':
              qc.invalidateQueries({ queryKey: ['accounts'] });
              qc.invalidateQueries({ queryKey: ['pos-active-accounts'] });
              qc.invalidateQueries({ queryKey: ['sales-channel-balances'] });
              qc.invalidateQueries({ queryKey: ['balance-sheet'] });
              qc.invalidateQueries({ queryKey: ['profit-loss'] });
              qc.invalidateQueries({ queryKey: ['journal-entries'] });
              qc.invalidateQueries({ queryKey: ['audit-logs'] });
              break;

            case 'CUSTOMER_MUTATED':
              qc.invalidateQueries({ queryKey: ['customers'] });
              qc.invalidateQueries({ queryKey: ['due-collection'] });
              qc.invalidateQueries({ queryKey: ['audit-logs'] });
              break;

            case 'REPAIR_MUTATED':
              qc.invalidateQueries({ queryKey: ['repairs'] });
              qc.invalidateQueries({ queryKey: ['audit-logs'] });
              break;

            case 'WARRANTY_MUTATED':
              qc.invalidateQueries({ queryKey: ['warranties'] });
              qc.invalidateQueries({ queryKey: ['audit-logs'] });
              break;

            case 'NOTIFICATION':
              qc.invalidateQueries({ queryKey: ['notifications'] });
              break;

            case 'TENANT_UPDATED':
              qc.invalidateQueries({ queryKey: ['my-tenant-info'] });
              qc.invalidateQueries({ queryKey: ['tenants'] });
              qc.invalidateQueries({ queryKey: ['branches'] });
              qc.invalidateQueries({ queryKey: ['sa-shops'] });
              useBranchStore.getState().fetchBranches();
              break;

            default:
              qc.invalidateQueries({ queryKey: ['audit-logs'] });
              break;
          }
        } catch {
          // Ignore malformed events
        }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        // Only reconnect if still logged in — avoids reconnect loop on logout
        const { user: currentUser, token: currentTok } = useAuthStore.getState();
        if (currentUser && currentTok) {
          console.warn('[SSE] Connection lost — reconnecting in 5s...');
          setTimeout(connect, 5000);
        }
      };
    };

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
    // Re-run when user or token changes (login, logout, token refresh)
  }, [user, token, qc]);
}
