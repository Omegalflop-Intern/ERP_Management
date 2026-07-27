import nodemailer from 'nodemailer';
import { User } from '../modules/user/user.model.js';

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

const SENDER_NAME = process.env.SMTP_SENDER_NAME || 'Brothers Mobile';
const SENDER_EMAIL = process.env.SMTP_SENDER_EMAIL || process.env.SMTP_USER || 'no-reply@brothersmobile.com';
const APP_NAME = process.env.APP_NAME || 'Brothers Mobile Shop ERP';

export const sendOTPEmail = async (toEmail, otpCode, userName = '') => {
  if (!transporter) await initMailer();

  const displayName = userName || 'User';

  const mailOptions = {
    from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
    to: toEmail,
    subject: `🔐 Your Verification Code — ${APP_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;background-color:#f1f5f9;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px 40px;text-align:center;">
                    <div style="font-size:32px;margin-bottom:8px;">📱</div>
                    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">${APP_NAME}</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <p style="margin:0 0 8px;color:#64748b;font-size:15px;">Hello <strong style="color:#1e293b;">${displayName}</strong>,</p>
                    <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                      We received a request to verify your email address. Use the code below to complete verification:
                    </p>
                    <!-- OTP Box -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#fef2f2;border:2px dashed #fca5a5;border-radius:12px;padding:20px;text-align:center;">
                          <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Your Verification Code</p>
                          <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#dc2626;font-family:'Courier New',monospace;">
                            ${otpCode}
                          </div>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;line-height:1.5;">
                      This code expires in <strong style="color:#64748b;">10 minutes</strong>. If you didn't request this, you can safely ignore this email — someone may have entered your email by mistake.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                    <p style="margin:0;color:#94a3b8;font-size:12px;">
                      © ${new Date().getFullYear()} ${SENDER_NAME}. All rights reserved.
                    </p>
                    <p style="margin:4px 0 0;color:#cbd5e1;font-size:11px;">
                      This is an automated email — please do not reply.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
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
    from: `"${SENDER_NAME} Alerts" <${SENDER_EMAIL}>`,
    to: recipientString,
    subject: `🔔 [Admin Alert] ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:20px;background:#f8fafc;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <table width="560" style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
                <tr style="background:#0f172a;color:#ffffff;">
                  <td style="padding:20px 24px;">
                    <h2 style="margin:0;font-size:18px;">🔔 ${title}</h2>
                    <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">System Admin Notification • ${APP_NAME}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px;color:#334155;font-size:14px;line-height:1.6;">
                    ${detailsHtml}
                  </td>
                </tr>
                <tr style="background:#f1f5f9;color:#64748b;font-size:11px;text-align:center;">
                  <td style="padding:12px;">© ${new Date().getFullYear()} ${APP_NAME}. System Event Notification</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Admin Mailer] Alert sent to ${adminEmail}: ${subject}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Admin Mailer Error]: ${err.message}`);
    return { success: false, error: err.message };
  }
};

export const sendCustomerInvoiceEmail = async (toEmail, customerName, invoiceData) => {
  if (!toEmail) return;
  if (!transporter) await initMailer();

  const customer = customerName || 'Valued Customer';
  const invoiceNo = invoiceData.invoiceNo || 'Receipt';
  const grandTotal = invoiceData.grandTotal ? `৳${Number(invoiceData.grandTotal).toLocaleString()}` : '$0.00';

  const mailOptions = {
    from: `"${SENDER_NAME} Sales" <${SENDER_EMAIL}>`,
    to: toEmail,
    subject: `🧾 Purchase Receipt ${invoiceNo} — ${SENDER_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:20px;background:#f8fafc;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <table width="560" style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
                <tr style="background:linear-gradient(135deg,#dc2626,#b91c1c);color:#ffffff;">
                  <td style="padding:24px;text-align:center;">
                    <h2 style="margin:0;font-size:22px;">Thank You for Your Purchase!</h2>
                    <p style="margin:4px 0 0;font-size:13px;color:#fca5a5;">Invoice #${invoiceNo}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px;color:#334155;font-size:14px;line-height:1.6;">
                    <p>Dear <strong>${customer}</strong>,</p>
                    <p>Thank you for shopping at <strong>${SENDER_NAME}</strong>. Here is the summary of your transaction:</p>
                    <table width="100%" style="margin:16px 0;border-collapse:collapse;background:#f8fafc;border-radius:8px;">
                      <tr>
                        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;"><strong>Invoice Number:</strong></td>
                        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right;">${invoiceNo}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;"><strong>Total Paid / Amount:</strong></td>
                        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right;color:#dc2626;font-weight:bold;">${grandTotal}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 14px;"><strong>Payment Status:</strong></td>
                        <td style="padding:10px 14px;text-align:right;color:#166534;font-weight:bold;">${invoiceData.paymentStatus || 'Completed'}</td>
                      </tr>
                    </table>
                    <p style="font-size:12px;color:#64748b;">If you have any questions regarding your invoice or warranty, please contact support.</p>
                  </td>
                </tr>
                <tr style="background:#f1f5f9;color:#64748b;font-size:11px;text-align:center;">
                  <td style="padding:16px;">© ${new Date().getFullYear()} ${SENDER_NAME}. All rights reserved.</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Customer Invoice Email] Receipt sent to ${toEmail} for Invoice ${invoiceNo}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Customer Invoice Email Error]: ${err.message}`);
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
    from: `"${SENDER_NAME} Service" <${SENDER_EMAIL}>`,
    to: toEmail,
    subject: `🔧 Device Repair Status Update (${status}) — ${SENDER_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:20px;background:#f8fafc;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <table width="560" style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
                <tr style="background:#2563eb;color:#ffffff;">
                  <td style="padding:24px;text-align:center;">
                    <h2 style="margin:0;font-size:20px;">Device Repair Service Update</h2>
                    <p style="margin:4px 0 0;font-size:13px;color:#93c5fd;">Job Sheet #${jobNo}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px;color:#334155;font-size:14px;line-height:1.6;">
                    <p>Dear <strong>${customer}</strong>,</p>
                    <p>Your device repair status has been updated to <strong style="color:#2563eb;text-transform:uppercase;">${status}</strong>.</p>
                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;margin:16px 0;">
                      <p style="margin:0;"><strong>Device:</strong> ${repairData.brand || ''} ${repairData.model || 'Device'}</p>
                      <p style="margin:4px 0 0;"><strong>Reported Issue:</strong> ${repairData.problemDescription || 'N/A'}</p>
                      <p style="margin:4px 0 0;"><strong>Current Status:</strong> <span style="color:#1d4ed8;font-weight:bold;">${status}</span></p>
                    </div>
                    <p style="font-size:12px;color:#64748b;">Please bring your repair claim receipt when picking up your repaired device.</p>
                  </td>
                </tr>
                <tr style="background:#f1f5f9;color:#64748b;font-size:11px;text-align:center;">
                  <td style="padding:16px;">© ${new Date().getFullYear()} ${SENDER_NAME} Service Center</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Customer Repair Email] Update sent to ${toEmail} for Repair ${jobNo}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Customer Repair Email Error]: ${err.message}`);
    return { success: false, error: err.message };
  }
};
