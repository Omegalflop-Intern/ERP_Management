import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import App from './App.jsx';
import api from './lib/api';
import { setupOfflineSync } from './utils/offlineSync.js';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000, // 30s — data fresh window
      gcTime: 5 * 60_000, // 5min — garbage collect unused cache
      retry: 1, // retry once on failure
      retryDelay: 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Setup offline sync
setupOfflineSync(api);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <App />
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </ThemeProvider>
        {/* TanStack Query Devtools — only shown in development */}
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
