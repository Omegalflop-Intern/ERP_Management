import nodemailer from 'nodemailer';

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
