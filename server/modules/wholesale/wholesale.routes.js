import { Router } from 'express';
import * as wholesaleController from './wholesale.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { createWholesalePriceSchema, updateWholesalePriceSchema, createWholesaleOrderSchema, updateWholesaleOrderSchema } from './wholesale.validator.js';

const router = Router();
router.use(authenticate);

// Prices
router.get('/prices', wholesaleController.getAllPrices);
router.post('/prices', authorize('ADMIN', 'MANAGER'), validate(createWholesalePriceSchema), wholesaleController.createPrice);
router.put('/prices/:id', authorize('ADMIN', 'MANAGER'), validate(updateWholesalePriceSchema), wholesaleController.updatePrice);
router.delete('/prices/:id', authorize('ADMIN'), wholesaleController.deletePrice);

// Orders
router.get('/orders/stats', wholesaleController.getOrdersStats);
router.get('/orders', wholesaleController.getAllOrders);
router.get('/orders/:id', wholesaleController.getOrderById);
router.post('/orders', authorize('ADMIN', 'MANAGER'), validate(createWholesaleOrderSchema), wholesaleController.createOrder);
router.put('/orders/:id', authorize('ADMIN', 'MANAGER'), validate(updateWholesaleOrderSchema), wholesaleController.updateOrder);
router.post('/orders/:id/collect-due', authorize('ADMIN', 'MANAGER'), wholesaleController.collectOrderDue);
router.post('/orders/:id/return', authorize('ADMIN', 'MANAGER'), wholesaleController.processOrderReturn);
router.delete('/orders/:id', authorize('ADMIN'), wholesaleController.deleteOrder);

export default router;
