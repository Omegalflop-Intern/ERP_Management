import { Notification } from './notification.model.js';
import { Product } from '../product/product.model.js';
import { Customer } from '../customer/customer.model.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';

export const createNotification = async ({ userId, type, title, message, link, meta }) => {
  return Notification.create({ userId, type, title, message, link, meta });
};

export const createBulkNotifications = async (userIds, { type, title, message, link, meta }) => {
  const docs = userIds.map(userId => ({ userId, type, title, message, link, meta }));
  return Notification.insertMany(docs);
};

export const syncSystemNotifications = async (userId) => {
  try {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Check total notifications for initial welcome note
    const userNotifCount = await Notification.countDocuments({ userId });
    if (userNotifCount === 0) {
      await Notification.create({
        userId,
        type: 'SYSTEM',
        title: 'System Notifications Active',
        message: 'Welcome! You will receive real-time alerts for low stock, sales, and customer dues here.',
        link: '/dashboard',
      });
    }

    // 2. Check low stock products
    const lowStockProducts = await Product.find({
      isDeleted: false,
      $or: [
        { $expr: { $lte: ['$stockQuantity', '$minStockLevel'] } },
        { stockQuantity: { $lte: 5 } },
      ],
    }).select('name stockQuantity minStockLevel').limit(10).lean();

    if (lowStockProducts.length > 0) {
      const recentLowStock = await Notification.findOne({
        userId,
        type: 'LOW_STOCK',
        createdAt: { $gte: twelveHoursAgo },
      });

      if (!recentLowStock) {
        const itemNames = lowStockProducts.map(p => p.name).slice(0, 3).join(', ');
        const extraCount = lowStockProducts.length > 3 ? ` & ${lowStockProducts.length - 3} more` : '';
        await Notification.create({
          userId,
          type: 'LOW_STOCK',
          title: `Low Stock Alert (${lowStockProducts.length} Products)`,
          message: `${itemNames}${extraCount} are below minimum stock level. Please restock soon.`,
          link: '/stock',
        });
      }
    }

    // 3. Check customer dues
    const dueCustomers = await Customer.find({
      isDeleted: { $ne: true },
      dueBalance: { $gt: 0 },
    }).select('name dueBalance').limit(10).lean();

    if (dueCustomers.length > 0) {
      const recentDueAlert = await Notification.findOne({
        userId,
        type: 'DUE_REMINDER',
        createdAt: { $gte: twentyFourHoursAgo },
      });

      if (!recentDueAlert) {
        const totalDue = dueCustomers.reduce((acc, c) => acc + (c.dueBalance || 0), 0);
        await Notification.create({
          userId,
          type: 'DUE_REMINDER',
          title: 'Pending Customer Dues',
          message: `${dueCustomers.length} customer(s) have unpaid balances totaling ৳${totalDue.toLocaleString()}.`,
          link: '/customers/due-collection',
        });
      }
    }
  } catch (err) {
    console.error('[Notification Sync Error]:', err?.message);
  }
};

export const getMyNotifications = async (userId, page = 1, limit = 20, unreadOnly = false) => {
  await syncSystemNotifications(userId);
  const query = { userId };
  if (unreadOnly) query.isRead = false;
  const total = await Notification.countDocuments(query);
  const notifications = await paginate(Notification.find(query), page, limit).sort({ createdAt: -1 });
  const unreadCount = await Notification.countDocuments({ userId, isRead: false });
  return { notifications, unreadCount, pagination: getPagination(total, page, limit) };
};

export const markAsRead = async (id, userId) => {
  return Notification.findOneAndUpdate({ _id: id, userId }, { isRead: true }, { new: true });
};

export const markAllAsRead = async (userId) => {
  return Notification.updateMany({ userId, isRead: false }, { isRead: true });
};

export const deleteNotification = async (id, userId) => {
  return Notification.findOneAndDelete({ _id: id, userId });
};
