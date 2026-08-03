import * as notificationService from './notification.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const result = await notificationService.getMyNotifications(req.user.userId, Number(page), Number(limit), unread === 'true', req.user?.tenantId || null);
    return ApiResponse.success(res, result);
  } catch (error) { next(error); }
};

export const markAsRead = async (req, res, next) => {
  try {
    const n = await notificationService.markAsRead(req.params.id, req.user.userId, req.user?.tenantId || null);
    return ApiResponse.success(res, n);
  } catch (error) { next(error); }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.userId, req.user?.tenantId || null);
    return ApiResponse.success(res, null, 'All notifications marked as read');
  } catch (error) { next(error); }
};

export const deleteNotification = async (req, res, next) => {
  try {
    await notificationService.deleteNotification(req.params.id, req.user.userId, req.user?.tenantId || null);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'notification', entityId: req.params.id, entityType: 'Notification', req });
    return ApiResponse.success(res, null, 'Notification deleted');
  } catch (error) { next(error); }
};
