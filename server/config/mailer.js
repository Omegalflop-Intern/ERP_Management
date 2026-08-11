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

const SENDER_NAME = process.env.SMTP_SENDER_NAME || 'Omegaflop Business Suite';
const SENDER_EMAIL = process.env.SMTP_SENDER_EMAIL || process.env.SMTP_USER || 'no-reply@omegaflop.com';
const APP_NAME = process.env.APP_NAME || 'Omegaflop Business Suite';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || SENDER_EMAIL;
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || '';

const baseHeaders = {
  'X-Mailer': 'Omegaflop-Mailer/1.0',
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
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
          <tr><td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0e0e0;">
              <tr>
                <td style="background:#1a1a2e;padding:24px 32px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">${SENDER_NAME}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <p style="margin:0 0 16px;color:#333;font-size:14px;">Hello <strong>${displayName}</strong>,</p>
                  <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.6;">
                    We received a request to verify your email address. Please use the code below:
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:#f8f8f8;border:2px solid #1a1a2e;padding:16px;text-align:center;">
                        <p style="margin:0 0 6px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Verification Code</p>
                        <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#1a1a2e;font-family:'Courier New',monospace;">
                          ${otpCode}
                        </div>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:20px 0 0;color:#888;font-size:12px;">
                    This code expires in 10 minutes. If you did not request this, please ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background:#f8f8f8;border-top:1px solid #e0e0e0;padding:16px 32px;text-align:center;">
                  <p style="margin:0;color:#999;font-size:11px;">
                    &copy; ${new Date().getFullYear()} ${SENDER_NAME}. All rights reserved.
                  </p>
                  ${addressBlock}
                  <p style="margin:4px 0 0;color:#bbb;font-size:10px;">
                    This is an automated email. Please do not reply.
                  </p>
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
    subject: `Password Reset Request - ${SENDER_NAME}`,
    headers: baseHeaders,
    text: `Hello ${displayName},\n\nYou requested a password reset. Click the link below:\n\n${resetLink}\n\nThis link expires in 1 hour.\n\nIf you did not request this, please ignore this email.\n\nThank you,\n${SENDER_NAME}\n${COMPANY_ADDRESS || ''}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
          <tr><td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0e0e0;">
              <tr>
                <td style="background:#1a1a2e;padding:24px 32px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">${SENDER_NAME}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <p style="margin:0 0 16px;color:#333;font-size:14px;">Hello <strong>${displayName}</strong>,</p>
                  <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.6;">
                    We received a password reset request for your account. Click the button below to reset your password.
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding:8px 0 20px;">
                        <a href="${resetLink}" style="display:inline-block;padding:12px 32px;background:#1a1a2e;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 8px;color:#888;font-size:12px;">Or copy this link into your browser:</p>
                  <p style="margin:0 0 20px;color:#1a1a2e;font-size:11px;word-break:break-all;background:#f8f8f8;padding:10px;border:1px solid #e0e0e0;font-family:'Courier New',monospace;">
                    ${resetLink}
                  </p>
                  <p style="margin:0;color:#888;font-size:12px;">
                    This link expires in 1 hour. If you did not request this, please ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background:#f8f8f8;border-top:1px solid #e0e0e0;padding:16px 32px;text-align:center;">
                  <p style="margin:0;color:#999;font-size:11px;">
                    &copy; ${new Date().getFullYear()} ${SENDER_NAME}. All rights reserved.
                  </p>
                  ${addressBlock}
                  <p style="margin:4px 0 0;color:#bbb;font-size:10px;">
                    This is an automated email. Please do not reply.
                  </p>
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
  const invoiceNo = invoiceData.invoiceNo || 'Receipt';
  const grandTotal = invoiceData.grandTotal ? `\u09F3${Number(invoiceData.grandTotal).toLocaleString()}` : '\u09F30';

  const mailOptions = {
    from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
    to: toEmail,
    replyTo: SUPPORT_EMAIL,
    subject: `Purchase Receipt ${invoiceNo} - ${SENDER_NAME}`,
    headers: baseHeaders,
    text: `Dear ${customer},\n\nThank you for your purchase at ${SENDER_NAME}.\n\nInvoice: ${invoiceNo}\nTotal: ${grandTotal}\nStatus: ${invoiceData.paymentStatus || 'Completed'}\n\n${invoiceData.invoiceLink || ''}\n\nThank you,\n${SENDER_NAME}\n${COMPANY_ADDRESS || ''}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0e0e0;">
              <tr>
                <td style="background:#1a1a2e;padding:24px 32px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">Thank You for Your Purchase!</h1>
                  <p style="margin:6px 0 0;color:#aaa;font-size:12px;">Invoice #${invoiceNo}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <p style="margin:0 0 16px;color:#333;font-size:14px;">Dear <strong>${customer}</strong>,</p>
                  <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.6;">
                    Thank you for shopping at <strong>${SENDER_NAME}</strong>. Here is your transaction summary:
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid #e0e0e0;">
                    <tr style="background:#f8f8f8;">
                      <td style="padding:10px 14px;border-bottom:1px solid #e0e0e0;color:#555;font-size:13px;">Invoice Number</td>
                      <td style="padding:10px 14px;border-bottom:1px solid #e0e0e0;text-align:right;font-weight:700;color:#333;font-size:13px;">${invoiceNo}</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 14px;border-bottom:1px solid #e0e0e0;color:#555;font-size:13px;">Total Amount</td>
                      <td style="padding:10px 14px;border-bottom:1px solid #e0e0e0;text-align:right;color:#c00;font-weight:700;font-size:15px;">${grandTotal}</td>
                    </tr>
                    <tr style="background:#f8f8f8;">
                      <td style="padding:10px 14px;color:#555;font-size:13px;">Payment Status</td>
                      <td style="padding:10px 14px;text-align:right;color:#1a7a1a;font-weight:700;font-size:13px;">${invoiceData.paymentStatus || 'Completed'}</td>
                    </tr>
                  </table>
                  ${invoiceData.invoiceLink ? `
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding:8px 0 16px;">
                        <a href="${invoiceData.invoiceLink}" style="display:inline-block;padding:10px 28px;background:#1a1a2e;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;">
                          View Invoice
                        </a>
                      </td>
                    </tr>
                  </table>` : ''}
                  <p style="margin:0;color:#888;font-size:12px;">If you have any questions, please contact our support team.</p>
                </td>
              </tr>
              <tr>
                <td style="background:#f8f8f8;border-top:1px solid #e0e0e0;padding:16px 32px;text-align:center;">
                  <p style="margin:0;color:#999;font-size:11px;">
                    &copy; ${new Date().getFullYear()} ${SENDER_NAME}. All rights reserved.
                  </p>
                  ${addressBlock}
                  <p style="margin:4px 0 0;color:#bbb;font-size:10px;">
                    This is an automated email. Please do not reply.
                  </p>
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
    console.log(`[Customer Invoice] Receipt sent to ${toEmail} for ${invoiceNo}`);
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
  const jobNo = repairData.jobNo || repairData._id || 'Repair Job';
  const status = repairData.status || 'Updated';

  const mailOptions = {
    from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
    to: toEmail,
    replyTo: SUPPORT_EMAIL,
    subject: `Repair Status Update (${status}) - ${SENDER_NAME}`,
    headers: baseHeaders,
    text: `Dear ${customer},\n\nYour device repair status has been updated to: ${status}\n\nDevice: ${repairData.brand || ''} ${repairData.model || 'Device'}\nIssue: ${repairData.problemDescription || 'N/A'}\nJob Sheet: ${jobNo}\n\nPlease bring your repair claim receipt when picking up your device.\n\nThank you,\n${SENDER_NAME}\n${COMPANY_ADDRESS || ''}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0e0e0;">
              <tr>
                <td style="background:#1a1a2e;padding:24px 32px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">Device Repair Service Update</h1>
                  <p style="margin:6px 0 0;color:#aaa;font-size:12px;">Job Sheet #${jobNo}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <p style="margin:0 0 16px;color:#333;font-size:14px;">Dear <strong>${customer}</strong>,</p>
                  <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.6;">
                    Your device repair status has been updated to <strong style="text-transform:uppercase;">${status}</strong>.
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#f0f4ff;border:1px solid #c0d0e8;">
                    <tr>
                      <td style="padding:16px;">
                        <p style="margin:0 0 6px;color:#333;font-size:13px;"><strong>Device:</strong> ${repairData.brand || ''} ${repairData.model || 'Device'}</p>
                        <p style="margin:0 0 6px;color:#333;font-size:13px;"><strong>Reported Issue:</strong> ${repairData.problemDescription || 'N/A'}</p>
                        <p style="margin:0;color:#333;font-size:13px;"><strong>Current Status:</strong> <strong style="color:#0055aa;">${status}</strong></p>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0;color:#888;font-size:12px;">Please bring your repair claim receipt when picking up your repaired device.</p>
                </td>
              </tr>
              <tr>
                <td style="background:#f8f8f8;border-top:1px solid #e0e0e0;padding:16px 32px;text-align:center;">
                  <p style="margin:0;color:#999;font-size:11px;">
                    &copy; ${new Date().getFullYear()} ${SENDER_NAME} Service Center
                  </p>
                  ${addressBlock}
                  <p style="margin:4px 0 0;color:#bbb;font-size:10px;">
                    This is an automated email. Please do not reply.
                  </p>
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
    console.log(`[Customer Repair] Update sent to ${toEmail} for ${jobNo}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Customer Repair Error]: ${err.message}`);
    return { success: false, error: err.message };
  }
};
