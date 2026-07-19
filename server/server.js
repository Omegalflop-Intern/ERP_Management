import app from './app.js';
import { env } from './config/env.config.js';
import { connectDB } from './config/db.js';
import { initMailer } from './config/mailer.js';
import { seedDefaultRoles } from './modules/role/role.service.js';
import { Settings } from './modules/settings/settings.model.js';
import { initAutoBackup } from './modules/settings/settings.service.js';
import emitter, { EVENTS } from './events/index.js';
import { printAsciiBanner, printServerInfo, logStep } from './utils/system/banner.js';
import { broadcastAll } from './modules/sse/sse.controller.js';

import { User } from './modules/user/user.model.js';
import { createBulkNotifications } from './modules/notification/notification.service.js';

const PORT = env.PORT || 5000;

app.listen(PORT, async () => {
  global.__serverStartTime = new Date();

  await printAsciiBanner();
  
  await logStep('Database Connection', connectDB);
  await logStep('SMTP Mail Service', initMailer);
  await logStep('Default System Roles', seedDefaultRoles);
  await logStep('ERP System Settings', () => Settings.seedDefaults());
  await logStep('Weekly Backup Scheduler', () => initAutoBackup());

  console.log('');
  printServerInfo(PORT, env.NODE_ENV || 'development');

  // ─── Real-time Event Listeners ───────────────────────────────────────

  emitter.on(EVENTS.STOCK_UPDATED, (data) => {
    console.log('\x1b[36m[EVENT:STOCK]\x1b[0m Stock updated for SKU/Product:', data);
    // Push to all connected SSE clients
    broadcastAll({ type: 'STOCK_UPDATED', data });
  });

  emitter.on(EVENTS.SALE_COMPLETED, async (data) => {
    console.log('\x1b[32m[EVENT:SALE]\x1b[0m Transaction completed:', data);

    // Push to all connected SSE clients immediately
    broadcastAll({ type: 'SALE_COMPLETED', data });

    // Create DB notification for all active users
    try {
      const activeUsers = await User.find({ isDeleted: false, isActive: true }).select('_id').lean();
      if (activeUsers.length) {
        const userIds = activeUsers.map(u => u._id);
        const invoiceNo = data?.invoiceNo || data?.sale?.invoiceNo || 'Invoice';
        const amount = data?.grandTotal || data?.sale?.grandTotal || 0;
        await createBulkNotifications(userIds, {
          type: 'SALE_COMPLETED',
          title: `New Sale Recorded (${invoiceNo})`,
          message: `Sale invoice created for ৳${Number(amount).toLocaleString()}`,
          link: '/sales',
          meta: data,
        });
        // Push notification event so clients refetch notification list
        broadcastAll({ type: 'NOTIFICATION', data: { invoiceNo, amount } });
      }
    } catch (err) {
      console.error('[Sale Notification Error]:', err?.message);
    }
  });

  emitter.on(EVENTS.NOTIFICATION_NEW, (data) => {
    console.log('\x1b[35m[EVENT:NOTIF]\x1b[0m System notification triggered:', data);
    broadcastAll({ type: 'NOTIFICATION', data });
  });
});

