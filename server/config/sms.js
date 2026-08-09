import axios from 'axios';
import { db } from './db.knex.js';

const SMS_API_URL = process.env.SMS_API_URL || '';
const SMS_API_KEY = process.env.SMS_API_KEY || '';
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || '';
const APP_NAME = process.env.APP_NAME || 'OmniManage';

/**
 * Low-level SMS Sender function
 */
export const sendSMS = async (toPhone, textMessage) => {
  if (!toPhone) return { success: false, reason: 'No phone number provided' };

  // Normalize phone number (e.g. remove spaces, dashes)
  const phone = String(toPhone).trim().replace(/[\s-]/g, '');

  if (SMS_API_URL && SMS_API_KEY) {
    try {
      const payload = {
        api_key: SMS_API_KEY,
        to: phone,
        msg: textMessage,
      };
      if (SMS_SENDER_ID) {
        payload.sender_id = SMS_SENDER_ID;
      }

      const res = await axios.post(SMS_API_URL, payload, { timeout: 8000 });
      console.log(`[SMS Sent] to: ${phone} | Status:`, res.status);
      return { success: true, data: res.data };
    } catch (err) {
      console.error(`[SMS Error] to: ${phone} |`, err.message);
      return { success: false, reason: err.message };
    }
  }

  // Fallback: console log in development / test mode
  console.log(`\n=================== [DEV SMS MOCK] ===================`);
  console.log(`TO: ${phone}`);
  console.log(`MESSAGE:\n${textMessage}`);
  console.log(`======================================================\n`);
  return { success: true, mock: true };
};

/**
 * Helper: Send SMS alert to all System Admins
 */
export const sendAdminSMSNotification = async (messageText) => {
  let adminPhones = [];
  try {
    const adminUsers = await db('users').where({ is_deleted: false, is_active: true }).select('phone');
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
export const sendCustomerInvoiceSMS = async (toPhone, customerName, invoiceNo, grandTotal, publicToken) => {
  if (!toPhone) return;
  const name = customerName || 'Valued Customer';
  const total = grandTotal ? `৳${Number(grandTotal).toLocaleString()}` : '';
  const baseUrl = process.env.CLIENT_URL || process.env.APP_URL || '';
  let receiptLink = '';
  if (baseUrl && publicToken) {
    receiptLink = ` Invoice: ${baseUrl}/invoice/${publicToken}`;
  } else if (baseUrl) {
    receiptLink = ` Receipt: ${baseUrl}/sales`;
  }
  const msg = `Dear ${name}, thank you for shopping at ${APP_NAME}! Your invoice #${invoiceNo} (${total}) is processed.${receiptLink}`;
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
