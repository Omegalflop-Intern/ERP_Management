import axios from 'axios';
import { User } from '../modules/user/user.model.js';

const SMS_API_URL = process.env.SMS_API_URL || '';
const SMS_API_KEY = process.env.SMS_API_KEY || '';
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'BrothersMob';
const APP_NAME = process.env.APP_NAME || 'Brothers Mobile';

/**
 * Low-level SMS Sender function
 */
export const sendSMS = async (toPhone, textMessage) => {
  if (!toPhone) return { success: false, reason: 'No phone number provided' };

  // Normalize phone number (e.g. remove spaces, dashes)
  const phone = String(toPhone).trim().replace(/[\s-]/g, '');

  if (SMS_API_URL && SMS_API_KEY) {
    try {
      const response = await axios.post(SMS_API_URL, {
        api_key: SMS_API_KEY,
        sender_id: SMS_SENDER_ID,
        to: phone,
        message: textMessage,
      }, { timeout: 8000 });

      console.log(`[SMS Gateway] SMS successfully sent to ${phone}. Provider Response:`, response.data);
      return { success: true, data: response.data };
    } catch (err) {
      console.error(`[SMS Gateway Error] Failed to send SMS to ${phone}:`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    // Development / Fallback Mock Mode
    console.log(`\x1b[33m[SMS Mock Gateway]\x1b[0m To: \x1b[1m${phone}\x1b[0m | Message: "${textMessage}"`);
    return { success: true, mock: true };
  }
};

/**
 * Send SMS Alert to all Active System Administrators
 */
export const sendAdminSMSNotification = async (messageText) => {
  let adminPhones = [];
  try {
    const adminUsers = await User.find({
      isDeleted: false,
      isActive: true,
      $or: [
        { roleName: { $regex: /^admin$/i } },
        { roleName: 'System Administrator' }
      ],
      phone: { $exists: true, $ne: '' }
    }).select('phone username').lean();

    if (adminUsers && adminUsers.length > 0) {
      adminPhones = adminUsers.map(u => u.phone).filter(Boolean);
    }
  } catch (err) {
    console.error('[Admin SMS Lookup Error]:', err.message);
  }

  if (process.env.ADMIN_PHONE && !adminPhones.includes(process.env.ADMIN_PHONE)) {
    adminPhones.push(process.env.ADMIN_PHONE);
  }

  const uniquePhones = [...new Set(adminPhones)].filter(Boolean);
  if (uniquePhones.length === 0) {
    console.log('[Admin SMS Gateway] No admin phone numbers configured in DB or env.');
    return { success: false, reason: 'No admin phone numbers found' };
  }

  const fullMsg = `[${APP_NAME} Alert] ${messageText}`;
  const results = [];

  for (const phone of uniquePhones) {
    const res = await sendSMS(phone, fullMsg);
    results.push({ phone, ...res });
  }

  return { success: true, results };
};

/**
 * Send Purchase Receipt SMS to Customer
 */
export const sendCustomerInvoiceSMS = async (toPhone, customerName, invoiceNo, grandTotal) => {
  if (!toPhone) return;
  const name = customerName || 'Valued Customer';
  const total = grandTotal ? `৳${Number(grandTotal).toLocaleString()}` : '';
  const msg = `Dear ${name}, thank you for shopping at ${APP_NAME}! Your invoice #${invoiceNo} (${total}) is processed. Receipt: http://localhost:3000/sales`;
  return sendSMS(toPhone, msg);
};

/**
 * Send Device Repair Status SMS to Customer
 */
export const sendCustomerRepairSMS = async (toPhone, customerName, jobNo, status, deviceModel) => {
  if (!toPhone) return;
  const name = customerName || 'Customer';
  const model = deviceModel ? ` (${deviceModel})` : '';
  const msg = `${APP_NAME} Service: Hello ${name}, your repair device${model} ticket #${jobNo} status is updated to: ${String(status).toUpperCase()}.`;
  return sendSMS(toPhone, msg);
};
