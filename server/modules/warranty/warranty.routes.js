import { Router } from 'express';
import * as warrantyController from './warranty.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { createWarrantyClaimSchema, updateWarrantyClaimSchema } from './warranty.validator.js';

const router = Router();

router.use(authenticate);
router.use(checkTenantStatus);

router.get('/report', warrantyController.getWarrantyReport);
router.get('/customer/:customerId/purchased-items', warrantyController.getCustomerPurchasedItems);
router.get('/imei/:imeiId', warrantyController.getClaimsByIMEI);
router.get('/', warrantyController.getAllClaims);
router.get('/:id', warrantyController.getClaimById);
router.post('/', validate(createWarrantyClaimSchema), warrantyController.createClaim);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate(updateWarrantyClaimSchema), warrantyController.updateClaim);

export default router;
