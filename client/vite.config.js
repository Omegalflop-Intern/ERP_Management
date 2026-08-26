import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Client HTTPS certs (browser ↔ Vite dev server)
const clientCertPath = path.resolve(__dirname, 'certs/cert.pem');
const clientKeyPath = path.resolve(__dirname, 'certs/key.pem');
const hasClientCerts = fs.existsSync(clientCertPath) && fs.existsSync(clientKeyPath);

// Server HTTPS certs (Vite proxy ↔ Express server)
const serverCertPath = path.resolve(__dirname, '../server/certs/cert.pem');
const serverKeyPath = path.resolve(__dirname, '../server/certs/key.pem');
const hasServerCerts = fs.existsSync(serverCertPath) && fs.existsSync(serverKeyPath);

// Server protocol: HTTPS if server has certs, otherwise HTTP
const serverProtocol = hasServerCerts ? 'https' : 'http';

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
    host: true,
    headers: {
      'Permissions-Policy': 'unload=*',
    },
    // HTTPS on the Vite dev server (browser ↔ Vite)
    ...(hasClientCerts && {
      https: {
        cert: fs.readFileSync(clientCertPath),
        key: fs.readFileSync(clientKeyPath),
      },
    }),
    proxy: {
      '/api': {
        target: `${serverProtocol}://localhost:5000`,
        changeOrigin: true,
        secure: false, // Allow self-signed certificates
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (res.headersSent) return;
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Backend server unavailable' }));
          });
        },
      },
      '/uploads': {
        target: `${serverProtocol}://localhost:5000`,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (res.headersSent) return;
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found or backend server unavailable');
          });
        },
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

