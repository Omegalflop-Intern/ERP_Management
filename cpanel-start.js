// ===========================================
// cPanel Production Start Script
// ===========================================
// This script is used when running on cPanel shared hosting
// It handles the Node.js application startup

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: join(__dirname, '.env') });

// Set production environment
process.env.NODE_ENV = 'production';

// Import and start the app
import app from './app.js';

const PORT = process.env.PORT || 3000;

// For cPanel, we need to listen on the assigned port
// cPanel typically assigns a port via the PORT environment variable
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in production mode on port ${PORT}`);
  console.log(`📡 API available at: http://localhost:${PORT}/api/v1`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
