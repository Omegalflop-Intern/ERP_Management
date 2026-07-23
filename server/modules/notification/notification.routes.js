import { Router } from 'express';
import * as notificationController from './notification.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', notificationController.getMyNotifications);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;
