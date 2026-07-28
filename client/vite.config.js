import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load mkcert certificates if they exist (run: mkcert localhost 192.168.110.252)
const certPath = path.resolve(__dirname, 'certs/cert.pem');
const keyPath = path.resolve(__dirname, 'certs/key.pem');
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);


export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3000,
    host: true, // Listen on all interfaces (0.0.0.0) — allows LAN access
    // HTTPS with mkcert certs (run mkcert setup first — see README)
    ...(hasCerts && {
      https: {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
      },
    }),
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui': ['lucide-react', 'sonner'],
          'vendor-recharts': ['recharts'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          'vendor-utils': ['axios', 'date-fns', 'xlsx'],
        },
      },
    },
  },
});

