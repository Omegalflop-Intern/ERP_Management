import { Customer } from '../customer/customer.model.js';
import { InventoryUnit } from '../imei/imei.model.js';
import { sendEmail } from '../../config/mailer.js';

export const sendMarketingCampaign = async ({ campaignTitle, channel = 'SMS', targetAudience = 'ALL', messageTemplate }) => {
  const query = { isDeleted: false };
  if (targetAudience === 'VIP') {
    query.totalPurchases = { $gte: 100000 };
  }

  const customers = await Customer.find(query);
  let sentCount = 0;
  let failedCount = 0;

  for (const customer of customers) {
    try {
      const personalizedMessage = messageTemplate
        .replace('{name}', customer.name || 'Valued Customer')
        .replace('{phone}', customer.phone || '');

      if (channel === 'EMAIL' && customer.email) {
        await sendEmail(customer.email, campaignTitle, personalizedMessage);
        sentCount++;
      } else {
        // SMS Gateway Integration Logger Hook
        console.log(`[MARKETING-${channel}] Target: ${customer.phone} | Msg: ${personalizedMessage}`);
        sentCount++;
      }
    } catch (err) {
      failedCount++;
    }
  }

  return {
    campaignTitle,
    channel,
    targetAudience,
    totalTargets: customers.length,
    sentCount,
    failedCount,
  };
};
