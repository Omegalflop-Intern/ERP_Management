import cron from 'node-cron';
import { Tenant } from '../modules/tenant/tenant.model.js';
import { TempAdmin } from '../modules/tenant/tempAdmin.model.js';
import { User } from '../modules/user/user.model.js';

export const startSubscriptionChecker = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();

      const expiredShops = await Tenant.find({
        status: 'ACTIVE',
        expiresAt: { $lt: now },
        isDeleted: false,
      });

      for (const shop of expiredShops) {
        shop.status = 'PAUSED';
        shop.pausedReason = 'SUBSCRIPTION_EXPIRED';
        shop.pausedAt = now;
        await shop.save();

        await User.updateMany(
          { tenantId: shop._id, isActive: true },
          { isActive: false }
        );
      }

      const warningDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      await Tenant.updateMany(
        {
          status: 'ACTIVE',
          expiresAt: { $gte: now, $lte: warningDate },
          isDeleted: false,
          lastWarningSent: { $lt: oneDayAgo },
        },
        { lastWarningSent: now }
      );
    } catch (err) {
      console.error('[CRON] Subscription check failed:', err.message);
    }
  });
};

export const startTempAdminCleanup = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const expired = await TempAdmin.find({
        status: 'ACTIVE',
        expiresAt: { $lt: new Date() },
      });

      for (const ta of expired) {
        await User.findByIdAndUpdate(ta.userId, { isActive: false });
        ta.status = 'EXPIRED';
        await ta.save();
      }
    } catch (err) {
      console.error('[CRON] Temp admin cleanup failed:', err.message);
    }
  });
};
