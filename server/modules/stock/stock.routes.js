import { Router } from 'express';
import * as stockController from './stock.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { createTransferSchema, updateTransferStatusSchema } from './stock.validator.js';

const router = Router();

router.use(authenticate);
router.use(checkTenantStatus);

router.get('/', stockController.getAllTransfers);
router.get('/:id', stockController.getTransferById);
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createTransferSchema), stockController.createTransfer);
router.patch('/:id/status', authorize('ADMIN', 'MANAGER'), validate(updateTransferStatusSchema), stockController.updateTransferStatus);
router.delete('/:id', authorize('ADMIN'), stockController.deleteTransfer);

export default router;
