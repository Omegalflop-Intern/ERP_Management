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
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { ensureSSLCerts } from './utils/system/ssl.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = env.PORT || 5000;

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
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

const server = hasCerts
  ? createHttpsServer({ cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }, app)
  : createHttpServer(app);

const protocol = hasCerts ? 'https' : 'http';

// Phusion Passenger (cPanel) support: process.env.PORT can be a socket path (e.g. /tmp/passenger.xxx/socket)
const listenTarget = process.env.PORT || env.PORT || 5000;

const startServer = (target) => {
  server.removeAllListeners('error');
  
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && typeof target === 'number') {
      console.warn(`[SERVER] ⚠️ Port ${target} is in use. Trying port ${target + 1}...`);
      setTimeout(() => startServer(target + 1), 200);
    } else {
      console.error('[SERVER] ❌ Fatal server error:', err.message);
    }
  });

  server.listen(target, async () => {
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
    printServerInfo(target, env.NODE_ENV || 'development', protocol);
  });
};

startServer(listenTarget);

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

    broadcastToTenant(eventTenantId, { type: 'SALE_COMPLETED', data });
    broadcastAll({ type: 'SALE_COMPLETED', data });

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
