import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { sendAdminNotificationEmail } from '../../config/mailer.js';

export const submitContactForm = async (data) => {
  if (!data.name || !data.phone || !data.message) {
    throw ApiError.badRequest('Name, phone number, and message are required.');
  }

  const [id] = await db('contact_messages').insert({
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    shop_name: data.shopName || null,
    message: data.message,
    status: 'PENDING',
    is_deleted: false,
  });

  // Trigger Email Notification to Admins via Nodemailer
  const mailSubject = `[OmniManage Inquiry] New Contact Message from ${data.name}`;
  const mailTitle = `New Contact Inquiry Received`;
  const detailsHtml = `
    <h3>New Inquiry Details</h3>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Phone:</strong> ${data.phone}</p>
    <p><strong>Email:</strong> ${data.email || 'N/A'}</p>
    <p><strong>Shop Name:</strong> ${data.shopName || 'N/A'}</p>
    <p><strong>Message:</strong></p>
    <blockquote style="background:#f4f4f4;padding:12px;border-left:4px solid #f97316;">${data.message}</blockquote>
  `;

  sendAdminNotificationEmail(mailSubject, mailTitle, detailsHtml).catch((err) =>
    console.error('[Contact Mail Alert Error]:', err.message)
  );

  return { id, message: 'Contact inquiry submitted successfully' };
};

export const getContactMessages = async () => {
  const rows = await db('contact_messages')
    .where({ is_deleted: false })
    .orderBy('created_at', 'desc');

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email || '',
    shopName: r.shop_name || '',
    message: r.message,
    status: r.status,
    createdAt: r.created_at,
  }));
};

export const updateContactStatus = async (id, status) => {
  await db('contact_messages').where({ id }).update({ status });
  return { id, status };
};
