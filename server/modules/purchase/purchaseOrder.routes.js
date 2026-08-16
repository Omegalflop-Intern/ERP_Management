import { Router } from 'express';
import * as purchaseOrderController from './purchaseOrder.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { createPurchaseOrderSchema, updatePurchaseOrderSchema, receiveGoodsSchema } from './purchaseOrder.validator.js';

const router = Router();

router.use(authenticate);
router.use(checkTenantStatus);

router.get('/', purchaseOrderController.getAllPurchaseOrders);
router.get('/:id', purchaseOrderController.getPurchaseOrderById);
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createPurchaseOrderSchema), purchaseOrderController.createPurchaseOrder);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate(updatePurchaseOrderSchema), purchaseOrderController.updatePurchaseOrder);
router.post('/:id/receive', authorize('ADMIN', 'MANAGER'), validate(receiveGoodsSchema), purchaseOrderController.receiveGoods);
router.post('/:id/return', authorize('ADMIN', 'MANAGER'), purchaseOrderController.returnToSupplier);
router.post('/:id/pay-due', authorize('ADMIN', 'MANAGER'), purchaseOrderController.payPurchaseOrderDue);
router.delete('/:id', authorize('ADMIN'), purchaseOrderController.deletePurchaseOrder);

export default router;
