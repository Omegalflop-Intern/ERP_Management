import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import api from './lib/api';
import { initDevToolsProtection } from './utils/disableDevTools.js';
import { setupOfflineSync } from './utils/offlineSync.js';
import './index.css';

initDevToolsProtection();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      retryDelay: 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});

setupOfflineSync(api);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <App />
            <Toaster position="top-center" duration={1000} closeButton richColors expand={false} />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
