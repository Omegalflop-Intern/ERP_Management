import app from './app.js';
import { env } from './config/env.config.js';
import { connectDB } from './config/db.js';
import { initMailer, sendAdminNotificationEmail, sendCustomerInvoiceEmail, sendCustomerRepairEmail } from './config/mailer.js';
import { seedDefaultRoles } from './modules/role/role.service.js';
import { Settings } from './modules/settings/settings.model.js';
import { initAutoBackup } from './modules/settings/settings.service.js';
import emitter, { EVENTS } from './events/index.js';
import { printAsciiBanner, printServerInfo, logStep } from './utils/system/banner.js';
import { broadcastAll } from './modules/sse/sse.controller.js';
import { User } from './modules/user/user.model.js';
import { createBulkNotifications } from './modules/notification/notification.service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = env.PORT || 5000;

// ── Optional HTTPS (mkcert certs from client/certs/) ──
const certPath = path.resolve(__dirname, '../client/certs/cert.pem');
const keyPath  = path.resolve(__dirname, '../client/certs/key.pem');
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

const server = hasCerts && env.NODE_ENV === 'development'
  ? createHttpsServer({ cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }, app)
  : createHttpServer(app);

const protocol = hasCerts && env.NODE_ENV === 'development' ? 'https' : 'http';


server.listen(PORT, async () => {
  global.__serverStartTime = new Date();
  global.__serverProtocol = protocol;

  await printAsciiBanner();
  
  await logStep('Database Connection', connectDB);
  await logStep('SMTP Mail Service', initMailer);
  await logStep('Default System Roles', seedDefaultRoles);
  await logStep('ERP System Settings', () => Settings.seedDefaults());
  await logStep('Weekly Backup Scheduler', () => initAutoBackup());

  console.log('');
  printServerInfo(PORT, env.NODE_ENV || 'development', protocol);

  // ─── Real-time Event Listeners & Dual Notifications (Email + SMS) ─────

  emitter.on(EVENTS.STOCK_UPDATED, (data) => {
    console.log('\x1b[36m[EVENT:STOCK]\x1b[0m Stock updated for SKU/Product:', data);
    broadcastAll({ type: 'STOCK_UPDATED', data });
    
    // Admin Email & SMS Notification
    sendAdminNotificationEmail(
      `Stock Updated (${data?.name || data?.sku || 'Product'})`,
      'Product Stock Updated',
      `<p>Inventory stock quantity or catalog updated for product: <strong>${data?.name || 'Item'}</strong></p>`
    ).catch(err => console.error('[Admin Mail Error]:', err.message));

    sendAdminSMSNotification(`Stock updated for ${data?.name || data?.sku || 'Product'}`).catch(err => console.error('[Admin SMS Error]:', err.message));
  });

  emitter.on(EVENTS.SALE_COMPLETED, async (data) => {
    console.log('\x1b[32m[EVENT:SALE]\x1b[0m Transaction completed:', data);

    broadcastAll({ type: 'SALE_COMPLETED', data });

    const invoiceNo = data?.invoiceNo || data?.sale?.invoiceNo || 'Invoice';
    const amount = data?.grandTotal || data?.sale?.grandTotal || 0;
    const customerEmail = data?.customerEmail || data?.sale?.customer?.email || data?.customer?.email;
    const customerPhone = data?.customerPhone || data?.sale?.customer?.phone || data?.customer?.phone;
    const customerName = data?.customerName || data?.sale?.customer?.name || data?.customer?.name;

    // 1. Send Invoice Email & SMS to Customer
    if (customerEmail) {
      sendCustomerInvoiceEmail(customerEmail, customerName, data?.sale || data).catch(err => console.error('[Customer Mail Error]:', err.message));
    }
    if (customerPhone) {
      sendCustomerInvoiceSMS(customerPhone, customerName, invoiceNo, amount).catch(err => console.error('[Customer SMS Error]:', err.message));
    }

    // 2. Send Alert Email & SMS to Admin
    sendAdminNotificationEmail(
      `New Sale Recorded #${invoiceNo}`,
      `New Sale Completed (${invoiceNo})`,
      `<p>A new retail sale invoice <strong>#${invoiceNo}</strong> was processed for <strong>৳${Number(amount).toLocaleString()}</strong>.</p>
       <p>Customer: ${customerName || 'Walk-in Customer'} ${customerEmail ? `(${customerEmail})` : ''}</p>`
    ).catch(err => console.error('[Admin Mail Error]:', err.message));

    sendAdminSMSNotification(`New Sale #${invoiceNo} processed for ৳${Number(amount).toLocaleString()}`).catch(err => console.error('[Admin SMS Error]:', err.message));

    // Create DB notification for all active users
    try {
      const activeUsers = await User.find({ isDeleted: false, isActive: true }).select('_id').lean();
      if (activeUsers.length) {
        const userIds = activeUsers.map(u => u._id);
        await createBulkNotifications(userIds, {
          type: 'SALE_COMPLETED',
          title: `New Sale Recorded (${invoiceNo})`,
          message: `Sale invoice created for ৳${Number(amount).toLocaleString()}`,
          link: '/sales',
          meta: data,
        });
        broadcastAll({ type: 'NOTIFICATION', data: { invoiceNo, amount } });
      }
    } catch (err) {
      console.error('[Sale Notification Error]:', err?.message);
    }
  });

  emitter.on(EVENTS.USER_CREATED, (data) => {
    console.log('\x1b[34m[EVENT:USER]\x1b[0m User created:', data);
    sendAdminNotificationEmail(
      `New User Created (${data?.username || 'User'})`,
      'New User Account Created',
      `<p>A new system user account <strong>${data?.username}</strong> (${data?.roleName || 'Staff'}) was added to the ERP platform.</p>`
    ).catch(err => console.error('[Admin Mail Error]:', err.message));

    sendAdminSMSNotification(`New user created: ${data?.username || 'User'} (${data?.roleName || 'Staff'})`).catch(err => console.error('[Admin SMS Error]:', err.message));
  });

  emitter.on(EVENTS.LOW_STOCK_ALERT, (data) => {
    sendAdminNotificationEmail(
      `Low Stock Warning (${data?.name || 'Product'})`,
      'Low Stock Warning Alert',
      `<p>Product <strong>${data?.name}</strong> has reached low stock level (Remaining: ${data?.stockQuantity}). Please restock soon.</p>`
    ).catch(err => console.error('[Admin Mail Error]:', err.message));

    sendAdminSMSNotification(`Low stock warning for ${data?.name || 'Product'} (Remaining: ${data?.stockQuantity || 0})`).catch(err => console.error('[Admin SMS Error]:', err.message));
  });

  emitter.on(EVENTS.NOTIFICATION_NEW, (data) => {
    console.log('\x1b[35m[EVENT:NOTIF]\x1b[0m System notification triggered:', data);
    broadcastAll({ type: 'NOTIFICATION', data });
  });
});


