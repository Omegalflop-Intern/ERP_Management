import nodemailer from 'nodemailer';
import { db } from '../config/db.knex.js';

let transporter;

export const initMailer = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[Nodemailer] Dev test mailer ready. User: ${testAccount.user}`);
  }
};

const SENDER_NAME = process.env.SMTP_SENDER_NAME || 'OmniManage';
const SENDER_EMAIL = process.env.SMTP_SENDER_EMAIL || process.env.SMTP_USER || 'no-reply@respawnalley.com';
const APP_NAME = process.env.APP_NAME || 'OmniManage';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || SENDER_EMAIL;
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || '';

const baseHeaders = {
  'X-Mailer': 'OmniManage-Mailer/1.0',
  'X-Priority': '3',
  'Precedence': 'bulk',
  'List-Unsubscribe': `<mailto:${SENDER_EMAIL}?subject=unsubscribe>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  'Feedback-ID': `erp:${APP_NAME.replace(/\s/g, '')}`,
};

const addressBlock = COMPANY_ADDRESS
  ? `<p style="margin:8px 0 0;color:#999;font-size:11px;">${COMPANY_ADDRESS}</p>`
  : '';

export const sendOTPEmail = async (toEmail, otpCode, userName = '') => {
  if (!transporter) await initMailer();
  const displayName = userName || 'User';

  const mailOptions = {
    from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
    to: toEmail,
    replyTo: SUPPORT_EMAIL,
    subject: `Your Verification Code - ${SENDER_NAME}`,
    headers: baseHeaders,
    text: `Hello ${displayName},\n\nYour verification code is: ${otpCode}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.\n\nThank you,\n${SENDER_NAME}\n${COMPANY_ADDRESS || ''}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',system-ui,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
          <tr><td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:28px 32px;text-align:center;">
                  <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${SENDER_NAME}</div>
                  <div style="font-size:12px;color:#94a3b8;margin-top:2px;">Account Security & Verification</div>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <p style="margin:0 0 14px;color:#0f172a;font-size:15px;">Hello <strong>${displayName}</strong>,</p>
                  <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
                    Please use the one-time verification code below to verify your account:
                  </p>
                  <div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:10px;padding:20px;text-align:center;margin-bottom:24px;">
                    <div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Verification Code</div>
                    <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',system-ui,sans-serif;">
                      ${otpCode}
                    </div>
                  </div>
                  <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:4px;color:#1e40af;font-size:12px;line-height:1.5;">
                    ⏱ This code will expire in <strong>10 minutes</strong>. If you did not request this code, please ignore this email.
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
                  <div style="font-size:11px;color:#94a3b8;">
                    © ${new Date().getFullYear()} ${SENDER_NAME}. All rights reserved.<br>
                    This is an automated security email.
                  </div>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[OTP Sent] Email sent to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (err) {
    console.error(`[OTP Mail Error]: ${err.message}`);
    return { success: false, error: err.message };
  }
};

export const sendPasswordResetEmail = async (toEmail, resetLink, userName = '') => {
  if (!transporter) await initMailer();
  const displayName = userName || 'User';

  const mailOptions = {
    from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
    to: toEmail,
    replyTo: SUPPORT_EMAIL,
    subject: `🔐 Password Reset Request - ${SENDER_NAME}`,
    headers: baseHeaders,
    text: `Hello ${displayName},\n\nYou requested a password reset. Click the link below:\n\n${resetLink}\n\nThis link expires in 1 hour.\n\nIf you did not request this, please ignore this email.\n\nThank you,\n${SENDER_NAME}\n${COMPANY_ADDRESS || ''}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',system-ui,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
          <tr><td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:28px 32px;text-align:center;">
                  <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${SENDER_NAME}</div>
                  <div style="font-size:12px;color:#94a3b8;margin-top:2px;">Password Reset Request</div>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <p style="margin:0 0 14px;color:#0f172a;font-size:15px;">Hello <strong>${displayName}</strong>,</p>
                  <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
                    We received a request to reset your password. Click the button below to set a new password:
                  </p>
                  <div style="text-align:center;margin-bottom:24px;">
                    <a href="${resetLink}" style="display:inline-block;padding:14px 36px;background:#0f172a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
                      Reset Password ↗
                    </a>
                  </div>
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
                    <div style="font-size:11px;color:#64748b;margin-bottom:4px;">Or copy and paste this link:</div>
                    <div style="font-size:11px;color:#0f172a;word-break:break-all;">${resetLink}</div>
                  </div>
                  <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;color:#b45309;font-size:12px;line-height:1.5;">
                    ⏱ This link will expire in <strong>1 hour</strong>. If you did not request a password reset, please ignore this message.
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
                  <div style="font-size:11px;color:#94a3b8;">
                    © ${new Date().getFullYear()} ${SENDER_NAME}. All rights reserved.<br>
                    This is an automated notification.
                  </div>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Password Reset] Email sent to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (err) {
    console.error(`[Password Reset Mail Error]: ${err.message}`);
    return { success: false, error: err.message };
  }
};

export const sendAdminNotificationEmail = async (subject, title, detailsHtml) => {
  if (!transporter) await initMailer();

  let adminEmails = [];
  try {
    const adminUsers = await User.find({
      isDeleted: false,
      isActive: true,
      $or: [
        { roleName: { $regex: /^admin$/i } },
        { roleName: 'System Administrator' }
      ]
    }).select('email').lean();

    if (adminUsers && adminUsers.length > 0) {
      adminEmails = adminUsers.map(u => u.email).filter(Boolean);
    }
  } catch (err) {
    console.error('[Admin Mailer Lookup Error]:', err.message);
  }

  if (process.env.ADMIN_EMAIL && !adminEmails.includes(process.env.ADMIN_EMAIL)) {
    adminEmails.push(process.env.ADMIN_EMAIL);
  }

  const recipientString = [...new Set(adminEmails)].filter(Boolean).join(', ');
  if (!recipientString) return { success: false, reason: 'No admin email found' };

  const mailOptions = {
    from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
    to: recipientString,
    replyTo: SUPPORT_EMAIL,
    subject: `[Admin Alert] ${subject}`,
    headers: { ...baseHeaders, 'X-Priority': '1' },
    text: `${title}\n\n${detailsHtml?.replace(/<[^>]*>/g, '') || ''}\n\n- ${SENDER_NAME} System`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0e0e0;">
              <tr>
                <td style="background:#1a1a2e;padding:20px 24px;">
                  <h2 style="margin:0;color:#ffffff;font-size:16px;font-weight:700;">${title}</h2>
                  <p style="margin:4px 0 0;color:#aaa;font-size:11px;">Admin Notification - ${APP_NAME}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;color:#333;font-size:14px;line-height:1.6;">
                  ${detailsHtml}
                </td>
              </tr>
              <tr>
                <td style="background:#f8f8f8;border-top:1px solid #e0e0e0;padding:12px;text-align:center;color:#999;font-size:10px;">
                  &copy; ${new Date().getFullYear()} ${APP_NAME}. System Event Notification
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Admin Mailer] Alert sent to ${recipientString}: ${subject}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Admin Mailer Error]: ${err.message}`);
    return { success: false, error: err.message };
  }
};

export const sendTicketCreatedAdminEmail = async (ticketData) => {
  if (!transporter) await initMailer();

  let adminEmails = [];
  try {
    const adminUsers = await db('users')
      .where({ is_deleted: false, is_active: true })
      .whereNull('tenant_id')
      .select('email');

    if (adminUsers && adminUsers.length > 0) {
      adminEmails = adminUsers.map((u) => u.email).filter(Boolean);
    }
  } catch (err) {
    console.error('[Ticket Admin Mailer Lookup Error]:', err.message);
  }

  if (process.env.ADMIN_EMAIL && !adminEmails.includes(process.env.ADMIN_EMAIL)) {
    adminEmails.push(process.env.ADMIN_EMAIL);
  }

  const recipientString = [...new Set(adminEmails)].filter(Boolean).join(', ');
  if (!recipientString) return { success: false, reason: 'No admin email found' };

  const { ticketNumber, shopName, shopSubdomain, subject, category, priority, description, createdByName } = ticketData;

  const mailOptions = {
    from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
    to: recipientString,
    replyTo: SUPPORT_EMAIL,
    subject: `[Support Ticket] New Ticket #${ticketNumber} from ${shopName || 'Shop'}`,
    headers: { ...baseHeaders, 'X-Priority': priority === 'URGENT' ? '1' : '3' },
    text: `New Support Ticket Submitted\n\nTicket #: ${ticketNumber}\nShop: ${shopName} (${shopSubdomain || 'N/A'})\nCategory: ${category}\nPriority: ${priority}\nSubject: ${subject}\n\nDescription:\n${description}\n\nSubmitted By: ${createdByName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
              <tr>
                <td style="background:#1a1a2e;padding:24px 32px;">
                  <h2 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">Support Ticket Submitted</h2>
                  <p style="margin:6px 0 0;color:#3b82f6;font-size:13px;font-weight:600;">#${ticketNumber} &bull; ${priority} Priority</p>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 32px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-collapse:collapse;">
                    <tr style="background:#f8fafc;">
                      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-size:13px;color:#64748b;width:30%;">Shop Name:</td>
                      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;">${shopName || 'Unknown Shop'} (${shopSubdomain || 'main'})</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Category:</td>
                      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-size:13px;color:#0f172a;">${category}</td>
                    </tr>
                    <tr style="background:#f8fafc;">
                      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Subject:</td>
                      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;">${subject}</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Submitted By:</td>
                      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-size:13px;color:#0f172a;">${createdByName || 'Staff User'}</td>
                    </tr>
                  </table>
                  <div style="background:#f1f5f9;border-left:4px solid #2563eb;padding:16px;border-radius:4px;margin-bottom:20px;">
                    <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;">Ticket Description:</p>
                    <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.6;white-space:pre-wrap;">${description}</p>
                  </div>
                  <p style="margin:0;font-size:12px;color:#64748b;">Please log in to the Super Admin Panel to review and resolve this ticket.</p>
                </td>
              </tr>
              <tr>
                <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px;text-align:center;color:#94a3b8;font-size:11px;">
                  &copy; ${new Date().getFullYear()} ${APP_NAME}. System Automated Notification
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Ticket Mailer] Alert sent to ${recipientString} for ticket #${ticketNumber}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Ticket Mailer Error]: ${err.message}`);
    return { success: false, error: err.message };
  }
};


export const sendCustomerInvoiceEmail = async (toEmail, customerName, invoiceData) => {
  if (!toEmail) return;
  if (!transporter) await initMailer();

  const customer = customerName || 'Valued Customer';
  // Fix: was falling back to literal string 'Receipt' instead of showing no invoice number
  const invoiceNo = invoiceData.invoiceNo || invoiceData.invoiceNumber || `INV-${Date.now()}`;
  const netTotal = Number(invoiceData.grandTotal || invoiceData.netTotal || 0);
  const subTotal = Number(invoiceData.subTotal || netTotal);
  const discount = Number(invoiceData.discount || 0);
  const tax = Number(invoiceData.tax || 0);
  const fmt = (n) => `\u09F3${Number(n || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const paymentBreakdown = invoiceData.paymentBreakdown || {};
  const dueAmount = Number(paymentBreakdown.dueAmount || invoiceData.dueAmount || 0);
  const isPaid = dueAmount <= 0;
  const paymentStatus = isPaid ? 'Paid' : `Due: ${fmt(dueAmount)}`;
  const statusColor = isPaid ? '#059669' : '#dc2626';
  const statusBg = isPaid ? '#d1fae5' : '#fee2e2';

  const saleDate = invoiceData.createdAt
    ? new Date(invoiceData.createdAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Fetch tenant shop info from DB using tenantId
  let shopName = SENDER_NAME;
  let shopPhone = '';
  let shopAddress = COMPANY_ADDRESS;
  let shopEmail = SENDER_EMAIL;
  let shopLogo = '';
  try {
    if (invoiceData.tenantId) {
      const tenant = await db('tenants').where({ id: invoiceData.tenantId, is_deleted: false }).first();
      if (tenant) {
        shopName = tenant.shop_name || shopName;
        shopPhone = tenant.phone || '';
        shopEmail = tenant.email || shopEmail;
      }
      // Also check settings table for company address/logo
      const settingsRows = await db('settings')
        .where({ tenant_id: invoiceData.tenantId })
        .whereIn('key', ['companyAddress', 'companyLogo', 'companyPhone'])
        .select('key', 'value');
      for (const s of settingsRows) {
        try {
          const val = JSON.parse(s.value);
          if (s.key === 'companyAddress' && val) shopAddress = val;
          if (s.key === 'companyLogo' && val) shopLogo = val;
          if (s.key === 'companyPhone' && val) shopPhone = shopPhone || val;
        } catch { /* ignore */ }
      }
    }
  } catch { /* non-blocking — use defaults */ }

  // Line items table rows
  const lineItems = Array.isArray(invoiceData.lineItems) ? invoiceData.lineItems : [];
  const lineItemsHtml = lineItems.length > 0
    ? lineItems.map((item, i) => `
      <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding:10px 14px;font-size:13px;color:#1e293b;border-bottom:1px solid #e2e8f0;">
          ${item.description || item.name || 'Item'}
          ${item.imeiOrSerial ? `<br><span style="font-size:11px;color:#64748b;">IMEI/S/N: ${item.imeiOrSerial}</span>` : ''}
        </td>
        <td style="padding:10px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;text-align:center;">${Number(item.qty || 1)}</td>
        <td style="padding:10px 14px;font-size:13px;color:#475569;border-bottom:1px solid #e2e8f0;text-align:right;">${fmt(item.unitPrice)}</td>
        <td style="padding:10px 14px;font-size:13px;font-weight:700;color:#0f172a;border-bottom:1px solid #e2e8f0;text-align:right;">${fmt(item.totalPrice || (Number(item.unitPrice || 0) * Number(item.qty || 1)))}</td>
      </tr>`).join('')
    : `<tr><td colspan="4" style="padding:16px;text-align:center;color:#94a3b8;font-size:13px;">No items</td></tr>`;

  // Payment method pills
  const paymentMethods = [];
  if (Number(paymentBreakdown.cash || 0) > 0) paymentMethods.push(`Cash: ${fmt(paymentBreakdown.cash)}`);
  if (Number(paymentBreakdown.bkash || 0) > 0) paymentMethods.push(`bKash: ${fmt(paymentBreakdown.bkash)}`);
  if (Number(paymentBreakdown.nagad || 0) > 0) paymentMethods.push(`Nagad: ${fmt(paymentBreakdown.nagad)}`);
  if (Number(paymentBreakdown.rocket || 0) > 0) paymentMethods.push(`Rocket: ${fmt(paymentBreakdown.rocket)}`);
  if (Number(paymentBreakdown.bank || 0) > 0) paymentMethods.push(`Bank: ${fmt(paymentBreakdown.bank)}`);
  const paymentMethodsHtml = paymentMethods.length > 0
    ? paymentMethods.map(m => `<span style="display:inline-block;padding:3px 10px;background:#e0f2fe;color:#0369a1;border-radius:20px;font-size:11px;font-weight:600;margin:2px;">${m}</span>`).join(' ')
    : '<span style="color:#94a3b8;font-size:12px;">N/A</span>';

  const logoHtml = shopLogo
    ? `<img src="${shopLogo}" alt="${shopName}" style="height:36px;max-width:140px;object-fit:contain;margin-bottom:8px;display:block;margin:0 auto 8px;">`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Invoice ${invoiceNo} — ${shopName}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 36px;text-align:center;">
            ${logoHtml}
            <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${shopName}</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:4px;">
              ${shopPhone ? `📞 ${shopPhone}` : ''}
              ${shopPhone && shopAddress ? ' &nbsp;·&nbsp; ' : ''}
              ${shopAddress ? `📍 ${shopAddress}` : ''}
            </div>
            <div style="margin-top:20px;display:inline-block;">
              <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:10px 24px;display:inline-block;">
                <div style="font-size:11px;color:#94a3b8;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Sales Receipt</div>
                <div style="font-size:18px;font-weight:700;color:#ffffff;margin-top:2px;">${invoiceNo}</div>
              </div>
            </div>
          </td>
        </tr>

        <!-- STATUS BADGE + CUSTOMER INFO -->
        <tr>
          <td style="padding:24px 36px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:13px;color:#64748b;margin-bottom:2px;">Bill To</div>
                  <div style="font-size:16px;font-weight:700;color:#0f172a;">${customer}</div>
                  ${invoiceData.customerPhone ? `<div style="font-size:12px;color:#64748b;margin-top:2px;">📞 ${invoiceData.customerPhone}</div>` : ''}
                  ${invoiceData.customerAddress ? `<div style="font-size:12px;color:#64748b;">📍 ${invoiceData.customerAddress}</div>` : ''}
                </td>
                <td style="text-align:right;vertical-align:top;">
                  <span style="display:inline-block;padding:6px 14px;background:${statusBg};color:${statusColor};border-radius:20px;font-size:12px;font-weight:700;">${paymentStatus}</span>
                  <div style="font-size:11px;color:#94a3b8;margin-top:6px;">${saleDate}</div>
                  ${invoiceData.cashierUsername ? `<div style="font-size:11px;color:#94a3b8;">Cashier: ${invoiceData.cashierUsername}</div>` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- DIVIDER -->
        <tr><td style="padding:16px 36px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

        <!-- LINE ITEMS TABLE -->
        <tr>
          <td style="padding:20px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Item</th>
                  <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Qty</th>
                  <th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Unit Price</th>
                  <th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Total</th>
                </tr>
              </thead>
              <tbody>${lineItemsHtml}</tbody>
            </table>
          </td>
        </tr>

        <!-- TOTALS SECTION -->
        <tr>
          <td style="padding:0 36px 20px;">
            <table cellpadding="0" cellspacing="0" style="margin-left:auto;min-width:240px;">
              ${subTotal !== netTotal ? `
              <tr>
                <td style="padding:5px 14px 5px 0;font-size:13px;color:#64748b;">Subtotal</td>
                <td style="padding:5px 0;font-size:13px;color:#0f172a;text-align:right;">${fmt(subTotal)}</td>
              </tr>` : ''}
              ${discount > 0 ? `
              <tr>
                <td style="padding:5px 14px 5px 0;font-size:13px;color:#64748b;">Discount</td>
                <td style="padding:5px 0;font-size:13px;color:#dc2626;text-align:right;">- ${fmt(discount)}</td>
              </tr>` : ''}
              ${tax > 0 ? `
              <tr>
                <td style="padding:5px 14px 5px 0;font-size:13px;color:#64748b;">Tax</td>
                <td style="padding:5px 0;font-size:13px;color:#0f172a;text-align:right;">+ ${fmt(tax)}</td>
              </tr>` : ''}
              <tr>
                <td colspan="2" style="padding-top:8px;"><div style="border-top:2px solid #0f172a;"></div></td>
              </tr>
              <tr>
                <td style="padding:8px 14px 8px 0;font-size:15px;font-weight:800;color:#0f172a;">Grand Total</td>
                <td style="padding:8px 0;font-size:18px;font-weight:800;color:#0f172a;text-align:right;">${fmt(netTotal)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- PAYMENT METHODS -->
        <tr>
          <td style="padding:0 36px 24px;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;">
              <div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:8px;">Payment Method</div>
              <div>${paymentMethodsHtml}</div>
              ${dueAmount > 0 ? `<div style="margin-top:8px;font-size:12px;color:#dc2626;font-weight:600;">⚠ Due Balance: ${fmt(dueAmount)}</div>` : ''}
            </div>
          </td>
        </tr>

        <!-- VIEW INVOICE BUTTON -->
        ${invoiceData.invoiceLink ? `
        <tr>
          <td style="padding:0 36px 24px;text-align:center;">
            <a href="${invoiceData.invoiceLink}" style="display:inline-block;padding:12px 32px;background:#0f172a;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
              View Full Invoice Online ↗
            </a>
          </td>
        </tr>` : ''}

        <!-- FOOTER -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 36px;text-align:center;">
            <div style="font-size:13px;color:#0f172a;font-weight:600;margin-bottom:4px;">Thank you for shopping at ${shopName}! 🙏</div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">
              For support, reply to this email or contact us at ${shopEmail}
            </div>
            <div style="font-size:10px;color:#cbd5e1;">
              © ${new Date().getFullYear()} ${shopName}. All rights reserved.<br>
              This is an automated receipt. Please do not reply directly to this email.
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Dear ${customer},\n\nThank you for your purchase at ${shopName}!\n\nInvoice: ${invoiceNo}\nDate: ${saleDate}\nTotal: ${fmt(netTotal)}\nStatus: ${paymentStatus}\n\n${invoiceData.invoiceLink ? `View invoice: ${invoiceData.invoiceLink}\n\n` : ''}${shopPhone ? `Contact: ${shopPhone}\n` : ''}${shopAddress ? `Address: ${shopAddress}\n` : ''}\nThank you,\n${shopName}`;

  const mailOptions = {
    from: `"${shopName}" <${SENDER_EMAIL}>`,
    to: toEmail,
    replyTo: shopEmail !== SENDER_EMAIL ? shopEmail : SUPPORT_EMAIL,
    subject: `🧾 Receipt ${invoiceNo} — ${shopName}`,
    headers: baseHeaders,
    attachments: invoiceData.pdfBuffer
      ? [{ filename: `Receipt-${invoiceNo}.pdf`, content: invoiceData.pdfBuffer, contentType: 'application/pdf' }]
      : [],
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Customer Invoice] Receipt sent to ${toEmail} for ${invoiceNo} (shop: ${shopName})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Customer Invoice Error]: ${err.message}`);
    return { success: false, error: err.message };
  }
};

export const sendCustomerRepairEmail = async (toEmail, customerName, repairData) => {
  if (!toEmail) return;
  if (!transporter) await initMailer();

  const customer = customerName || 'Valued Customer';
  const jobNo = repairData.jobNo || repairData.ticketNumber || repairData.ticket_number || repairData._id || 'RPR';
  const status = repairData.status || 'Updated';
  const tenantId = repairData.tenantId || repairData.tenant_id || null;

  let shopName = SENDER_NAME;
  let shopPhone = '';
  let shopAddress = COMPANY_ADDRESS;
  let shopEmail = SENDER_EMAIL;
  let shopLogo = '';
  try {
    if (tenantId) {
      const tenant = await db('tenants').where({ id: tenantId, is_deleted: false }).first();
      if (tenant) {
        shopName = tenant.shop_name || shopName;
        shopPhone = tenant.phone || '';
        shopEmail = tenant.email || shopEmail;
      }
      const settingsRows = await db('settings')
        .where({ tenant_id: tenantId })
        .whereIn('key', ['companyAddress', 'companyLogo', 'companyPhone'])
        .select('key', 'value');
      for (const s of settingsRows) {
        try {
          const val = JSON.parse(s.value);
          if (s.key === 'companyAddress' && val) shopAddress = val;
          if (s.key === 'companyLogo' && val) shopLogo = val;
          if (s.key === 'companyPhone' && val) shopPhone = shopPhone || val;
        } catch { /* ignore */ }
      }
    }
  } catch { /* non-blocking */ }

  const statusColors = {
    PENDING: { bg: '#fef3c7', text: '#d97706' },
    IN_PROGRESS: { bg: '#e0f2fe', text: '#0284c7' },
    COMPLETED: { bg: '#d1fae5', text: '#059669' },
    DELIVERED: { bg: '#e0e7ff', text: '#4338ca' },
    CANCELLED: { bg: '#fee2e2', text: '#dc2626' },
  };
  const color = statusColors[status] || { bg: '#f1f5f9', text: '#475569' };

  const logoHtml = shopLogo
    ? `<img src="${shopLogo}" alt="${shopName}" style="height:36px;max-width:140px;object-fit:contain;margin-bottom:8px;display:block;margin:0 auto 8px;">`
    : '';

  const mailOptions = {
    from: `"${shopName}" <${SENDER_EMAIL}>`,
    to: toEmail,
    replyTo: shopEmail !== SENDER_EMAIL ? shopEmail : SUPPORT_EMAIL,
    subject: `🔧 Repair Update #${jobNo} (${status}) — ${shopName}`,
    headers: baseHeaders,
    text: `Dear ${customer},\n\nYour device repair status has been updated to: ${status}\n\nDevice: ${repairData.brand || ''} ${repairData.model || repairData.deviceModel || 'Device'}\nJob Sheet: #${jobNo}\nIssue: ${repairData.problemDescription || repairData.issueDescription || 'N/A'}\n\nPlease bring your repair claim ticket when picking up your device.\n\nThank you,\n${shopName}\n${shopAddress || ''}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',system-ui,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 36px;text-align:center;">
                  ${logoHtml}
                  <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${shopName} Service Center</div>
                  <div style="font-size:12px;color:#94a3b8;margin-top:4px;">
                    ${shopPhone ? `📞 ${shopPhone}` : ''}
                    ${shopPhone && shopAddress ? ' &nbsp;·&nbsp; ' : ''}
                    ${shopAddress ? `📍 ${shopAddress}` : ''}
                  </div>
                  <div style="margin-top:20px;display:inline-block;">
                    <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:10px 24px;display:inline-block;">
                      <div style="font-size:11px;color:#94a3b8;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Job Sheet</div>
                      <div style="font-size:18px;font-weight:700;color:#ffffff;margin-top:2px;">#${jobNo}</div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 36px;">
                  <p style="margin:0 0 16px;color:#0f172a;font-size:15px;">Dear <strong>${customer}</strong>,</p>
                  <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6;">
                    Your device repair service status has been updated:
                  </p>
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:24px;">
                    <div style="margin-bottom:12px;">
                      <span style="display:inline-block;padding:6px 14px;background:${color.bg};color:${color.text};border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;">
                        ${status}
                      </span>
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#64748b;width:120px;">Device:</td>
                        <td style="padding:4px 0;font-size:13px;font-weight:600;color:#0f172a;">${repairData.brand || ''} ${repairData.model || repairData.deviceModel || 'Device'}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#64748b;">Reported Issue:</td>
                        <td style="padding:4px 0;font-size:13px;color:#0f172a;">${repairData.problemDescription || repairData.issueDescription || 'N/A'}</td>
                      </tr>
                      ${repairData.estimatedCost ? `
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#64748b;">Estimated Cost:</td>
                        <td style="padding:4px 0;font-size:13px;font-weight:700;color:#059669;">৳${Number(repairData.estimatedCost).toLocaleString()}</td>
                      </tr>` : ''}
                    </table>
                  </div>
                  <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:4px;color:#1e40af;font-size:12px;line-height:1.5;">
                    ℹ Please bring your repair claim slip when picking up your repaired gadget from the service counter.
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 36px;text-align:center;">
                  <div style="font-size:13px;color:#0f172a;font-weight:600;margin-bottom:4px;">${shopName} Service Care</div>
                  <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">
                    Questions? Contact us at ${shopEmail}
                  </div>
                  <div style="font-size:10px;color:#cbd5e1;">
                    © ${new Date().getFullYear()} ${shopName}. All rights reserved.<br>
                    This is an automated notification.
                  </div>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Customer Repair] Update sent to ${toEmail} for ${jobNo} (shop: ${shopName})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Customer Repair Error]: ${err.message}`);
    return { success: false, error: err.message };
  }
};
