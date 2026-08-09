import app from './app.js';
import { env } from './config/env.config.js';
import { checkDbConnection } from './config/db.knex.js';
import { initMailer, sendAdminNotificationEmail, sendCustomerInvoiceEmail, sendCustomerRepairEmail } from './config/mailer.js';
import { sendAdminSMSNotification, sendCustomerInvoiceSMS } from './config/sms.js';
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

server.listen(PORT, async () => {
  global.__serverStartTime = new Date();
  global.__serverProtocol = protocol;

  printAsciiBanner();

  await logStep('MySQL/MariaDB Database', checkDbConnection);
  await logStep('SMTP Mailer & SMS Gateways', initMailer);
  await logStep('System Roles & Subscription Plans', seedDefaultRoles);
  await logStep('Automated Backup Scheduler', () => initAutoBackup());

  const { startSubscriptionChecker, startTempAdminCleanup } = await import('./jobs/subscriptionChecker.js');
  startSubscriptionChecker();
  startTempAdminCleanup();

  console.log('');
  printServerInfo(PORT, env.NODE_ENV || 'development', protocol);

  emitter.on(EVENTS.STOCK_UPDATED, (data) => {
    console.log('\x1b[36m[EVENT:STOCK]\x1b[0m Stock updated:', data?.name || data?.sku);
    broadcastToTenant(data?.tenantId || null, { type: 'STOCK_UPDATED', data });

    sendAdminNotificationEmail(
      `Stock Updated (${data?.name || data?.sku || 'Product'})`,
      'Product Stock Updated',
      `<p>Inventory updated for product: <strong>${data?.name || 'Item'}</strong></p>`
    ).catch((err) => console.error('[Admin Mail Error]:', err.message));

    sendAdminSMSNotification(`Stock updated for ${data?.name || data?.sku || 'Product'}`).catch((err) =>
      console.error('[Admin SMS Error]:', err.message)
    );
  });

  emitter.on(EVENTS.SALE_COMPLETED, async (data) => {
    console.log('\x1b[32m[EVENT:SALE]\x1b[0m Sale completed:', data?.invoiceNo || data?.sale?.invoiceNo);

    const eventTenantId = data?.tenantId || data?.sale?.tenantId || null;
    broadcastToTenant(eventTenantId, { type: 'SALE_COMPLETED', data });

    const invoiceNo = data?.invoiceNo || data?.sale?.invoiceNo || 'Invoice';
    const amount = data?.grandTotal || data?.sale?.grandTotal || 0;
    const customerEmail = data?.customerEmail || data?.sale?.customer?.email || data?.customer?.email;
    const customerPhone = data?.customerPhone || data?.sale?.customer?.phone || data?.customer?.phone;
    const customerName = data?.customerName || data?.sale?.customer?.name || data?.customer?.name;

    if (customerEmail) {
      sendCustomerInvoiceEmail(customerEmail, customerName, data?.sale || data).catch((err) =>
        console.error('[Customer Mail Error]:', err.message)
      );
    }
    if (customerPhone) {
      sendCustomerInvoiceSMS(customerPhone, customerName, invoiceNo, amount).catch((err) =>
        console.error('[Customer SMS Error]:', err.message)
      );
    }

    sendAdminNotificationEmail(
      `New Sale Recorded #${invoiceNo}`,
      `New Sale Completed (${invoiceNo})`,
      `<p>Sale invoice <strong>#${invoiceNo}</strong> processed for <strong>৳${Number(amount).toLocaleString()}</strong>.</p>
       <p>Customer: ${customerName || 'Walk-in Customer'} ${customerEmail ? `(${customerEmail})` : ''}</p>`
    ).catch((err) => console.error('[Admin Mail Error]:', err.message));

    sendAdminSMSNotification(`New Sale #${invoiceNo} processed for ৳${Number(amount).toLocaleString()}`).catch((err) =>
      console.error('[Admin SMS Error]:', err.message)
    );

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
    sendAdminNotificationEmail(
      `New User Created (${data?.username || 'User'})`,
      'New User Account Created',
      `<p>New system user <strong>${data?.username}</strong> (${data?.roleName || 'Staff'}) was added.</p>`
    ).catch((err) => console.error('[Admin Mail Error]:', err.message));

    sendAdminSMSNotification(`New user created: ${data?.username || 'User'} (${data?.roleName || 'Staff'})`).catch((err) =>
      console.error('[Admin SMS Error]:', err.message)
    );
  });

  emitter.on(EVENTS.LOW_STOCK_ALERT, (data) => {
    sendAdminNotificationEmail(
      `Low Stock Warning (${data?.name || 'Product'})`,
      'Low Stock Warning Alert',
      `<p>Product <strong>${data?.name}</strong> has reached low stock (Remaining: ${data?.stockQuantity}). Please restock.</p>`
    ).catch((err) => console.error('[Admin Mail Error]:', err.message));

    sendAdminSMSNotification(`Low stock: ${data?.name || 'Product'} (Remaining: ${data?.stockQuantity || 0})`).catch((err) =>
      console.error('[Admin SMS Error]:', err.message)
    );
  });

  emitter.on(EVENTS.NOTIFICATION_NEW, (data) => {
    console.log('\x1b[35m[EVENT:NOTIF]\x1b[0m Notification triggered:', data?.title);
    broadcastToTenant(data?.tenantId || null, { type: 'NOTIFICATION', data });
  });
});
