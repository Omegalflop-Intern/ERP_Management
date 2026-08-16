import app from './app.js';
import { env } from './config/env.config.js';
import { checkDbConnection } from './config/db.knex.js';
import { initMailer, sendAdminNotificationEmail, sendCustomerInvoiceEmail, sendCustomerRepairEmail } from './config/mailer.js';
import { seedDefaultRoles } from './modules/role/role.service.js';
import { initAutoBackup } from './modules/settings/settings.service.js';
import emitter, { EVENTS } from './events/index.js';
import { printAsciiBanner, printServerInfo, logStep } from './utils/system/banner.js';
import { broadcastAll, broadcastToTenant } from './modules/sse/sse.controller.js';
import { db } from './config/db.knex.js';
import { createBulkNotifications } from './modules/notification/notification.service.js';
import { createAutomatedSaleJournal, createAutomatedExpenseJournal } from './modules/accounting/accounting.service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { execSync } from 'child_process';
import { ensureSSLCerts } from './utils/system/ssl.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = env.PORT || 5000;

// Helper to kill any process currently occupying the desired port
const killPortProcess = (port) => {
  const numericPort = Number(port);
  if (isNaN(numericPort) || numericPort <= 0) return;
  try {
    if (process.platform === 'linux' || process.platform === 'darwin') {
      execSync(`fuser -k -n tcp ${numericPort} 2>/dev/null || fuser -k ${numericPort}/tcp 2>/dev/null || kill -9 $(lsof -t -i:${numericPort}) 2>/dev/null || true`);
      console.log(`[SERVER] 🧹 Auto-cleared lingering process on port ${numericPort}`);
    }
  } catch {
    // Ignore permissions or process absence
  }
};

// Auto-generate self-signed TLS certs in development if missing
if (env.NODE_ENV === 'development') {
  ensureSSLCerts({
    certDir: path.resolve(__dirname, 'certs'),
    host: 'localhost',
    validDays: 365,
  });
}

// TLS certs: check env vars first, fallback to server/certs/ directory
const certPath = env.TLS_CERT_PATH || path.resolve(__dirname, 'certs/cert.pem');
const keyPath = env.TLS_KEY_PATH || path.resolve(__dirname, 'certs/key.pem');

// In production or cPanel, SSL termination is handled by Apache/Nginx.
// Node.js HTTPS server is only created in development mode if certs exist.
const useHttps = env.NODE_ENV === 'development' && fs.existsSync(certPath) && fs.existsSync(keyPath);

const server = useHttps
  ? createHttpsServer({ cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }, app)
  : createHttpServer(app);

const protocol = useHttps ? 'https' : 'http';

// Phusion Passenger (cPanel) & local port fallback support
const targetPort = process.env.PORT || env.PORT || 5000;

const startServer = (target) => {
  server.removeAllListeners('error');
  
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[SERVER] ⚠️ Target port/socket ${target} is currently in use. Attempting to kill existing process...`);
      killPortProcess(target);
      
      setTimeout(() => {
        server.removeAllListeners('error');
        server.on('error', () => {
          console.warn(`[SERVER] ⚠️ Could not free port ${target}. Binding to available OS port (port 0)...`);
          startServer(0);
        });
        server.listen(target);
      }, 300);
    } else {
      console.error('[SERVER] ❌ Fatal server error:', err.message);
    }
  });

  server.listen(target, async () => {
    const boundAddress = server.address();
    const actualPort = typeof boundAddress === 'object' && boundAddress !== null ? boundAddress.port : target;
    global.__serverStartTime = new Date();
    global.__serverProtocol = protocol;

    printAsciiBanner();

    await logStep('MySQL/MariaDB Database', checkDbConnection);
    await logStep('SMTP Mailer Service', initMailer);
    await logStep('System Roles & Subscription Plans', seedDefaultRoles);
    await logStep('Automated Backup Scheduler', () => initAutoBackup());

    const { startSubscriptionChecker, startTempAdminCleanup } = await import('./jobs/subscriptionChecker.js');
    startSubscriptionChecker();
    startTempAdminCleanup();

    console.log('');
    printServerInfo(actualPort, env.NODE_ENV || 'development', protocol);
  });
};

startServer(targetPort);

const gracefulShutdown = (signal) => {
  console.log(`\n[SERVER] ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('[SERVER] HTTP server closed.');
    db.destroy().then(() => {
      console.log('[SERVER] Database connections closed.');
      process.exit(0);
    }).catch(() => process.exit(1));
  });
  setTimeout(() => {
    console.error('[SERVER] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  emitter.on(EVENTS.STOCK_UPDATED, (data) => {
    console.log('\x1b[36m[EVENT:STOCK]\x1b[0m Stock updated:', data?.name || data?.sku);
    broadcastToTenant(data?.tenantId || null, { type: 'STOCK_UPDATED', data });

    sendAdminNotificationEmail(
      `Stock Updated (${data?.name || data?.sku || 'Product'})`,
      'Product Stock Updated',
      `<p>Inventory updated for product: <strong>${data?.name || 'Item'}</strong></p>`
    ).catch((err) => console.error('[Admin Mail Error]:', err.message));
  });

  emitter.on(EVENTS.SALE_COMPLETED, async (data) => {
    console.log('\x1b[32m[EVENT:SALE]\x1b[0m Sale completed:', data?.invoiceNo || data?.sale?.invoiceNo);

    const eventTenantId = data?.tenantId || data?.sale?.tenantId || null;
    broadcastToTenant(eventTenantId, { type: 'SALE_COMPLETED', data });
    broadcastAll({ type: 'SALE_COMPLETED', data });

    // Automatically record double-entry journal entry for the completed sale
    createAutomatedSaleJournal(data?.sale || data).catch((err) =>
      console.error('[Accounting Auto-Journal Sale Error]:', err.message)
    );

    const invoiceNo = data?.invoiceNo || data?.sale?.invoiceNo || data?.invoiceNumber || 'Invoice';
    const amount = data?.grandTotal || data?.sale?.grandTotal || 0;
    const customerEmail = data?.customerEmail || data?.sale?.customer?.email || data?.customer?.email;
    const customerName = data?.customerName || data?.sale?.customer?.name || data?.customer?.name;

    if (customerEmail) {
      sendCustomerInvoiceEmail(customerEmail, customerName, data?.sale || data).catch((err) =>
        console.error('[Customer Mail Error]:', err.message)
      );
    }

    sendAdminNotificationEmail(
      `New Sale Recorded #${invoiceNo}`,
      `New Sale Completed (${invoiceNo})`,
      `<p>Sale invoice <strong>#${invoiceNo}</strong> processed for <strong>৳${Number(amount).toLocaleString()}</strong>.</p>
       <p>Customer: ${customerName || 'Walk-in Customer'} ${customerEmail ? `(${customerEmail})` : ''}</p>`
    ).catch((err) => console.error('[Admin Mail Error]:', err.message));

    try {
      let query = db('users').where({ is_deleted: false, is_active: true });
      if (eventTenantId) {
        query = query.where('tenant_id', eventTenantId);
      }
      const activeUsers = await query.select('id', 'tenant_id');
      if (activeUsers.length) {
        await createBulkNotifications(activeUsers.map((u) => ({ userId: u.id, tenantId: u.tenant_id })), {
          type: 'SALE_COMPLETED',
          title: `New Sale Recorded (${invoiceNo})`,
          message: `Sale invoice created for ৳${Number(amount).toLocaleString()}`,
          link: '/sales',
          meta: data,
        });
        broadcastToTenant(eventTenantId, { type: 'NOTIFICATION', data: { invoiceNo, amount } });
      }
    } catch (err) {
      console.error('[Sale Notification Error]:', err?.message);
    }
  });

  emitter.on(EVENTS.USER_CREATED, (data) => {
    console.log('\x1b[34m[EVENT:USER]\x1b[0m User created:', data?.username);
    broadcastToTenant(data?.tenantId || null, { type: 'USER_MUTATED', data });
    broadcastAll({ type: 'USER_MUTATED', data });
    sendAdminNotificationEmail(
      `New User Created (${data?.username || 'User'})`,
      'New User Account Created',
      `<p>New system user <strong>${data?.username}</strong> (${data?.roleName || 'Staff'}) was added.</p>`
    ).catch((err) => console.error('[Admin Mail Error]:', err.message));
  });

  emitter.on(EVENTS.USER_MUTATED, (data) => {
    console.log('\x1b[34m[EVENT:USER]\x1b[0m User mutated:', data?.username || data?.id);
    broadcastToTenant(data?.tenantId || null, { type: 'USER_MUTATED', data });
    broadcastAll({ type: 'USER_MUTATED', data });
  });

  emitter.on(EVENTS.LOW_STOCK_ALERT, (data) => {
    sendAdminNotificationEmail(
      `Low Stock Warning (${data?.name || 'Product'})`,
      'Low Stock Warning Alert',
      `<p>Product <strong>${data?.name}</strong> has reached low stock (Remaining: ${data?.stockQuantity}). Please restock.</p>`
    ).catch((err) => console.error('[Admin Mail Error]:', err.message));
  });

  emitter.on(EVENTS.NOTIFICATION_NEW, (data) => {
    console.log('\x1b[35m[EVENT:NOTIF]\x1b[0m Notification triggered:', data?.title);
    broadcastToTenant(data?.tenantId || null, { type: 'NOTIFICATION', data });
  });

  emitter.on(EVENTS.TENANT_UPDATED, (data) => {
    console.log('\x1b[33m[EVENT:TENANT]\x1b[0m Tenant updated:', data?.id || data?.shopName);
    broadcastToTenant(data?.id || null, { type: 'TENANT_UPDATED', data });
    broadcastAll({ type: 'TENANT_UPDATED', data });
  });

  emitter.on(EVENTS.PURCHASE_RECEIVED, (data) => {
    console.log('\x1b[36m[EVENT:PURCHASE]\x1b[0m Purchase completed:', data?.poNumber || data?.id);
    broadcastToTenant(data?.tenantId || null, { type: 'PURCHASE_COMPLETED', data });
  });

  emitter.on(EVENTS.PRODUCT_MUTATED, (data) => {
    broadcastToTenant(data?.tenantId || null, { type: 'PRODUCT_MUTATED', data });
  });

  emitter.on(EVENTS.EXPENSE_MUTATED, (data) => {
    broadcastToTenant(data?.tenantId || null, { type: 'EXPENSE_MUTATED', data });
    if (data?.expense && !data?.expense?.isDeleted) {
      createAutomatedExpenseJournal(data.expense).catch((err) =>
        console.error('[Accounting Auto-Journal Expense Error]:', err.message)
      );
    }
  });

  emitter.on(EVENTS.ACCOUNT_MUTATED, (data) => {
    broadcastToTenant(data?.tenantId || null, { type: 'ACCOUNT_MUTATED', data });
  });

  emitter.on(EVENTS.CUSTOMER_MUTATED, (data) => {
    broadcastToTenant(data?.tenantId || null, { type: 'CUSTOMER_MUTATED', data });
  });

  emitter.on(EVENTS.REPAIR_MUTATED, (data) => {
    broadcastToTenant(data?.tenantId || null, { type: 'REPAIR_MUTATED', data });
  });

  emitter.on(EVENTS.WARRANTY_MUTATED, (data) => {
    broadcastToTenant(data?.tenantId || null, { type: 'WARRANTY_MUTATED', data });
  });

export default app;
