import cron from 'node-cron';
import { db } from '../config/db.knex.js';

export const startSubscriptionChecker = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();

      const expiredShops = await db('tenants')
        .where({ status: 'ACTIVE', is_deleted: false })
        .where('expires_at', '<', now);

      for (const shop of expiredShops) {
        await db('tenants').where({ id: shop.id }).update({
          status: 'PAUSED',
          paused_reason: 'SUBSCRIPTION_EXPIRED',
          paused_at: now,
        });

        await db('users').where({ tenant_id: shop.id }).update({ is_active: false });
      }

      const warningDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await db('tenants')
        .where({ status: 'ACTIVE', is_deleted: false })
        .whereBetween('expires_at', [now, warningDate])
        .update({ last_warning_sent: now });
    } catch (err) {
      console.error('[CRON] Subscription check failed:', err.message);
    }
  });
};

export const startTempAdminCleanup = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const expired = await db('temp_admins')
        .where({ status: 'ACTIVE' })
        .where('expires_at', '<', now);

      for (const ta of expired) {
        if (ta.user_id) {
          await db('users').where({ id: ta.user_id }).update({ is_active: false });
        }
        await db('temp_admins').where({ id: ta.id }).update({ status: 'EXPIRED' });
      }
    } catch (err) {
      console.error('[CRON] Temp admin cleanup failed:', err.message);
    }
  });
};
